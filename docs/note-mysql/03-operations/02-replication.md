---
title: "2. 主从复制"
---

## 2.1 概述

MySQL 复制把源库（source）的 binlog 事件传到副本（replica），由副本应用。日常也称主库、从库。默认复制是异步的，**源库提交成功不等于副本已经收到或应用了事务**。

![概述](/note-mysql/assets/1684128112951-0cd4b40b-a815-437d-9bd6-c18096fbd133.png)

复制可以支持读扩展、备份分担和故障切换方案，但还需考虑：

- 读写分离可能读到延迟数据，需要读己之写等一致性策略。
- 故障切换不是自动具备的能力，要检测故障、选择合适副本、隔离旧主库并调整连接。
- 在副本备份仍会消耗资源，并需处理复制进度和一致性，不能视为零成本。
- 误删和错误写入通常也会被复制，复制不能代替独立备份。

[复制实现与限制](https://dev.mysql.com/doc/refman/8.4/en/replication.html)

## 2.2 原理

![原理](/note-mysql/assets/1684128165471-d3a65879-da12-489e-bd0f-c8496e40ef7b.png)

1. 源库按日志和事务规则产生 binlog 事件。
2. 副本的接收线程从源库拉取事件，写入本地 relay log。
3. 副本的应用线程读取 relay log，应用数据变更；也可以由协调线程和多个工作线程并行应用。

接收与应用是两个阶段，因此收到某个 GTID 不等于那个事务已经在副本上可见。链式复制还需要中间节点保留并记录向下游提供的变更。[复制线程](https://dev.mysql.com/doc/refman/8.4/en/replication-threads.html)

## 2.3 搭建

### 准备

以下是 **两个全新空实例** 的 MySQL 8.4 / InnoDB 实验，采用 GTID 自动定位。示例地址、密码和证书路径必须替换为实际值；源库与副本应互通，并使用匹配的服务器证书。

已有业务数据时，先通过一致性备份、克隆等方式初始化副本，并正确处理快照对应的 GTID 状态；不能把一个空副本直接接到已有源库，就假定历史数据会自动补齐。在线开启 GTID 也需要专门的切换流程。[GTID 复制配置](https://dev.mysql.com/doc/refman/8.4/en/replication-gtids-howto.html)

![旧环境中的复制拓扑示例](/note-mysql/assets/1684130779942-736e38ee-e197-4b09-8d67-ff84e1d104ba.png)

### 主库准备

1. 在源库配置中设置唯一的 `server_id`，开启 binlog、GTID 及一致性检查，再按安装方式启动实例。

```ini
[mysqld]
server-id=1
log-bin=binlog
gtid-mode=ON
enforce-gtid-consistency=ON
```

`server_id` 在复制拓扑中应唯一，使用非零值，范围为 `1` 到 `2^32 - 1`。独立初始化的实例也应具有不同的 `server_uuid`；不要直接复制运行中的数据目录并手改 `auto.cnf` 来代替正确的副本初始化。

1. 创建仅允许副本主机连接的复制账号。MySQL 8.4 默认使用 `caching_sha2_password`，不再照抄默认已禁用的 `mysql_native_password` 配置。

```sql
CREATE USER 'repl'@'192.0.2.20'
IDENTIFIED BY 'REPLACE_WITH_STRONG_PASSWORD' REQUIRE SSL;
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'192.0.2.20';
```

`REPLICATION SLAVE` 仍是这里使用的权限名称，不应机械替换成不存在的 `REPLICATION REPLICA`。

1. 查看当前源库状态：

```sql
SHOW BINARY LOG STATUS;
SELECT @@server_id, @@server_uuid, @@gtid_mode, @@gtid_executed;
```

![旧版按文件位置配置复制的示例](/note-mysql/assets/1684130963675-1da0aca0-b2cd-4fd1-8a1f-42fb70c0c2c0.png)

GTID 自动定位不手填截图中的日志文件和位置。按文件位置配置也是另一种方式，但必须使用与初始化快照严格对应的实际坐标。

### 从库配置

1. 在新副本配置中设置不同的编号，开启 GTID，并限制客户端写入：

```ini
[mysqld]
server-id=2
log-bin=binlog
gtid-mode=ON
enforce-gtid-consistency=ON
read-only=ON
super-read-only=ON
```

`read_only` 允许某些高权限客户端写入，`super_read_only` 进一步限制它们；复制应用线程仍能工作。只读配置不是取代账号权限和主库隔离的完整方案。

1. 在副本上配置连接。CA 文件须存在于副本服务器，并与源库证书对应；`SOURCE_HOST` 应与证书身份匹配。复制账号应使用强密码，同时遵守 MySQL 8.4 中 `SOURCE_PASSWORD` 最长 32 个字符的限制。

```sql
CHANGE REPLICATION SOURCE TO
    SOURCE_HOST = 'db-source.example.test',
    SOURCE_PORT = 3306,
    SOURCE_USER = 'repl',
    SOURCE_PASSWORD = 'REPLACE_WITH_STRONG_PASSWORD',
    SOURCE_AUTO_POSITION = 1,
    SOURCE_SSL = 1,
    SOURCE_SSL_CA = '/etc/mysql/certs/ca.pem',
    SOURCE_SSL_VERIFY_SERVER_CERT = 1;

START REPLICA;
SHOW REPLICA STATUS;
```

修改已有通道前，按相应参数要求停止线程并评估接续位置；不要直接覆盖正在工作的复制配置。使用安全连接也让默认认证插件能够完成密码交换，而不必为兼容旧教程降级认证。[连接参数及 TLS 验证](https://dev.mysql.com/doc/refman/8.4/en/change-replication-source-to.html)

![旧环境中的复制连接配置](/note-mysql/assets/1684131033564-1b738c26-1b1e-468c-a02b-d1d3ef1b5ea7.png)

1. 查看接收、应用和错误信息：

| 状态                                        | 检查目的                                     |
| ------------------------------------------- | -------------------------------------------- |
| `Replica_IO_Running`、`Replica_SQL_Running` | 接收与应用线程是否运行                       |
| `Last_IO_Error`、`Last_SQL_Error`           | 连接和应用是否出现错误                       |
| `Retrieved_Gtid_Set`、`Executed_Gtid_Set`   | 区分已接收与已执行事务                       |
| `Seconds_Behind_Source`                     | 延迟的一个指标，不能单独证明无延迟或数据一致 |

![复制状态示例](/note-mysql/assets/1684131070718-6c5f441b-8426-4adc-b923-ca99634fe63e.png)

并行应用错误还需检查 Performance Schema 中的工作线程状态。线程显示运行也不能代替业务数据校验。

### 测试

仅在源库创建测试数据：

```sql
CREATE DATABASE repl_demo CHARACTER SET utf8mb4;
CREATE TABLE repl_demo.tb_user (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL
) ENGINE = InnoDB;
INSERT INTO repl_demo.tb_user (name) VALUES ('Tom'), ('Dawn');
SELECT @@global.gtid_executed;
```

在副本上等待源库刚才返回的 GTID 集，再查询数据；替换占位值后执行：

```sql
SELECT WAIT_FOR_EXECUTED_GTID_SET('REPLACE_WITH_SOURCE_GTID_SET', 10);
SELECT id, name FROM repl_demo.tb_user ORDER BY id;
```

等待返回 `0` 表示该 GTID 集已执行，`1` 表示超时；它只证明所等待的进度，不自动比较两端全部数据。最后检查测试记录及复制错误，并验证副本的普通客户端写入被拒绝。
