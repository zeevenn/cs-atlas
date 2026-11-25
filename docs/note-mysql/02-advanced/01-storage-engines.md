---
title: "1. 存储引擎"
---

## 1.1 MySQL 体系结构

![MySQL 体系结构](/note-mysql/assets/1683535413569-762b9373-876c-43bf-8f2e-17773381c252.png)

- **连接层**：处理连接、身份认证和权限检查。
- **服务层**：解析 SQL、生成执行计划，并调用存储引擎。视图、存储过程等功能也由服务器层管理。
- **引擎层**：提供数据和索引的存取接口，不同引擎支持的事务、锁和索引能力不同。
- **文件与存储**：表空间、日志等文件最终由操作系统和存储设备保存。

MySQL 从 8.0 起已经移除查询缓存，不能把旧架构图里的查询缓存当成 8.4 的处理步骤。[查询缓存移除说明](https://dev.mysql.com/doc/refman/8.0/en/mysql-nutshell.html)

## 1.2 存储引擎简介

存储引擎主要按表选择：同一数据库中的不同表可以使用不同引擎。

```sql
SHOW ENGINES;
SHOW CREATE TABLE employee;
```

![存储引擎简介](/note-mysql/assets/1683535877857-2f3faa97-74a5-4dc5-979a-d97f1bd1ae5e.png)

## 1.3 存储引擎特点

### 1.3.1 InnoDB

InnoDB 是 MySQL 8.4 的默认存储引擎，支持事务、崩溃恢复、行级锁和外键，适合大多数业务表。

启用 `innodb_file_per_table` 时，新建的普通 InnoDB 表通常使用独立的 `.ibd` 表空间，保存该表的数据和索引。表也可以位于共享或通用表空间中，所以不能认定每张 InnoDB 表都一定对应独立文件。MySQL 8.0 起使用事务型数据字典，不再用 `.frm` 文件保存表定义。[独立表空间](https://dev.mysql.com/doc/refman/8.4/en/innodb-file-per-table-tablespaces.html)

![InnoDB](/note-mysql/assets/1683536413473-fa87f88b-5b43-4a26-877a-f521e806df9c.png)

### 1.3.2 MyISAM

MyISAM 不支持事务和外键，主要采用表级锁。已有系统可能仍使用它，但不能笼统认为它比 InnoDB 更快。

| 文件   | 内容   |
| ------ | ------ |
| `.MYD` | 表数据 |
| `.MYI` | 索引   |

表定义由 MySQL 数据字典管理。[MyISAM 官方说明](https://dev.mysql.com/doc/refman/8.4/en/myisam-storage-engine.html)

### 1.3.3 Memory

Memory 把表数据放在内存中，服务器重启后数据丢失，但表定义仍然保留。它支持 `HASH` 和 `BTREE` 索引，默认使用 `HASH`，不支持事务和外键，采用表级锁。

用户创建的 Memory 表与优化器自动创建的内部临时表是两回事；MySQL 8.4 的内部临时表通常使用 TempTable 或 InnoDB。[Memory 引擎](https://dev.mysql.com/doc/refman/8.4/en/memory-storage-engine.html)

![Memory](/note-mysql/assets/1683536750860-9e1e126d-5a26-4ce8-a7de-27802b01abe2.png)

## 1.4 存储引擎选择

优先使用 InnoDB。只有明确需要其他引擎的特性，并验证了恢复能力、并发行为和性能，才考虑切换。Memory 适合允许丢失且可重建的数据；MyISAM 更多见于既有系统，不应仅凭「查询多」就替换 InnoDB。

## 1.5 MySQL 安装（Linux）

安装包必须匹配发行版、CPU 架构和目标版本。按 [MySQL 8.4 官方 Linux 安装说明](https://dev.mysql.com/doc/refman/8.4/en/linux-installation.html) 选择 APT、Yum 或其他安装方式；服务名、初始密码获取方式以实际安装包为准。

1. 安装支持当前发行版的 MySQL 8.4 软件包。
2. 启动服务，按安装说明完成初始密码设置。
3. 连接服务器，确认版本与默认引擎。

```sh
mysql -u root -p
```

```sql
SELECT VERSION(), @@default_storage_engine;
```

应用连接使用单独账号，只授予所需数据库或表的权限。不要为了远程访问而创建对所有主机开放、拥有全部权限的 `root` 账号，也不要通过关闭密码校验来适配示例密码。

下面保留原资料中 MySQL 8.0.33 / EL7 的安装界面，便于识别旧版资料；其包名和安装步骤不适用于所有 Linux 环境。

![旧版 MySQL 8.0.33 下载界面](/note-mysql/assets/1683537579804-ad80e0f5-f02a-426e-9954-56bf1f4856cf.png)

![旧版 EL7 RPM 安装包示例](/note-mysql/assets/1683538077872-9e304a27-84d0-4787-8efb-2bc2687dadf8.png)
