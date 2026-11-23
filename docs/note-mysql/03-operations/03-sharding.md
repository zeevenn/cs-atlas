---
title: "3. 分库分表"
---

## 3.1 介绍

### 3.1.1 问题分析

![问题分析（图 1）](/note-mysql/assets/1684131667223-1d3c10ec-fcac-4588-a3d8-c4d1ede94535.png)
随着互联网及移动互联网的发展，应用系统的数据量也是成指数式增长，若采用单数据库进行数据存储，存在以下性能瓶颈：

- IO 瓶颈：热点数据太多，数据库缓存不足，产生大量磁盘 IO，效率较低。请求数据太多，带宽不够，网络 IO 瓶颈。
- CPU 瓶颈：排序、分组、连接查询、聚合统计等 SQL 会耗费大量的 CPU 资源，请求数太多，CPU 出现瓶颈。

为了解决上述问题，我们需要对数据库进行分库分表处理。
![问题分析（图 2）](/note-mysql/assets/1684131731892-2dee07ba-8232-488d-a2ca-d55b2c06b5ab.png)
分库分表的中心思想都是将数据分散存储，使得单一数据库/表的数据量变小来缓解单一数据库的性能问题，从而达到提升数据库性能的目的。

### 3.1.2 拆分策略

分库分表的形式，主要是两种：垂直拆分和水平拆分。而拆分的粒度，一般又分为分库和分表，所以组 成的拆分策略最终如下：
![拆分策略（图 1）](/note-mysql/assets/1684132373667-566a1876-197e-4dd2-9d8a-bd927fe1d029.png)

### 3.1.3 垂直拆分

**垂直分库**
![垂直拆分（图 1）](/note-mysql/assets/1684132416195-8bc94a86-a2c6-4420-a3e2-6e109d3be242.png)
垂直分库：以表为依据，根据业务将不同表拆分到不同库中。
特点：

- 每个库的表结构都不一样。
- 每个库的数据也不一样。
- 所有库的并集是全量数据。

**垂直分表**
![垂直拆分（图 2）](/note-mysql/assets/1684132501677-428ac35b-042a-4591-8261-9500ad5b1a1d.png)
垂直分表：以字段为依据，根据字段属性将不同字段拆分到不同表中。
特点：

- 每个表的结构都不一样。
- 每个表的数据也不一样，一般通过一列（主键/外键）关联。
- 所有表的并集是全量数据。

### 3.1.4 水平拆分

**水平分库**
![水平拆分 （图 1）](/note-mysql/assets/1684132592195-2e7068d7-37c0-418e-9241-aa2f4703ab69.png)
水平分库：以字段为依据，按照一定策略，将一个库的数据拆分到多个库中。
特点：

- 每个库的表结构都一样。
- 每个库的数据都不一样。
- 所有库的并集是全量数据。

**水平分表**
![水平拆分 （图 2）](/note-mysql/assets/1684132634861-37db8e53-f0cf-4ae9-a927-b6a5964528a9.png)
水平分表：以字段为依据，按照一定策略，将一个表的数据拆分到多个表中。
特点：

- 每个表的表结构都一样。
- 每个表的数据都不一样。
- 所有表的并集是全量数据。

在业务系统中，为了缓解磁盘 IO 及 CPU 的性能瓶颈，到底是垂直拆分，还是水平拆分；具体是分 库，还是分表，都需要根据具体的业务需求具体分析。

### 3.1.5 实现技术

- shardingJDBC：基于 AOP 原理，在应用程序中对本地执行的 SQL 进行拦截，解析、改写、路由处 理。需要自行编码配置实现，只支持 java 语言，性能较高。
- MyCat：数据库分库分表中间件，不用调整代码即可实现分库分表，支持多种语言，性能不及前者。
- ![实现技术（图 1）](/note-mysql/assets/1684132847430-534e6b0d-2a93-41dd-99d2-fa2f27f724e8.png)

## 3.2 Mycat 概述

Mycat 是开源的、活跃的、基于 Java 语言编写的 MySQL 数据库中间件。可以像使用 mysql 一样来使用 mycat，对于开发人员来说根本感觉不到 mycat 的存在。 开发人员只需要连接 MyCat 即可，而具体底层用到几台数据库，每一台数据库服务器里面存储了什么数 据，都无需关心。具体的分库分表的策略，只需要在 MyCat 中配置即可。
![Mycat 概述（图 1）](/note-mysql/assets/1684132892710-d9cace9d-4d62-4127-a62f-533de44556e9.png)
优势：

- 性能可靠稳定
- 强大的技术团队
- 体系完善
- 社区活跃

### 3.2.1 安装

Mycat 是采用 java 语言开发的开源的数据库中间件，支持 Windows 和 Linux 运行环境，下面介绍 MyCat 的 Linux 中的环境搭建。我们需要在准备好的服务器中安装如下软件。
![安装（图 1）](/note-mysql/assets/1684132973833-dfe2d67a-185d-41b4-b5b5-1077714680cf.png)
安装文档
[MyCat 安装文档.pdf](https://www.yuque.com/attachments/yuque/0/2023/pdf/35653686/1684133124805-2bbdf19c-cb4a-436d-8f1e-e36f3558bc05.pdf?_lake_card=%7B%22src%22%3A%22https%3A%2F%2Fwww.yuque.com%2Fattachments%2Fyuque%2F0%2F2023%2Fpdf%2F35653686%2F1684133124805-2bbdf19c-cb4a-436d-8f1e-e36f3558bc05.pdf%22%2C%22name%22%3A%22MyCat%E5%AE%89%E8%A3%85%E6%96%87%E6%A1%A3.pdf%22%2C%22size%22%3A658633%2C%22ext%22%3A%22pdf%22%2C%22source%22%3A%22%22%2C%22status%22%3A%22done%22%2C%22download%22%3Atrue%2C%22taskId%22%3A%22uf569e9fb-0266-4f23-9876-aefec7a3a61%22%2C%22taskType%22%3A%22upload%22%2C%22type%22%3A%22application%2Fpdf%22%2C%22__spacing%22%3A%22both%22%2C%22mode%22%3A%22title%22%2C%22id%22%3A%22JXxrS%22%2C%22margin%22%3A%7B%22top%22%3Atrue%2C%22bottom%22%3Atrue%7D%2C%22card%22%3A%22file%22%7D)

### 3.2.2 概念介绍

在 MyCat 的整体结构中，分为两个部分：上面的逻辑结构、下面的物理结构。
![概念介绍（图 1）](/note-mysql/assets/1684135201347-bc6c2e6d-0000-46a9-9863-1ebd1d19fbaf.png)
在 MyCat 的逻辑结构主要负责逻辑库、逻辑表、分片规则、分片节点等逻辑结构的处理，而具体的数据存储还是在物理结构，也就是数据库服务器中存储的

## 3.3 Mycat 入门

### 3.3.1 需求

由于 `tb_order` 表中数据量很大，磁盘 IO 及容量都到达了瓶颈，现在需要对 `tb_order` 表进行数 据分片，分为三个数据节点，每一个节点主机位于不同的服务器上, 具体的结构，参考下图：
![需求（图 1）](/note-mysql/assets/1684135557698-f316e8a3-4e0c-425d-8bff-9649a91ec2cc.png)

### 3.3.2 环境准备

![环境准备（图 1）](/note-mysql/assets/1684135730946-32eca814-b222-44a1-a9fc-d74c3e0dce9e.png)
并且在上述 3 台数据库中创建数据库 `db01`

### 3.3.3 配置

**`schema.xml`**
在 `schema.xml` 中配置逻辑库、逻辑表、数据节点、节点主机等相关信息。具体的配置如下：

```xml
<?xml version="1.0"?>
<!DOCTYPE mycat:schema SYSTEM "schema.dtd">
<mycat:schema xmlns:mycat="http://io.mycat/">

	<schema name="DB01" checkSQLschema="true" sqlMaxLimit="100">
		<table name="TB_ORDER" dataNode="dn1,dn2,dn3" rule="auto-sharding-long" />
	</schema>

	<dataNode name="dn1" dataHost="dhost1" database="db01" />
	<dataNode name="dn2" dataHost="dhost2" database="db01" />
	<dataNode name="dn3" dataHost="dhost3" database="db01" />

	<dataHost name="dhost1" maxCon="1000" minCon="10" balance="0"
			  writeType="0" dbType="mysql" dbDriver="jdbc" switchType="1"  slaveThreshold="100">
		<heartbeat>select user()</heartbeat>

		<writeHost host="master" url="jdbc:mysql://192.168.10.101:3306?useSSL=false&amp;serverTimezone=Asia/Shanghai&amp;characterEncoding=utf8" user="root" password="980918" />
	</dataHost>

	<dataHost name="dhost2" maxCon="1000" minCon="10" balance="0"
			  writeType="0" dbType="mysql" dbDriver="jdbc" switchType="1"  slaveThreshold="100">
		<heartbeat>select user()</heartbeat>

		<writeHost host="master" url="jdbc:mysql://192.168.10.107:3316?useSSL=false&amp;serverTimezone=Asia/Shanghai&amp;characterEncoding=utf8" user="root" password="980918" />
	</dataHost>

	<dataHost name="dhost3" maxCon="1000" minCon="10" balance="0"
			  writeType="0" dbType="mysql" dbDriver="jdbc" switchType="1"  slaveThreshold="100">
		<heartbeat>select user()</heartbeat>

		<writeHost host="master" url="jdbc:mysql://192.168.10.108:3306?useSSL=false&amp;serverTimezone=Asia/Shanghai&amp;characterEncoding=utf8" user="root" password="980918" />
	</dataHost>


</mycat:schema>
```

**`server.xml`**
需要在 `server.xml` 中配置用户名、密码，以及用户的访问权限信息，具体的配置如下：

```xml
	<user name="root" defaultAccount="true">
		<property name="password">980918</property>
		<property name="schemas">DB01</property>

		<!-- 表级 DML 权限设置 -->
		<!--
		<privileges check="false">
			<schema name="TESTDB" dml="0110" >
				<table name="tb01" dml="0000"></table>
				<table name="tb02" dml="1111"></table>
			</schema>
		</privileges>
		 -->
	</user>

	<user name="user">
		<property name="password">980918</property>
		<property name="schemas">DB01</property>
		<property name="readOnly">true</property>
	</user>
```

上述的配置表示，定义了两个用户 `root` 和 `user`，这两个用户都可以访问 `DB01` 这个逻辑库，访 问密码都是 123456，但是 `root` 用户访问 `DB01` 逻辑库，既可以读，又可以写，但是 `user` 用户访问 `DB01` 逻辑库是只读的。

### 3.3.4 测试

配置完毕后，先启动涉及到的 3 台分片服务器，然后启动 MyCat 服务器。切换到 Mycat 的安装目录，执 行如下指令，启动 Mycat：
启动：`bin/mycat start`
停止：`bin/mycat stop`
Mycat 启动之后，占用端口号 8066。 启动完毕之后，可以查看 `logs` 目录下的启动日志，查看 Mycat 是否启动完成。
![测试（图 1）](/note-mysql/assets/1684136813294-5f6c0be2-fee4-4fe0-9e99-0749cf410cbe.png)
连接 Mycat
`mysql -h 192.168.200.210 -P 8066 -uroot -p123456`
我们看到我们是通过 MySQL 的指令来连接的 MyCat，因为 MyCat 在底层实际上是模拟了 MySQL 的协议。
然后就可以在 MyCat 中来创建表，并往表结构中插入数据，查看数据在 MySQL 中的分布情况。

```sql
CREATE TABLE TB_ORDER (
 id BIGINT(20) NOT NULL,
title VARCHAR(100) NOT NULL ,
 PRIMARY KEY (id)
) ENGINE=INNODB DEFAULT CHARSET=utf8 ;

INSERT INTO TB_ORDER(id,title) VALUES(1,'goods1');

INSERT INTO TB_ORDER(id,title) VALUES(2,'goods2');

INSERT INTO TB_ORDER(id,title) VALUES(3,'goods3');

INSERT INTO TB_ORDER(id,title) VALUES(1,'goods1');

INSERT INTO TB_ORDER(id,title) VALUES(2,'goods2');

INSERT INTO TB_ORDER(id,title) VALUES(3,'goods3');

INSERT INTO TB_ORDER(id,title) VALUES(5000000,'goods5000000');

INSERT INTO TB_ORDER(id,title) VALUES(10000000,'goods10000000');

INSERT INTO TB_ORDER(id,title) VALUES(10000001,'goods10000001');

INSERT INTO TB_ORDER(id,title) VALUES(15000000,'goods15000000');

INSERT INTO TB_ORDER(id,title) VALUES(15000001,'goods15000001');
```

经过测试，我们发现，在往 `TB_ORDER` 表中插入数据时：

- 如果 `id` 的值在 1-500w 之间，数据将会存储在第一个分片数据库中。
- 如果 `id` 的值在 500w-1000w 之间，数据将会存储在第二个分片数据库中。
- 如果 `id` 的值在 1000w-1500w 之间，数据将会存储在第三个分片数据库中。
- 如果 `id` 的值超出 1500w，在插入数据时，将会报错。

为什么会出现这种现象，数据到底落在哪一个分片服务器到底是如何决定的呢？这是由逻辑表配置时 的一个参数 `rule` 决定的，而这个参数配置的就是分片规则，关于分片规则的配置，在后面的课程中 会详细讲解。

## 3.4 Mycat 配置

### 3.4.1 schema.xml

`schema.xml` 作为 MyCat 中最重要的配置文件之一 , 涵盖了 MyCat 的逻辑库、逻辑表、分片规则、分片节点及数据源的配置。
主要包含以下三组标签：

- `schema` 标签
- `datanode` 标签
- `datahost` 标签

#### schema 标签

![schema 标签 （图 1）](/note-mysql/assets/1684137759231-a7bc29c6-dec3-47f1-888c-d7df84da7bc0.png)
![schema 标签 （图 2）](/note-mysql/assets/1684137861277-a26e3734-e211-4161-b1b1-ed873aa38a57.png)

#### datanode 标签

![datanode 标签（图 1）](/note-mysql/assets/1684137982668-2fda6b31-4e8e-42d5-abb3-95142400ddc3.png)

#### datahost 标签

![datahost 标签（图 1）](/note-mysql/assets/1684137994571-1671956d-0c47-49e7-bf2b-ece556988ae0.png)

### 3.4.2 rule.xml

`rule.xml` 中定义所有拆分表的规则, 在使用过程中可以灵活的使用分片算法, 或者对同一个分片算法使用不同的参数, 它让分片过程可配置化。主要包含两类标签：`tableRule`、`Function`。
![rule.xml（图 1）](/note-mysql/assets/1684138272209-2c0ecefd-1aa3-4fe3-a359-83a3feb86d84.png)

### 3.4.3 server.xml

`server.xml` 配置文件包含了 MyCat 的系统配置信息，主要有两个重要的标签：`system`、`user`。

#### system 标签

![system 标签（图 1）](/note-mysql/assets/1684138341423-96dab3e9-6683-4ba7-b020-cb5303a12f24.png)
[server 系统配置信息含义.xlsx](https://www.yuque.com/attachments/yuque/0/2023/xlsx/35653686/1684138375179-cf299206-5ce7-48b3-b3ee-31d397dfec2f.xlsx?_lake_card=%7B%22src%22%3A%22https%3A%2F%2Fwww.yuque.com%2Fattachments%2Fyuque%2F0%2F2023%2Fxlsx%2F35653686%2F1684138375179-cf299206-5ce7-48b3-b3ee-31d397dfec2f.xlsx%22%2C%22name%22%3A%22server%E7%B3%BB%E7%BB%9F%E9%85%8D%E7%BD%AE%E4%BF%A1%E6%81%AF%E5%90%AB%E4%B9%89.xlsx%22%2C%22size%22%3A12830%2C%22ext%22%3A%22xlsx%22%2C%22source%22%3A%22%22%2C%22status%22%3A%22done%22%2C%22download%22%3Atrue%2C%22taskId%22%3A%22ua156721e-db55-4161-977f-7f8fe83dffb%22%2C%22taskType%22%3A%22upload%22%2C%22type%22%3A%22application%2Fvnd.openxmlformats-officedocument.spreadsheetml.sheet%22%2C%22__spacing%22%3A%22both%22%2C%22mode%22%3A%22title%22%2C%22id%22%3A%22pDpyr%22%2C%22margin%22%3A%7B%22top%22%3Atrue%2C%22bottom%22%3Atrue%7D%2C%22card%22%3A%22file%22%7D)

#### user 标签

配置 MyCat 中的用户、访问密码，以及用户针对于逻辑库、逻辑表的权限信息，具体的权限描述方式及 配置说明如下：
![user 标签（图 1）](/note-mysql/assets/1684138427556-1a3b1e9d-15e4-4647-a812-6322e756dc86.png)
在测试权限操作时，我们只需要将 `privileges` 标签的注释放开。在 `privileges` 下的 `schema` 标签中配置的 `dml` 属性配置的是逻辑库的权限。在 `privileges` 的 `schema` 下的 `table` 标签的 `dml` 属性 中配置逻辑表的权限。

## 3.5 Mycat 分片

### 3.5.1 范围分片

按照特性的范围区间（比如时间区间、`ID` 区间）来分配数据，比如 将 `id` 为 1~299999 的记录分到第一个库， 300000~599999 的分到第二个库。范围分片适合需要经常进行范围查找的场景，不太适合随机读写的场景（数据未被分散，容易出现热点数据的问题）。

### 3.5.2 取模分片

根据指定的字段值与节点数量进行求模运算，根据运算结果，来决定该数据属于哪一个分片。

### 3.5.3 哈希分片

求指定 `key`（比如 `id`） 的哈希，然后根据哈希值确定数据应被放置在哪个表中。哈希分片比较适合随机读写的场景，不太适合经常需要范围查询的场景。

### 3.5.6 一致性哈希分片

一致性哈希分片算法利用哈希环的思想，对数据进行哈希映射，并通过顺时针寻找最近的服务节点来进行数据的存储。
