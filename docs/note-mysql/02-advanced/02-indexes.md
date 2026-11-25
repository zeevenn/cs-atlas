---
title: "2. 索引"
---

## 2.1 索引概述

### 2.1.1 简介

索引是帮助数据库定位记录、按特定顺序访问数据的数据结构。它保存索引键与记录定位信息，并不意味着任何查询只要建了索引就一定更快。

![无索引时的查找示意](/note-mysql/assets/1683540053667-cfdce3c1-7024-4c54-836f-b22eb20ad7fc.png)

![通过索引定位记录](/note-mysql/assets/1683540159697-7d4478c5-4e03-4c90-9689-8c29679bf1b6.png)

### 2.1.2 优缺点

- 合适的索引能减少扫描量，并可能减少排序或分组开销。
- 索引占用空间，写入、删除及修改索引列时需要维护它。
- 优化目标是降低实际查询成本，而不是让每条语句都显示使用索引。

## 2.2 索引结构

| 结构     | 常见支持情况                                        | 特点                                               |
| -------- | --------------------------------------------------- | -------------------------------------------------- |
| B+ 树    | InnoDB、MyISAM 的普通索引，Memory 的 `BTREE` 索引等 | 支持等值、范围和满足条件的有序访问                 |
| 哈希     | Memory 的 `HASH` 索引等                             | 主要支持等值查找，不能直接提供范围或排序访问       |
| R 树     | InnoDB、MyISAM 的空间索引                           | 适用于相应空间查询                                 |
| 全文索引 | InnoDB、MyISAM                                      | 按词项等结构组织全文检索，不等于普通字符串比较索引 |

![索引结构](/note-mysql/assets/1683540684054-6b97453b-7d80-4c8f-9894-d44f8c701a61.png)

索引能力取决于存储引擎、索引类型和具体查询。[索引类型比较](https://dev.mysql.com/doc/refman/8.4/en/index-btree-hash.html)

### 2.2.1 二叉树

普通二叉查找树可能退化成链；平衡二叉树可以控制高度，但在磁盘索引中，多路树通常能以更少层级容纳大量键。

![二叉树](/note-mysql/assets/1683540851833-bbc4e913-4535-4871-bfba-fb296754b424.png)

### 2.2.2 BTree

B 树节点可以容纳多个键和子节点指针，以较大的分支数降低树高。具体容量仍取决于页面和记录大小。

![BTree](/note-mysql/assets/1683541014090-2372b9ec-9475-47c0-8ea0-b2389d7b8e5c.png)

### 2.2.3 B+Tree

B+ 树的非叶子节点主要用于导航，叶子节点保存索引记录，适合连续范围访问。

![B+Tree](/note-mysql/assets/1683541185802-8df1e119-736f-47b8-8688-23538c7f3b57.png)

### 2.2.4 MySQL 中的 B+Tree 索引

InnoDB 的 B+ 树按页组织，同层页面有双向链接，叶子页按索引键顺序组织。聚集索引和二级索引在叶子记录中保存的内容不同。

![MySQL 中的 B+Tree 索引](/note-mysql/assets/1683541366133-6c5a63b5-30bb-4d0a-b032-a304acb2e003.png)

### 2.2.5 Hash 索引

哈希索引按键的哈希值定位桶，主要用于等值查找；碰撞处理、负载和缓存情况都会影响成本，不能笼统认定它一定比 B+ 树更快。

![Hash 索引](/note-mysql/assets/1683541523060-70d3fc81-bd4b-47d2-be85-abbeef75e7c4.png)

Memory 支持用户定义的哈希索引。InnoDB 的自适应哈希索引是内部优化机制，MySQL 8.4 默认关闭，不能把普通 InnoDB 索引声明为 `USING HASH` 就得到同样的功能。[自适应哈希索引](https://dev.mysql.com/doc/refman/8.4/en/innodb-adaptive-hash.html)

### 2.2.6 思考题

为什么 InnoDB 常用 B+ 树？多路分支有助于降低树高，页组织适合批量 I/O，叶子层又支持范围扫描和有序访问。选择结构时要同时考虑等值、范围、排序及写入维护需求。

## 2.3 索引分类

| 分类     | 用途                                 | 关键字        |
| -------- | ------------------------------------ | ------------- |
| 主键索引 | 唯一且非空地标识记录，一张表最多一个 | `PRIMARY KEY` |
| 唯一索引 | 约束非空键值的唯一性，可以有多个     | `UNIQUE`      |
| 普通索引 | 辅助定位数据，不额外要求唯一         | `INDEX`       |
| 全文索引 | 支持全文检索                         | `FULLTEXT`    |

在 InnoDB 中，还要按数据组织方式区分：

- **聚集索引**：叶子记录包含行数据。一张表只有一个聚集索引。优先使用主键；没有主键时，选择第一个所有键列均为 `NOT NULL` 的唯一索引；再没有合适索引时，生成基于隐藏行编号的 `GEN_CLUST_INDEX`。
- **二级索引**：叶子记录包含二级索引键和聚集键，聚集键通常就是主键；一张表可以有多个二级索引。

![聚集索引与二级索引](/note-mysql/assets/1683542499034-efe62f7c-f1ab-470d-8a52-3d2b17017089.png)

**回表**：先通过二级索引取得聚集键，再到聚集索引读取所需行数据。主键越长，二级索引中保存聚集键的空间成本通常也越高。[聚集索引与二级索引](https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html)

## 2.4 索引语法

下面三段是语法模板，表名、列名及可选项需要替换为实际对象。

### 2.4.1 创建索引

```sql
CREATE [UNIQUE | FULLTEXT] INDEX index_name ON table_name (column_name, ...);
```

### 2.4.2 查看索引

```sql
SHOW INDEX FROM table_name;
```

### 2.4.3 删除索引

```sql
DROP INDEX index_name ON table_name;
```

### 2.4.4 案例演示

#### 建表

在练习数据库中执行一次建表和初始数据，后续索引示例及存储程序章复用这张 `tb_user` 表：

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

- 姓名可能重复，为 `name` 创建普通索引。
- 手机号非空且唯一，为 `phone` 创建唯一索引。
- 为组合查询创建 `(profession, age, status)` 联合索引。
- 练习创建和删除邮箱索引。

#### 具体实现

```sql
CREATE INDEX idx_user_name ON tb_user (name);
CREATE UNIQUE INDEX idx_user_phone ON tb_user (phone);
CREATE INDEX idx_user_pro_age_sta ON tb_user (profession, age, status);
CREATE INDEX idx_user_email ON tb_user (email);
SHOW INDEX FROM tb_user;
DROP INDEX idx_user_email ON tb_user;
```

![具体实现](/note-mysql/assets/1683544091442-6984d66f-ff81-48d7-b252-4a1245474174.png)

## 2.5 SQL 性能分析

### 2.5.1 SQL 执行频率

```sql
SHOW GLOBAL STATUS LIKE 'Com_%';
```

这些状态量反映语句执行次数等信息，不是语句影响的行数。比较两个时间点的增量比单看启动以来的累计值更有用。

![SQL 执行频率](/note-mysql/assets/1683544402244-97c965da-38d1-4962-899b-a9eef560c5af.png)

### 2.5.2 慢查询日志

慢日志用于记录满足记录条件且耗时超过阈值的语句。可由管理员动态配置，再检查实际日志位置：

```sql
SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 2;
SET SESSION long_query_time = 2;
SHOW VARIABLES LIKE 'slow_query_log_file';
```

`long_query_time` 有会话值，修改全局值不会直接改掉已有连接的会话值。需要持久化时，再按环境使用配置文件或合适的持久化设置。[慢查询日志](https://dev.mysql.com/doc/refman/8.4/en/slow-query-log.html)

### 2.5.3 profile 详情

`SHOW PROFILE` / `SHOW PROFILES` 在 8.4 中已弃用，新排查流程优先使用 Performance Schema。下面查询当前连接最近的语句事件，要求相关监控已启用且具备查看权限：

```sql
SELECT event_id, sql_text, timer_wait / 1000000000000 AS duration_seconds
FROM performance_schema.events_statements_history
WHERE thread_id = (
    SELECT thread_id FROM performance_schema.threads
    WHERE processlist_id = CONNECTION_ID()
)
ORDER BY event_id DESC
LIMIT 5;
```

![旧版 SHOW PROFILE 操作示例](/note-mysql/assets/1683545290219-43f4976f-67b2-4c48-b2f7-e5158ab7c015.png)

历史截图仅用于识别旧资料。[SHOW PROFILE 弃用说明](https://dev.mysql.com/doc/refman/8.4/en/show-profile.html)

### 2.5.4 explain 执行计划

```sql
EXPLAIN SELECT id, name FROM tb_user WHERE phone = '17799990000';
EXPLAIN ANALYZE SELECT id, name FROM tb_user WHERE phone = '17799990000';
```

普通 `EXPLAIN` 主要展示计划与估算；`EXPLAIN ANALYZE` 会实际执行查询，提供实际时间、行数和循环次数，执行前要评估语句成本。

![EXPLAIN 输出示例](/note-mysql/assets/1683598045088-ea5b916a-ca2b-4c8c-a66a-be868e959166.png)

| 字段            | 含义                                                                             |
| --------------- | -------------------------------------------------------------------------------- |
| `id`            | 查询块标识，不能简单当作按编号从大到小执行的完整顺序                             |
| `select_type`   | 查询块类型，例如 `SIMPLE`、`PRIMARY`、`SUBQUERY`、`DERIVED`                      |
| `type`          | 访问方式，例如 `const`、`ref`、`range`、`index`、`ALL`；不能只按名称判断整体性能 |
| `possible_keys` | 可能使用的索引                                                                   |
| `key`           | 实际选择的索引                                                                   |
| `key_len`       | 优化器使用的键长度信息，受列类型、可空性等影响，不是实际行大小                   |
| `rows`          | 估计需要检查的行数；InnoDB 中通常是估计值                                        |
| `filtered`      | 估计通过表条件筛选的百分比，不是越大越好                                         |
| `Extra`         | 覆盖索引、排序、条件下推等补充信息                                               |

图中的耗时、行数和键长度来自旧环境，不应视为本地运行的固定结果。[EXPLAIN 字段说明](https://dev.mysql.com/doc/refman/8.4/en/explain-output.html)

## 2.6 索引使用

### 2.6.1 验证索引效率

用独立小表验证语法；真正比较性能时需要接近业务规模的数据、相同查询及缓存条件。

```sql
CREATE TABLE tb_sku (
    id BIGINT PRIMARY KEY,
    sn VARCHAR(32) NOT NULL,
    payload VARCHAR(128)
) ENGINE = InnoDB;

INSERT INTO tb_sku (id, sn, payload) VALUES
    (1, '100000003145001', 'A'),
    (2, '100000003145002', 'B'),
    (3, '100000003145003', 'C');

EXPLAIN SELECT * FROM tb_sku WHERE id = 1;
EXPLAIN SELECT * FROM tb_sku WHERE sn = '100000003145001';
CREATE INDEX idx_sku_sn ON tb_sku (sn);
EXPLAIN SELECT * FROM tb_sku WHERE sn = '100000003145001';
```

![旧环境中的主键查询](/note-mysql/assets/1683598659639-595aa706-ca8c-41ab-805e-00f4c53716dc.png)

![旧环境中未建索引的查询](/note-mysql/assets/1683598690855-eedafd26-33da-4102-842d-7a5bd1c8f479.png)

![旧环境中建索引后的查询](/note-mysql/assets/1683598738946-8d60a39e-62ed-4998-8d61-b74306b9f7ae.png)

小表全表扫描也可能很快，优化器不一定选择新建索引；不能用一次截图中的耗时差异推导所有场景。

### 2.6.2 最左前缀法则

联合索引 `(profession, age, status)` 通常可以按最左前缀定位：`profession`、`(profession, age)`、`(profession, age, status)`。条件在 `WHERE` 中的书写先后不影响列在索引中的顺序。

跳过中间列后，后续列通常不能继续缩小同一段查找范围，但可能用于过滤或覆盖索引。没有最左列条件时，也可能出现全索引扫描或特定条件下的 skip scan，不能笼统说「索引全部失效」。[联合索引](https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html)

![最左前缀法则](/note-mysql/assets/1683612007561-d7c4c412-8114-4e3a-9147-31307ec90df3.png)

### 2.6.3 范围查询

在联合索引中，等值条件通常可以继续利用后续键列构造范围；遇到范围条件后，后续列通常不再用于继续构造该范围，但可能参与索引条件下推等过滤。

![范围查询](/note-mysql/assets/1683599448903-1522743a-25c2-42a7-b932-225da6946f36.png)

不能概括成「`>` 一定使后列失效，`>=` 一定让所有列都有效」，更不能为索引效果把 `>` 改成业务含义不同的 `>=`。应结合具体范围、`key_len` 和执行计划判断。[范围优化规则](https://dev.mysql.com/doc/refman/8.4/en/range-optimization.html)

### 2.6.4 索引失效

这一节讨论的是访问路径可能改变的情况，不能把「不能按某列直接定位」等同于「完全不使用任何索引」。

#### 索引列运算

对普通索引列使用函数或表达式，可能无法直接利用原索引定位。可考虑等价改写条件，或建立与表达式匹配的函数索引。

![索引列运算](/note-mysql/assets/1683599749107-958691af-376a-41af-9b4a-93d5e26a7287.png)

#### 字符串不加引号

字符串列与数字比较可能触发隐式类型转换，影响结果语义与索引使用。让参数类型与列类型一致，例如将手机号作为字符串比较。

![字符串不加引号](/note-mysql/assets/1683599826525-1206126d-9e33-4761-9851-adae41325e11.png)

#### 模糊查询

`LIKE 'abc%'` 可能转换成 B+ 树范围查找；`LIKE '%abc'` 通常不能按固定前缀定位，但仍可能选择索引扫描。实际选择还取决于排序规则、过滤比例及查询列。

![模糊查询](/note-mysql/assets/1683599991399-08e2c48d-36cd-4506-a623-1436555508f3.png)

#### or 连接查询

`OR` 两边的条件需要分别评估。若都有适用索引，可能使用 Index Merge；某个分支没有合适访问路径时，可能转为全表扫描，不能只看其中一个条件有索引。

![or 连接查询](/note-mysql/assets/1683600164721-0f92326f-9acf-4999-b239-1f92d4f5c122.png)

#### 数据分布影响

当匹配行很多、回表成本较高时，全表扫描可能更便宜。优化器根据成本和统计信息做选择；必要时检查统计信息是否过期。

![数据分布影响](/note-mysql/assets/1683600418538-bb247519-fc21-43d7-a3f7-0dda5d0dd9f8.png)

### 2.6.5 SQL 提示

以下提示针对同一张案例表中已建立的索引，仅在理解成本差异后使用：

```sql
EXPLAIN SELECT * FROM tb_user USE INDEX (idx_user_pro_age_sta)
WHERE profession = '软件工程';
EXPLAIN SELECT * FROM tb_user IGNORE INDEX (idx_user_pro_age_sta)
WHERE profession = '软件工程';
EXPLAIN SELECT * FROM tb_user FORCE INDEX (idx_user_pro_age_sta)
WHERE profession = '软件工程';
```

`USE INDEX` 限制考虑的索引集合，仍允许全表扫描；`IGNORE INDEX` 排除指定索引；`FORCE INDEX` 使全表扫描显得更昂贵，但不是对任何条件都保证指定索引可用。[索引提示](https://dev.mysql.com/doc/refman/8.4/en/index-hints.html)

![SQL 提示](/note-mysql/assets/1683601101255-520cab75-5d48-4a8e-99c4-c924629f53f1.png)

### 2.6.6 覆盖索引 {#_2-6-7-覆盖索引}

查询需要的列都能从某个索引取得时，可以减少回表。InnoDB 二级索引包含聚集键，因此查询主键不一定需要把它重复加入索引定义。

```sql
EXPLAIN SELECT id, profession, age, status
FROM tb_user
WHERE profession = '软件工程' AND age = 31 AND status = '0';
```

![覆盖索引执行计划](/note-mysql/assets/1683601565449-fbca16ab-ca83-4662-9976-5852144c254a.png)

- `Using index`：查询列可从索引取得。
- `Using index condition`：使用索引条件下推，先检查索引上的部分条件，再决定是否读取完整行；它不等于覆盖索引。

实际访问还受 MVCC 可见性检查等影响。[EXPLAIN 补充信息](https://dev.mysql.com/doc/refman/8.4/en/explain-output.html)

![覆盖索引示例](/note-mysql/assets/1683602046074-f2f7feb9-e8fa-467b-8b99-a9b748f2c04f.png)

![回表与覆盖索引对照](/note-mysql/assets/1683602207051-1e43a1fa-ea9d-404b-ac1a-59bc28e3b06a.png)

### 2.6.7 前缀索引 {#_2-6-8-前缀索引}

长字符串可以只索引前面一段，节省空间，但区分度可能降低。以下语句比较完整邮箱和前 5 个字符的区分度，再练习创建前缀索引：

```sql
SELECT COUNT(DISTINCT email) / NULLIF(COUNT(email), 0) FROM tb_user;
SELECT COUNT(DISTINCT LEFT(email, 5)) / NULLIF(COUNT(email), 0) FROM tb_user;
CREATE INDEX idx_email_5 ON tb_user (email(5));
```

![选择索引前缀长度](/note-mysql/assets/1683602956667-98410e63-ad59-437a-a4b4-4881914f7022.png)

![前缀索引执行示例](/note-mysql/assets/1683603130949-a86e40aa-aa3c-4ccf-9dfa-8a1167064123.png)

非二进制字符串的前缀长度按字符计算。只保存前缀通常不能覆盖对完整字符串的查询，使用它约束唯一性也只约束所索引的前缀。[列索引与前缀](https://dev.mysql.com/doc/refman/8.4/en/column-indexes.html)

### 2.6.8 单列索引与联合索引 {#_2-6-9-单列索引-联合索引}

单列索引只包含一个键列，联合索引包含多个键列。选择哪些列、采用什么顺序，应结合常见过滤、排序、覆盖需求及写入成本；不能把「多个条件」一概等同于「必须再建一个联合索引」。

![单列索引与联合索引对照](/note-mysql/assets/1683603454643-ccb12e40-487d-44d5-8aad-57dacb7db5f2.png)

## 2.7 索引设计原则

- 优先优化实际高频或高成本的查询，结合扫描量、延迟与资源占用验证收益。
- 按过滤、连接、排序、分组的组合需求设计列顺序。
- 主键宜稳定且不过长，二级索引也要承担聚集键的空间成本。
- 避免重复或低收益索引，每个索引都会增加维护成本。
- `NOT NULL` 应表达业务规则，不能为了索引而把有意义的缺失值替换成伪造数据。
