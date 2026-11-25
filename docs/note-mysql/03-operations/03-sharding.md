---
title: "3. 分库分表"
---

## 3.1 介绍

### 3.1.1 问题分析

![单实例资源瓶颈示意](/note-mysql/assets/1684131667223-1d3c10ec-fcac-4588-a3d8-c4d1ede94535.png)

数据量、热点和请求增长，可能使 I/O、CPU、内存、锁竞争或容量成为瓶颈。先通过监控和执行计划定位问题，再评估索引、SQL、归档、缓存、读扩展等方案；不是数据变多就必须分库分表。

![拆分后的数据分布示意](/note-mysql/assets/1684131731892-2dee07ba-8232-488d-a2ca-d55b2c06b5ab.png)

拆分可以分担容量和访问压力，也会引入路由、跨节点事务、连接与聚合、全局唯一性、扩容迁移及运维成本。只在同一实例内分表，不会自动获得更多机器的 CPU 和内存。

### 3.1.2 拆分策略

![拆分策略](/note-mysql/assets/1684132373667-566a1876-197e-4dd2-9d8a-bd927fe1d029.png)

| 维度       | 拆分方式                                               |
| ---------- | ------------------------------------------------------ |
| 垂直拆分   | 按业务表或字段拆分                                     |
| 水平拆分   | 按分片键及规则拆分记录                                 |
| 分库、分表 | 描述目标库表的组织方式；分库不一定等于部署在不同机器上 |

### 3.1.3 垂直拆分

**垂直分库**：把不同业务的表分到不同库，例如订单库和用户库。它有助于隔离业务，但跨业务查询及事务需要重新设计。

![按业务表垂直分库](/note-mysql/assets/1684132416195-8bc94a86-a2c6-4420-a3e2-6e109d3be242.png)

**垂直分表**：按字段拆开一张表，例如基本信息与大字段详情通过同一个业务主键关联。还原完整记录需要按键连接，不是把两张表做行的并集。

![按字段垂直分表](/note-mysql/assets/1684132501677-428ac35b-042a-4591-8261-9500ad5b1a1d.png)

### 3.1.4 水平拆分

**水平分库**：把同类记录按分片键放到多个物理库，通常保留相同或兼容的表结构。

![水平分库](/note-mysql/assets/1684132592195-2e7068d7-37c0-418e-9241-aa2f4703ab69.png)

**水平分表**：把同类记录分到多张同结构表中，可以位于同库，也可以与分库组合。

![水平分表](/note-mysql/assets/1684132634861-37db8e53-f0cf-4ae9-a927-b6a5964528a9.png)

分片键、路由规则和实际数据分布决定负载是否均衡。相关表使用相同关联键路由，可以减少部分跨分片访问，但不自动解决所有连接和一致性问题。

### 3.1.5 实现技术

| 方式       | 例子                           | 需要考虑                                                               |
| ---------- | ------------------------------ | ---------------------------------------------------------------------- |
| 客户端集成 | ShardingSphere-JDBC            | 通过 JDBC 等接口集成，路由能力和配置进入应用环境，并不要求必须通过 AOP |
| 独立代理   | ShardingSphere-Proxy、Mycat 等 | 应用连接代理，仍需验证 SQL、事务、协议和连接池兼容性                   |

不能不经测试就断言某种方式一定更快，或引入代理后业务代码完全无需调整。[ShardingSphere 官方概述](https://shardingsphere.apache.org/document/current/en/overview/)

![实现技术](/note-mysql/assets/1684132847430-534e6b0d-2a93-41dd-99d2-fa2f27f724e8.png)

## 3.2 Mycat 概述

Mycat 是数据库中间件，可接收客户端请求并按配置路由到后端。应用仍需理解分片键、跨分片操作、事务边界和故障处理，不能把它视为对所有 SQL 都完全透明。

**本章配置属于 Mycat 1.x 的 XML 配置体系，不是 Mycat 2 的通用配置。** 概念与 MySQL 8.4 的知识核对分开处理；下列配置不能据此认定已兼容任何 Mycat 发行包、JDBC 驱动和 MySQL 8.4 认证组合。[Mycat-Server 项目与配置](https://github.com/MyCATApache/Mycat-Server)

![Mycat 概述](/note-mysql/assets/1684132892710-d9cace9d-4d62-4127-a62f-533de44556e9.png)

### 3.2.1 安装

先确定 Mycat 发行版本，再按该版本要求准备 JDK、启动方式及后端驱动，并核对后端 MySQL 的认证与 TLS 能力。不要为适配旧代理而直接降低生产数据库的认证或传输保护。

![旧版 Mycat 安装环境示例](/note-mysql/assets/1684132973833-dfe2d67a-185d-41b4-b5b5-1077714680cf.png)

原资料附录保留作旧版本参考：[MyCat 安装文档.pdf](https://www.yuque.com/attachments/yuque/0/2023/pdf/35653686/1684133124805-2bbdf19c-cb4a-436d-8f1e-e36f3558bc05.pdf?_lake_card=%7B%22src%22%3A%22https%3A%2F%2Fwww.yuque.com%2Fattachments%2Fyuque%2F0%2F2023%2Fpdf%2F35653686%2F1684133124805-2bbdf19c-cb4a-436d-8f1e-e36f3558bc05.pdf%22%2C%22name%22%3A%22MyCat%E5%AE%89%E8%A3%85%E6%96%87%E6%A1%A3.pdf%22%2C%22size%22%3A658633%2C%22ext%22%3A%22pdf%22%2C%22source%22%3A%22%22%2C%22status%22%3A%22done%22%2C%22download%22%3Atrue%2C%22taskId%22%3A%22uf569e9fb-0266-4f23-9876-aefec7a3a61%22%2C%22taskType%22%3A%22upload%22%2C%22type%22%3A%22application%2Fpdf%22%2C%22__spacing%22%3A%22both%22%2C%22mode%22%3A%22title%22%2C%22id%22%3A%22JXxrS%22%2C%22margin%22%3A%7B%22top%22%3Atrue%2C%22bottom%22%3Atrue%7D%2C%22card%22%3A%22file%22%7D)。具体环境要求以实际使用版本的项目文档为准。

### 3.2.2 概念介绍

![概念介绍](/note-mysql/assets/1684135201347-bc6c2e6d-0000-46a9-9863-1ebd1d19fbaf.png)

- 逻辑库、逻辑表：客户端看到的入口。
- 分片规则：根据分片键计算目标节点。
- 数据节点：将逻辑目标映射到某个物理库。
- 后端数据源：实际连接的数据库实例，数据仍由这些实例存储。

## 3.3 Mycat 入门

### 3.3.1 需求

把逻辑表 `TB_ORDER` 按 `id` 范围路由到三个数据节点。这里演示路由关系，不把它当作完整的生产部署、迁移或容灾方案。

![需求](/note-mysql/assets/1684135557698-f316e8a3-4e0c-425d-8bff-9649a91ec2cc.png)

### 3.3.2 环境准备

![环境准备](/note-mysql/assets/1684135730946-32eca814-b222-44a1-a9fc-d74c3e0dce9e.png)

在三个独立的实验后端分别创建相同物理库表。下面的主键只保证各分片内唯一，跨分片唯一性仍需统一的编号与路由规则。

```sql
CREATE DATABASE db01 CHARACTER SET utf8mb4;
CREATE TABLE db01.TB_ORDER (
    id BIGINT PRIMARY KEY,
    title VARCHAR(100) NOT NULL
) ENGINE = InnoDB;
```

为 Mycat 建立受限的后端账号，只授予实验表所需的读写权限。前端连接 Mycat 的账号与 Mycat 连接后端的账号是两套凭据。

### 3.3.3 配置

以下示意使用 Mycat 1.x 的 `schema.xml`、`rule.xml`、范围映射文件和 `server.xml`。数据库地址、账号、密码及 JDBC/TLS 配置均需替换并在指定版本验证；片段应合并到该发行包的配置中。

`schema.xml` 中的逻辑表与数据节点：

```xml
<?xml version="1.0"?>
<!DOCTYPE mycat:schema SYSTEM "schema.dtd">
<mycat:schema xmlns:mycat="http://io.mycat/">
    <schema name="DB01" checkSQLschema="true" sqlMaxLimit="100">
        <table name="TB_ORDER" primaryKey="id"
               dataNode="dn1,dn2,dn3" rule="auto-sharding-long" />
    </schema>
    <dataNode name="dn1" dataHost="host1" database="db01" />
    <dataNode name="dn2" dataHost="host2" database="db01" />
    <dataNode name="dn3" dataHost="host3" database="db01" />
    <dataHost name="host1" maxCon="20" minCon="1" balance="0"
              writeType="0" dbType="mysql" dbDriver="jdbc" switchType="-1">
        <heartbeat>SELECT 1</heartbeat>
        <writeHost host="backend1"
            url="jdbc:mysql://db1.example.test:3306/db01?sslMode=VERIFY_IDENTITY&amp;characterEncoding=UTF-8"
            user="mycat_app" password="REPLACE_WITH_BACKEND_PASSWORD" />
    </dataHost>
    <dataHost name="host2" maxCon="20" minCon="1" balance="0"
              writeType="0" dbType="mysql" dbDriver="jdbc" switchType="-1">
        <heartbeat>SELECT 1</heartbeat>
        <writeHost host="backend2"
            url="jdbc:mysql://db2.example.test:3306/db01?sslMode=VERIFY_IDENTITY&amp;characterEncoding=UTF-8"
            user="mycat_app" password="REPLACE_WITH_BACKEND_PASSWORD" />
    </dataHost>
    <dataHost name="host3" maxCon="20" minCon="1" balance="0"
              writeType="0" dbType="mysql" dbDriver="jdbc" switchType="-1">
        <heartbeat>SELECT 1</heartbeat>
        <writeHost host="backend3"
            url="jdbc:mysql://db3.example.test:3306/db01?sslMode=VERIFY_IDENTITY&amp;characterEncoding=UTF-8"
            user="mycat_app" password="REPLACE_WITH_BACKEND_PASSWORD" />
    </dataHost>
</mycat:schema>
```

JDBC 示例要求相应驱动支持这些连接属性，并正确配置可信 CA 与服务器身份验证；连接池参数只是实验示意。`switchType="-1"` 不开启自动切换，不能因此宣称已提供高可用。

在 `rule.xml` 中定义表规则及算法：

```xml
<?xml version="1.0"?>
<!DOCTYPE mycat:rule SYSTEM "rule.dtd">
<mycat:rule xmlns:mycat="http://io.mycat/">
    <tableRule name="auto-sharding-long">
        <rule>
            <columns>id</columns>
            <algorithm>order-id-range</algorithm>
        </rule>
    </tableRule>
    <function name="order-id-range" class="io.mycat.route.function.AutoPartitionByLong">
        <property name="mapFile">order-id-ranges.txt</property>
    </function>
</mycat:rule>
```

`order-id-ranges.txt` 使用不重叠的闭区间，右侧数字对应 `dataNode` 列表中从 `0` 开始的下标：

```text
0-5000000=0
5000001-10000000=1
10000001-15000000=2
```

这些范围是本例明确配置的，不是选择 `auto-sharding-long` 后自动得到的通用边界。[规则配置](https://github.com/MyCATApache/Mycat-Server/blob/master/src/main/resources/rule.xml) · [范围算法实现](https://github.com/MyCATApache/Mycat-Server/blob/master/src/main/java/io/mycat/route/function/AutoPartitionByLong.java)

`server.xml` 中的前端账号片段：

```xml
<mycat:server xmlns:mycat="http://io.mycat/">
    <user name="app">
        <property name="password">REPLACE_WITH_CLIENT_PASSWORD</property>
        <property name="schemas">DB01</property>
    </user>
    <user name="reader">
        <property name="password">REPLACE_WITH_READER_PASSWORD</property>
        <property name="schemas">DB01</property>
        <property name="readOnly">true</property>
    </user>
</mycat:server>
```

### 3.3.4 测试

在已验证版本与配置的独立实验环境中，按发行包提供的方式启动。旧版脚本通常形如：

```sh
bin/mycat start
bin/mycat stop
```

不要把两条命令当成必须连续执行的步骤。检查实际监听端口和启动日志；Mycat 1.x 常见前端端口为 `8066`，管理端口为 `9066`，均应以配置为准。

![旧版 Mycat 启动示例](/note-mysql/assets/1684136813294-5f6c0be2-fee4-4fe0-9e99-0749cf410cbe.png)

连接示例不在命令行内写明文密码：

```sh
mysql -h mycat.example.test -P 8066 -u app -p DB01
```

通过逻辑库分别插入以下记录，再直接连接三个后端核对分布：

```sql
INSERT INTO TB_ORDER (id, title) VALUES (1, 'goods1');
INSERT INTO TB_ORDER (id, title) VALUES (5000000, 'goods5000000');
INSERT INTO TB_ORDER (id, title) VALUES (5000001, 'goods5000001');
INSERT INTO TB_ORDER (id, title) VALUES (10000000, 'goods10000000');
INSERT INTO TB_ORDER (id, title) VALUES (10000001, 'goods10000001');
INSERT INTO TB_ORDER (id, title) VALUES (15000000, 'goods15000000');
SELECT id, title FROM TB_ORDER ORDER BY id;
```

| `id`                   | 期望数据节点                                     |
| ---------------------- | ------------------------------------------------ |
| `1`、`5000000`         | `dn1`                                            |
| `5000001`、`10000000`  | `dn2`                                            |
| `10000001`、`15000000` | `dn3`                                            |
| `15000001`             | 不匹配任何范围，且本例未配置默认节点，应拒绝路由 |

不要重复执行同一批主键插入后，把主键冲突误判为分片算法错误。还应测试缺少分片键的查询、跨分片排序聚合、事务失败和节点不可用时的行为。

## 3.4 Mycat 配置

### 3.4.1 schema.xml

`schema.xml` 中各标签名称区分大小写，主要关系如下：

#### schema 标签

`schema` 定义逻辑库和其中的逻辑表；表的 `dataNode`、`rule` 等配置决定其路由关系。

![逻辑库配置示例](/note-mysql/assets/1684137759231-a7bc29c6-dec3-47f1-888c-d7df84da7bc0.png)

![逻辑表配置示例](/note-mysql/assets/1684137861277-a26e3734-e211-4161-b1b1-ed873aa38a57.png)

#### dataNode 标签

`dataNode` 把一个节点名映射到后端数据源和物理数据库。不能把它写成 XML 中不存在的同义小写标签。

![数据节点配置示例](/note-mysql/assets/1684137982668-2fda6b31-4e8e-42d5-abb3-95142400ddc3.png)

#### dataHost 标签

`dataHost` 配置后端连接及相关行为。连接池、读写分配与故障切换参数必须结合拓扑验证，不是打开一个选项就自动获得数据一致性。

![后端数据源配置示例](/note-mysql/assets/1684137994571-1671956d-0c47-49e7-bf2b-ece556988ae0.png)

### 3.4.2 rule.xml

`tableRule` 选择分片列和算法，`function` 定义算法类及参数，名称区分大小写。范围映射文件也属于配置的一部分，修改路由规则后还需评估已有数据是否需要迁移。

![分片规则配置示例](/note-mysql/assets/1684138272209-2c0ecefd-1aa3-4fe3-a359-83a3feb86d84.png)

### 3.4.3 server.xml

`system` 配置服务参数，`user` 配置前端账号和访问范围。

#### system 标签

![旧版服务参数示例](/note-mysql/assets/1684138341423-96dab3e9-6683-4ba7-b020-cb5303a12f24.png)

旧版参数附录：[server 系统配置信息含义.xlsx](https://www.yuque.com/attachments/yuque/0/2023/xlsx/35653686/1684138375179-cf299206-5ce7-48b3-b3ee-31d397dfec2f.xlsx?_lake_card=%7B%22src%22%3A%22https%3A%2F%2Fwww.yuque.com%2Fattachments%2Fyuque%2F0%2F2023%2Fxlsx%2F35653686%2F1684138375179-cf299206-5ce7-48b3-b3ee-31d397dfec2f.xlsx%22%2C%22name%22%3A%22server%E7%B3%BB%E7%BB%9F%E9%85%8D%E7%BD%AE%E4%BF%A1%E6%81%AF%E5%90%AB%E4%B9%89.xlsx%22%2C%22size%22%3A12830%2C%22ext%22%3A%22xlsx%22%2C%22source%22%3A%22%22%2C%22status%22%3A%22done%22%2C%22download%22%3Atrue%2C%22taskId%22%3A%22ua156721e-db55-4161-977f-7f8fe83dffb%22%2C%22taskType%22%3A%22upload%22%2C%22type%22%3A%22application%2Fvnd.openxmlformats-officedocument.spreadsheetml.sheet%22%2C%22__spacing%22%3A%22both%22%2C%22mode%22%3A%22title%22%2C%22id%22%3A%22pDpyr%22%2C%22margin%22%3A%7B%22top%22%3Atrue%2C%22bottom%22%3Atrue%7D%2C%22card%22%3A%22file%22%7D)。不同发行版本的支持项和默认值可能不同。

#### user 标签

![前端用户权限配置示例](/note-mysql/assets/1684138427556-1a3b1e9d-15e4-4647-a812-6322e756dc86.png)

`readOnly` 可用于限制前端账号写入；更细的 `privileges` 配置按所用版本的权限格式验证。前端权限不代替后端最小权限，也不意味着客户端可以绕过代理直接读取所有后端。

## 3.5 Mycat 分片

### 3.5.1 范围分片

按时间、编号等范围路由，便于有分片键条件的范围访问。但递增键可能将新写入集中到最新分片，范围边界和分片容量需要持续维护。

### 3.5.2 取模分片

通过 `分片键 % 节点数` 等规则选节点。改变节点数通常会改变大量数据的路由，不能只改配置而不迁移已有数据；键分布不均也可能产生热点。

### 3.5.3 哈希分片

先计算键的哈希，再映射到分片，可能改善部分键的分散性，但不保证访问流量均匀。没有合适分片键的范围查询可能访问多个节点。

### 3.5.4 一致性哈希分片 {#_3-5-6-一致性哈希分片}

使用哈希环等方式减少节点变动时需要重新映射的键数量，常配合虚拟节点改善分布。它仍需执行数据迁移和切换，并不自动保证强一致性或无热点；具体算法以实现为准。
