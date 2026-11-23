---
title: "2. 索引"
---

## 2.1 索引概述

### 2.1.1 简介

索引（Index）是帮助 MySQL 高效获取数据的数据结构（有序）。在数据之外，数据库还维护着满足特定查找算法的数据结构，这些结构以某种方式引用（指向）数据，这样就可以在这些数据结构上实现高级查找算法，这种数据结构就是索引。
![简介（图 1）](/note-mysql/assets/1683540053667-cfdce3c1-7024-4c54-836f-b22eb20ad7fc.png)
![简介（图 2）](/note-mysql/assets/1683540159697-7d4478c5-4e03-4c90-9689-8c29679bf1b6.png)

### 2.1.2 优缺点

- 优点：
    - 提高数据检索的效率，降低数据库的 IO 成本。
    - 通过索引对数据进行排序，降低数据排序的成本，降低 CPU 的消耗。
- 缺点：
    - 索引列也是要占用空间的。
    - 索引大大提高了查询效率，同时却也降低更新表的速度，如对表进行 `INSERT`、`UPDATE`、`DELETE` 时，效率较低。

## 2.2 索引结构

MySQL 的索引是在存储引擎层实现的，不同的存储引擎有不同的结构，主要有以下几种：

| 索引结构              | 描述                                                                             |
| --------------------- | -------------------------------------------------------------------------------- |
| B+Tree 索引           | 最常见的索引类型，大部分引擎都支持 B+ 树索引                                     |
| Hash 索引             | 底层数据结构是用哈希表实现的， 只有精确匹配索引列的查询才有效，不支持范围查询    |
| R-Tree（空间索引）    | 空间索引时 MyISAM 引擎的一个特殊索引类型，主要用于地理空间数据类型，通常使用较少 |
| Full-Text（全文索引） | 是一种通过建立倒排索引，快速匹配文档的方式，类似于 Lucene、Solr、ES              |

![索引结构（图 1）](/note-mysql/assets/1683540684054-6b97453b-7d80-4c8f-9894-d44f8c701a61.png)

### 2.2.1 二叉树

![二叉树（图 1）](/note-mysql/assets/1683540851833-bbc4e913-4535-4871-bfba-fb296754b424.png)

### 2.2.2 BTree

![BTree（图 1）](/note-mysql/assets/1683541014090-2372b9ec-9475-47c0-8ea0-b2389d7b8e5c.png)

### 2.2.3 B+Tree

![B+Tree（图 1）](/note-mysql/assets/1683541185802-8df1e119-736f-47b8-8688-23538c7f3b57.png)

- 所有的数据都会出现在叶子节点
- 叶子节点形成单向链表

### 2.2.4 MySQL 中的 B+Tree 索引

![MySQL 中的 B+Tree 索引（图 1）](/note-mysql/assets/1683541366133-6c5a63b5-30bb-4d0a-b032-a304acb2e003.png)

### 2.2.5 Hash 索引

![Hash 索引（图 1）](/note-mysql/assets/1683541523060-70d3fc81-bd4b-47d2-be85-abbeef75e7c4.png)

- Hash 索引只能用于对等比较，不支持范围查询；
- 无法利用索引完成排序操作；
- 查询效率高，通常只需要一次检索就可以了，效率通常要高于 B+Tree 索引。
- 在 MySQL 中，支持 hash 索引的是 Memory 引擎，而 InnoDB 中具有自适应 hash 功能，hash 索引是存储引擎根据 B+Tree 索引在知道那个条件下自动构建的。

### 2.2.6 思考题

为什么 InnoDB 存储引擎选择使用 B+Tree 索引结构？

- 相对于二叉树，层级更少，搜索效率高（红黑树本质上也是二叉树）
- 对于 B-Tree，无论是叶子节点还是非叶子节点，都会保存数据，这样会导致一页中存储的键值减少，指针跟着减少，要同样保存大量数据，只能增加树的高度，导致性能降低。
- 相对 Hash 索引，B+Tree 支持范围匹配及排序操作

## 2.3 索引分类

| 分类         | 含义                                                 | 特点                     | 关键字     |
| ------------ | ---------------------------------------------------- | ------------------------ | ---------- |
| **主键索引** | 针对于表中主键创建的索引                             | 默认自动创建，只能有一个 | `PRIMARY`  |
| **唯一索引** | 避免同一个表中某数据列中的值重复                     | 可以有多个               | `UNIQUE`   |
| **常规索引** | 快速定位特定数据                                     | 可以有多个               |            |
| **全文索引** | 全文索引查找的是文本中的关键词，而不是比较索引中的值 | 可以有多个               | `FULLTEXT` |

在 InnoDB 存储引擎中，根据索引的存储形式，又可以分为以下两种：

- 聚集索引（Clustered Index）：将数据存储与索引放到了一块，索引结构的叶子节点保存了 **行数据** → 必须有，而且只有一个。
    - 聚集索引选取规则：如果存在主键，主键索引就是聚集索引；如果不存在主键，将使用第一个唯一(`UNIQUE`)索引作为聚集索引；其余情况 InnoDB 会自动生成一个 roeid 作为隐藏的聚集索引。
- 二级索引（Secondary Index）：将数据与索引分开存储，索引结构的叶子节点关联的是对应的 **主键** → 可以存在多个。
- ![索引分类（图 1）](/note-mysql/assets/1683542499034-efe62f7c-f1ab-470d-8a52-3d2b17017089.png)
- 回表查询：先走二级索引查找拿到主键值，在走聚集索引拿到行数据。

## 2.4 索引语法

### 2.4.1 创建索引

```sql
CREATE [UNIQUE|FULLTEXT] INDEX index_name ON table_name (index_col_name,....);
```

### 2.4.2 查看索引

```sql
SHOW INDEX FROM table_name
```

### 2.4.3 删除索引

```sql
DROP INDEX index_name ON table_name
```

### 2.4.4 案例演示

#### 建表

```sql
create table tb_user(
     id int primary key auto_increment comment '主键',
     name varchar(50) not null comment '用户名',
     phone varchar(11) not null comment '手机号',
     email varchar(100) comment '邮箱',
     profession varchar(11) comment '专业',
     age tinyint unsigned comment '年龄',
     gender char(1) comment '性别 , 1: 男, 2: 女',
     status char(1) comment '状态',
     createtime datetime comment '创建时间'
) comment '系统用户表';

INSERT INTO tb_user (name, phone, email, profession, age, gender, status,createtime)
VALUES ('吕布', '17799990000', 'lvbu666@163.com', '软件工程', 23, '1','6', '2001-02-02 00:00:00');

INSERT INTO tb_user (name, phone, email, profession, age, gender, status,createtime)
VALUES ('曹操', '17799990001', 'caocao666@qq.com', '通讯工程', 33,'1', '0', '2001-03-05 00:00:00');

INSERT INTO tb_user (name, phone, email, profession, age, gender, status,createtime)
VALUES ('赵云', '17799990002', '17799990@139.com', '英语', 34, '1','2', '2002-03-02 00:00:00');

INSERT INTO tb_user (name, phone, email, profession, age, gender, status,createtime)
VALUES ('孙悟空', '17799990003', '17799990@sina.com', '工程造价', 54,'1', '0', '2001-07-02 00:00:00');

INSERT INTO tb_user (name, phone, email, profession, age, gender, status,createtime)
VALUES ('花木兰', '17799990004', '19980729@sina.com', '软件工程', 23,'2', '1', '2001-04-22 00:00:00');

INSERT INTO tb_user (name, phone, email, profession, age, gender, status,createtime)
VALUES ('大乔', '17799990005', 'daqiao666@sina.com', '舞蹈', 22, '2','0', '2001-02-07 00:00:00');

INSERT INTO tb_user (name, phone, email, profession, age, gender, status,createtime)
VALUES ('露娜', '17799990006', 'luna_love@sina.com', '应用数学', 24,'2', '0', '2001-02-08 00:00:00');

INSERT INTO tb_user (name, phone, email, profession, age, gender, status,createtime)
VALUES ('程咬金', '17799990007', 'chengyaojin@163.com', '化工', 38,'1', '5', '2001-05-23 00:00:00');

INSERT INTO tb_user (name, phone, email, profession, age, gender, status,createtime)
VALUES ('项羽', '17799990008', 'xiaoyu666@qq.com', '金属材料', 43,'1', '0', '2001-09-18 00:00:00');

INSERT INTO tb_user (name, phone, email, profession, age, gender, status,createtime)
VALUES ('白起', '17799990009', 'baiqi666@sina.com', '机械工程及其自动化', 27, '1', '2', '2001-08-16 00:00:00');

INSERT INTO tb_user (name, phone, email, profession, age, gender, status,createtime)
VALUES ('韩信', '17799990010', 'hanxin520@163.com', '无机非金属材料工程', 27, '1', '0', '2001-06-12 00:00:00');

INSERT INTO tb_user (name, phone, email, profession, age, gender, status,createtime)
VALUES ('荆轲', '17799990011', 'jingke123@163.com', '会计', 29, '1','0', '2001-05-11 00:00:00');

INSERT INTO tb_user (name, phone, email, profession, age, gender, status,createtime)
VALUES ('兰陵王', '17799990012', 'lanlinwang666@126.com', '工程造价',44, '1', '1', '2001-04-09 00:00:00');

INSERT INTO tb_user (name, phone, email, profession, age, gender, status,createtime)
VALUES ('狂铁', '17799990013', 'kuangtie@sina.com', '应用数学', 43,'1', '2', '2001-04-10 00:00:00');

INSERT INTO tb_user (name, phone, email, profession, age, gender, status,createtime)
VALUES ('貂蝉', '17799990014', '84958948374@qq.com', '软件工程', 40,'2', '3', '2001-02-12 00:00:00');

INSERT INTO tb_user (name, phone, email, profession, age, gender, status,createtime)
VALUES ('妲己', '17799990015', '2783238293@qq.com', '软件工程', 31,'2', '0', '2001-01-30 00:00:00');

INSERT INTO tb_user (name, phone, email, profession, age, gender, status,createtime)
VALUES ('芈月', '17799990016', 'xiaomin2001@sina.com', '工业经济', 35,'2', '0', '2000-05-03 00:00:00');

INSERT INTO tb_user (name, phone, email, profession, age, gender, status,createtime)
VALUES ('嬴政', '17799990017', '8839434342@qq.com', '化工', 38, '1','1', '2001-08-08 00:00:00');

INSERT INTO tb_user (name, phone, email, profession, age, gender, status,createtime)
VALUES ('狄仁杰', '17799990018', 'jujiamlm8166@163.com', '国际贸易',30, '1', '0', '2007-03-12 00:00:00');
INSERT INTO tb_user (name, phone, email, profession, age, gender, status, createtime)
VALUES ('安琪拉', '17799990019', 'jdodm1h@126.com', '城市规划', 51, '2', '0', '2001-08-15 00:00:00');

INSERT INTO tb_user (name, phone, email, profession, age, gender, status, createtime)
VALUES ('典韦', '17799990020', 'ycaunanjian@163.com', '城市规划', 52, '1', '2', '2000-04-12 00:00:00');

INSERT INTO tb_user (name, phone, email, profession, age, gender, status, createtime)
VALUES ('廉颇', '17799990021', 'lianpo321@126.com', '土木工程', 19, '1', '3', '2002-07-18 00:00:00');

INSERT INTO tb_user (name, phone, email, profession, age, gender, status, createtime)
VALUES ('后羿', '17799990022', 'altycj2000@139.com', '城市园林', 20, '1', '0', '2002-03-10 00:00:00');

INSERT INTO tb_user (name, phone, email, profession, age, gender, status, createtime)
VALUES ('姜子牙', '17799990023', '37483844@qq.com', '工程造价', 29, '1', '4', '2003-05-26 00:00:00');
```

#### 需求

- `name` 字段为姓名字段，该字段的值可能会重复，为该字段创建索引
- `phone` 手机号字段的值，是非空且唯一的，为该字段创建唯一索引
- 为 `profession`、`age`、`status` 创建联合索引
- 为 `email` 建立合适的索引来提升查询效率

#### 具体实现

```sql
# 查看索引
show index from tb_user;
# 创建索引
create index idx_user_name on tb_user (name);
create unique index idx_user_phone on tb_user (phone);
create index idx_user_pro_age_sta on tb_user (profession, age, status);
create index idx_user_email on tb_user(email);
# 删除索引
drop index idx_user_email on tb_user;
```

![具体实现（图 1）](/note-mysql/assets/1683544091442-6984d66f-ff81-48d7-b252-4a1245474174.png)

## 2.5 SQL 性能分析

### 2.5.1 SQL 执行频率

MySQL 客户端连接成功后，通过 `SHOW [session|global] status` 命令可以提供服务器状态信息。通过如下指令，可以查看当前数据库 `INSERT`、`DELETE`、`UPDATE`、`SELECT` 的访问频次--`show global status like 'Com_______';`
![SQL 执行频率（图 1）](/note-mysql/assets/1683544402244-97c965da-38d1-4962-899b-a9eef560c5af.png)

### 2.5.2 慢查询日志

慢查询日志记录了所有执行时间超过指定参数(`long_query_time`，单位：秒，默认 10 秒)的所有 SQL 语句的日志。
MySQL 的慢查询日志默认没有开启，需要在 MySQL 的配置文件(`/etc/my.cnf`)中配置如下信息：

- `slow_query_log=1` 开启 MySQL 慢日志查询开关
- `long_query_time=2` 设置慢日志的时间为 2 秒，SQL 语句执行时间超过 2 秒，就会被视为慢查询，记录慢查询日志。
- 配置完成后，重启 MySQL 服务器，查看慢查询日志文件中记录的信息 `/var/lib/mysql/localhost-slow.log`

### 2.5.3 profile 详情

`show profiles` 能够在做 SQL 优化时帮助我们了解时间都耗费到哪儿去了，通过 `have_profiling` 参数，能够看到当前 MySQL 是否支持 profile 操作 ：`select @@have_profiling;`，默认 profiling 是关闭的，可以通过 `set` 语句在 session/global 级别开启 profiling：`set profiling = 1`
![profile 详情（图 1）](/note-mysql/assets/1683545290219-43f4976f-67b2-4c48-b2f7-e5158ab7c015.png)
完成上述配置后，可以通过下列命令查看执行耗时：

```sql
# 查看每一条SQL的耗时基本情况
show profiles;
# 查看指定query_id的SQL语句各个阶段的耗时情况
show profile for query query_id;
# 查看指定query_id的SQL语句CPU的使用情况
show profile cpu for query query_id;
```

### 2.5.4 explain 执行计划

EXPLAIN 或者 DESX 命令获取 MySQL 如何执行 `SELECT` 语句的信息，包括在 `SELECT` 语句执行过程中表如何连接和连接的顺序：`EXPLAIN SELECT 字段列表 FROM 表名 WHERE 条件;`
![explain 执行计划（图 1）](/note-mysql/assets/1683598045088-ea5b916a-ca2b-4c8c-a66a-be868e959166.png)
下面对查询信息中的参数做出解释：

| 字段           | 含义                                                                                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`           | `select` 查询的序列号，表示查询中执行 `select` 子句或者是操作表的顺序（`id` 相同，执行顺序从上到下；`id` 不同，值越大，越先执行）                                                                                   |
| `select_type`  | 表示 `select` 的类型，常见的取值有 `SIMPLE`（简单表，不使用表连接或者子查询），`PRIMARY`（主查询，即外层查询），`UNION`（`UNION` 中的第二个或者后面的查询语句），`SUBQUERY`（`SELECT`、`WHERE` 之后包含了子查询）等 |
| `type`         | 表示连接的类型，性能由好到差的连接类型为：`NULL`、`system`、`const`、`eq_ref`、`ref`、`range`、`index`、`all`。                                                                                                     |
| `possible_key` | 显示可能应用在这张表上的索引，一个或多个                                                                                                                                                                            |
| `key`          | 实际使用的索引，如果为 `NULL`，则没有使用索引                                                                                                                                                                       |
| `key_len`      | 表示索引中使用的字节数，该值为索引字段最大可能长度，并非实际使用长度，再不损失精度的前提下，长度越短越好                                                                                                            |
| `rows`         | MySQL 认为必须要执行查询的行数，在 InnoDB 引擎的表中，是一个估计值，可能并不总是准确的                                                                                                                              |
| `fitered`      | 表示返回结果的行数占需要读取行树的百分比，越大越好。                                                                                                                                                                |

## 2.6 索引使用

### 2.6.1 验证索引效率

执行语句看差距：

```sql
select * from tb_sku where id = 1\G;
```

![验证索引效率（图 1）](/note-mysql/assets/1683598659639-595aa706-ca8c-41ab-805e-00f4c53716dc.png)
可以看到即使有 1000w 的数据,根据 `id` 进行数据查询,性能依然很快，因为主键 `id` 是有索引的。那么接 下来，我们再来根据 `sn` 字段进行查询，执行如下 SQL：

```sql
SELECT * FROM tb_sku WHERE sn = '100000003145001';
```

![验证索引效率（图 2）](/note-mysql/assets/1683598690855-eedafd26-33da-4102-842d-7a5bd1c8f479.png)
我们可以看到根据 `sn` 字段进行查询，查询返回了一条数据，结果耗时 20.78sec，就是因为 `sn` 没有索 引，而造成查询效率很低。 那么我们可以针对于 `sn` 字段，建立一个索引，建立了索引之后，我们再次根据 `sn` 进行查询，再来看一 下查询耗时情况。 创建索引：

```sql
create index idx_sku_sn on tb_sku(sn) ;
```

然后再次执行相同的 SQL 语句，再次查看 SQL 的耗时。

```sql
SELECT * FROM tb_sku WHERE sn = '100000003145001';
```

![验证索引效率（图 3）](/note-mysql/assets/1683598738946-8d60a39e-62ed-4998-8d61-b74306b9f7ae.png)
我们明显会看到，`sn` 字段建立了索引之后，查询性能大大提升。建立索引前后，查询耗时都不是一个数 量级的。

### 2.6.2 最左前缀法则

- 如果索引了多列（联合索引），要遵从最左前缀法则。最左前缀法则指的是查询从索引的最左列开始，并且不跳过索引中的列，如果跳跃了某一列，索引将部分失效（后面的字段索引失效），若最左列不存在，则索引全部失效。
- 注意：最左前缀法则中指的最左边的列，是指在查询时，联合索引的最左边的字段(即是 第一个字段)必须存在，与我们编写 SQL 时，条件编写的先后顺序无关。
- ![最左前缀法则（图 1）](/note-mysql/assets/1683612007561-d7c4c412-8114-4e3a-9147-31307ec90df3.png)

### 2.6.3 范围查询

联合索引中，出现了范围查询(`>`,`<`)，范围查询右侧的列索引失效。
![范围查询（图 1）](/note-mysql/assets/1683599448903-1522743a-25c2-42a7-b932-225da6946f36.png)

- 当范围查询使用 `>` 或 `<` 时，走联合索引了，但是索引的长度为 49，就说明范围查询右边的 `status` 字 段是没有走索引的。
- 当范围查询使用 `>=` 或 `<=` 时，走联合索引了，但是索引的长度为 54，就说明所有的字段都是走索引 的。
- 所以，在业务允许的情况下，尽可能的使用类似于 `>=` 或 `<=` 这类的范围查询，而避免使用 `>` 或 `<`。

### 2.6.4 索引失效

#### 索引列运算

不要在索引列上进行运算操作，索引将失效。
![索引列运算（图 1）](/note-mysql/assets/1683599749107-958691af-376a-41af-9b4a-93d5e26a7287.png)

#### 字符串不加引号

字符串类型字段查询时不加单引号，索引失效
![字符串不加引号（图 1）](/note-mysql/assets/1683599826525-1206126d-9e33-4761-9851-adae41325e11.png)

#### 模糊查询

如果仅仅是尾部模糊匹配，索引不会失效，如果是头部模糊匹配，索引失效。
![模糊查询（图 1）](/note-mysql/assets/1683599991399-08e2c48d-36cd-4506-a623-1436555508f3.png)

#### or 连接查询

用 `or` 分隔开的条件，如果 `or` 前的条件中由索引，而后面的列中没有索引，那么涉及的索引都不会被用到。
![or 连接查询（图 1）](/note-mysql/assets/1683600164721-0f92326f-9acf-4999-b239-1f92d4f5c122.png)

#### 数据分布影响

如果 MySQL 评估使用索引比全表更慢，则不适用索引。
![数据分布影响（图 1）](/note-mysql/assets/1683600418538-bb247519-fc21-43d7-a3f7-0dda5d0dd9f8.png)

- 相同的 SQL 语句，只是传入的字段值不同，最终的执行计划也完全不一样，这是为什么呢？
    - 就是因为 MySQL 在查询时，会评估使用索引的效率与走全表扫描的效率，如果走全表扫描更快，则放弃 索引，走全表扫描。因为索引是用来索引少量数据的，如果通过索引查询返回大批量的数据，则还不 如走全表扫描来的快，此时索引就会失效。

### 2.6.5 SQL 提示

SQL 提示，是优化数据库的一个重要手段，简单来说，就是在 SQL 语句中加入一些认为的提示来达到优化操作的目的。

- `use index`：建议 MySQL 使用哪一个索引完成此次查询（仅仅是建议，mysql 内部还会再次评估）
    - `explain select * from tb_user use index(idx_user_pro) where profession = '软件工 程';`
- `ignore index`：忽略指定的索引
    - `explain select * from tb_user ignore index(idx_user_pro) where profession = '软件工 程';`
- `force index`：强制使用索引
    - `explain select * from tb_user force index(idx_user_pro) where profession = '软件工 程';`

![SQL 提示（图 1）](/note-mysql/assets/1683601101255-520cab75-5d48-4a8e-99c4-c924629f53f1.png)

### 2.6.7 覆盖索引

尽量使用覆盖索引（查询使用了索引，并且需要返回的列，在该索引中已经全部能够找到），减少 `select *`。
我们来看一组 SQL 的执行计划，看看执行计划的差别：

```sql
explain select id, profession from tb_user where profession = '软件工程' and age = 31 and status = '0' ;
explain select id,profession,age, status from tb_user where profession = '软件工程' and age = 31 and status = '0' ;
explain select id,profession,age, status, name from tb_user where profession = '软件工程' and age = 31 and status = '0' ;
explain select * from tb_user where profession = '软件工程' and age = 31 and status = '0';
```

![覆盖索引（图 1）](/note-mysql/assets/1683601565449-fbca16ab-ca83-4662-9976-5852144c254a.png)

- `using index condition`：查找使用了索引，但是需要回表查询数据。
- `using where; using index`：查找使用了索引，但是需要的数据都在索引列中能够找到，所以不需要回表查询数据。

![覆盖索引（图 2）](/note-mysql/assets/1683602046074-f2f7feb9-e8fa-467b-8b99-a9b748f2c04f.png)
![覆盖索引（图 3）](/note-mysql/assets/1683602207051-1e43a1fa-ea9d-404b-ac1a-59bc28e3b06a.png)
**思考题**：一张表, 有四个字段(`id`, `username`, `password`, `status`), 由于数据量大, 需要对 以下 SQL 语句进行优化, 该如何进行才是最优方案:`select id,username,password from tb_user where username = 'itcast';`
**解决**：针对于 `username, password` 建立联合索引, sql 为: `create index idx_user_name_pass on tb_user(username,password);` 这样可以避免上述的 SQL 语句，在查询的过程中，出现回表查询。

### 2.6.8 前缀索引

当字段类型为字符串（`varchar`，`text`，`longtext` 等）时，有时候需要索引很长的字符串，这会让 索引变得很大，查询时，浪费大量的磁盘 IO，影响查询效率。此时可以只将字符串的一部分前缀，建 立索引，这样可以大大节约索引空间，从而提高索引效率。

- 语法：`create index idx_xxxx on table_name(column(n)) ;`
- 前缀长度：可以根据索引的选择性来决定，而选择性是指不重复的索引值（基数）和数据表的记录总数的比值，索引选择性越高则查询效率越高，唯一索引的选择性是 1，这是最好的索引选择性，性能也是最好的。
    - `select count(distinct email) / count(*) from tb_user ;`
    - `select count(distinct substring(email,1,5)) / count(*) from tb_user ;`

举例：为 `tb_user` 表的 `email` 字段，建立长度为 5 的前缀索引。

```sql
create index idx_email_5 on tb_user(email(5));
```

![前缀索引（图 1）](/note-mysql/assets/1683602956667-98410e63-ad59-437a-a4b4-4881914f7022.png)
![前缀索引（图 2）](/note-mysql/assets/1683603130949-a86e40aa-aa3c-4ccf-9dfa-8a1167064123.png)

### 2.6.9 单列索引&联合索引

- 单列索引：一个索引只包含一个列
- 联合索引：一个索引包含了多个列

在业务场景中，如果存在多个查询条件，考虑针对查询字段建立索引时，建议建立联合索引，而非单列索引。
![单列索引&联合索引（图 1）](/note-mysql/assets/1683603454643-ccb12e40-487d-44d5-8aad-57dacb7db5f2.png)

## 2.7 索引设计原则

- 针对于数据量大，且查询比较频繁的表建立索引。
- 针对于常作为查询条件（`WHERE`）、排序（`ORDER BY`）、分组（`GROUP BY`）操作的字段建立索引。
- 尽量选择区分度高的列作为索引，尽量建立唯一索引，区分度高，使用索引的效率越高。
- 如果是字符串类型的字段，字段的长度比较长，可以针对于字段的特点，建立前缀索引。
- 尽量使用联合索引，减少单列索引，查询时，联合索引很多时候可以覆盖索引，节省存储空间，避免回表，提高查询效率。
- 要控制索引的数量，索引并不是多多益善，索引越多，维护索引结构的代价也就越大，会增加增删改的效率。
- 如果索引列不能存储 `NULL` 值，请在创建表时使用 `NOT NULL` 约束它，当优化器知道每列是否包含 `NULL` 值时，它可以更好地确定那个索引最有效地用于查询。
