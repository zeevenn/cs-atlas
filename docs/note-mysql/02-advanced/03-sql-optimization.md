---
title: "3. SQL 优化"
---

## 3.1 插入数据

### 3.1.1 INSERT

#### 批量插入

多行插入可以减少网络往返和语句处理开销；单次批量大小仍需结合事务时长、包大小和内存占用选择。

```sql
CREATE TABLE tb_test (
    id INT PRIMARY KEY,
    name VARCHAR(50) NOT NULL
) ENGINE = InnoDB;

INSERT INTO tb_test (id, name)
VALUES (1, 'Tom'), (2, 'Cat'), (3, 'Jerry');
```

#### 手动事务提交

把多次插入放在同一事务中，可以减少逐条提交的开销；不能因此把无限量数据放进一笔事务。

```sql
START TRANSACTION;
INSERT INTO tb_test (id, name) VALUES (4, 'Tom'), (5, 'Cat');
INSERT INTO tb_test (id, name) VALUES (6, 'Jerry'), (7, 'Ann');
COMMIT;
```

#### 主键顺序插入

InnoDB 按聚集索引组织记录。递增主键通常让插入集中在索引末端，减少随机访问和部分页分裂；不代表所有顺序插入都没有分裂或锁竞争。

### 3.1.2 大批量插入数据

`LOAD DATA` 可以导入分隔符文本。它读取的是数据文件，不是执行包含 `CREATE TABLE`、`INSERT` 的 SQL 脚本。

![大批量插入数据](/note-mysql/assets/1683607992162-fb2710e0-2ffd-49be-9f0e-f71ff937e93a.png)

```sh
# 仅对可信文件和可信服务器开启本地文件导入
mysql --local-infile=1 -u root -p atlas_demo
```

服务器也需允许 `local_infile`；由管理员按环境决定是否开启。非 `LOCAL` 导入还受 `FILE` 权限及 `secure_file_priv` 等限制。[LOAD DATA 语法与安全要求](https://dev.mysql.com/doc/refman/8.4/en/load-data.html)

#### 案例演示

用独立表练习，避免与索引章的 `tb_user` 结构冲突：

```sql
CREATE TABLE tb_import_user (
    id INT PRIMARY KEY,
    name VARCHAR(50) NOT NULL
) ENGINE = InnoDB;

LOAD DATA LOCAL INFILE '/path/to/users.csv'
INTO TABLE tb_import_user
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
LINES TERMINATED BY '\n'
(id, name);
```

示例文件每行形如 `1,Tom`，不包含表头。带引号、转义字符、不同换行符或表头的文件，需要相应调整导入选项。若文件本身是 SQL 脚本，应在客户端中使用 `SOURCE 文件路径` 等方式执行。

![旧环境中的批量导入结果示例](/note-mysql/assets/1683609093736-d6de9cd9-bb45-4feb-866d-9616d8806cfa.png)

## 3.2 主键优化

### 3.2.1 数据组织方式

InnoDB 的行数据位于聚集索引叶子页中，通常以主键作为聚集键，因此称为索引组织表。逻辑上的键顺序不等于文件中所有页面都连续排列。

![聚集索引与行数据](/note-mysql/assets/1683609402461-829339dc-02a4-4831-94b1-5b409055e0a1.png)

![InnoDB 页面与表空间](/note-mysql/assets/1683609468037-e38a3029-ff5e-4fbe-bce7-26a0c6dec812.png)

页大小由 `innodb_page_size` 决定，默认是 16 KiB；每页可容纳多少行取决于记录大小、页内开销等，不是固定行数。

### 3.2.2 页分裂

#### 主键顺序插入

1. 按递增主键向索引末端插入记录。
2. 页面空间不足时分配新页，并维护索引结构。

![主键顺序插入](/note-mysql/assets/1683609782965-f0654815-6201-417e-925c-5f8d3cda8a33.png)

#### 主键乱序插入

1. 新键可能需要插入已有页面的中间位置。

![插入前的页面](/note-mysql/assets/1683609905001-48e88274-4814-4c01-affa-1a93e13464a0.png)

1. 先定位新键在索引中的位置。

![定位待插入的键](/note-mysql/assets/1683609967969-312ded27-6a76-4e7e-be47-e81e118b3483.png)

1. 页面空间不足时，可能分配新页、重新分配记录，并维护页面链接及上层索引。

![分配新页](/note-mysql/assets/1683610052314-88fb6069-8cb9-4ff9-9fd2-8dd64a12ad9b.png)

![调整页内记录](/note-mysql/assets/1683610060116-c4bab20b-c6b7-46f7-9640-1373c19f1aa5.png)

![维护页面链接](/note-mysql/assets/1683610065925-04e05375-5514-4e25-9009-5d34acbe2784.png)

这个过程称为页分裂。图中的移动方式用于解释原理，不表示每次都机械地移动一半记录。

### 3.2.3 页合并

删除记录通常先做删除标记，再由 purge 等过程清理。页面空间利用率过低时，InnoDB 会尝试合并相邻页；能否合并取决于相邻页是否有足够空间。

![页合并](/note-mysql/assets/1683610374550-af831cba-553f-4748-a402-4265ad41a5ff.png)

`MERGE_THRESHOLD` 控制尝试合并时的页面填充率阈值，默认是 50%。它不是「删除行数达到一半就必然合并」。[页合并阈值](https://dev.mysql.com/doc/refman/8.4/en/index-page-merge-threshold.html)

### 3.2.4 主键设计原则

- 在满足业务唯一性和取值范围的前提下，选择较短、稳定的主键。
- 递增主键通常有利于插入局部性，但仍需考虑热点和分布式生成需求。
- 随机 UUID 可能增加索引体积与随机访问；是否采用要结合编码方式、写入模式和业务约束判断。
- 尽量避免频繁修改主键，二级索引也保存聚集键，修改会增加维护成本。

## 3.3 ORDER BY 优化

有两种常见方式：按可满足排序的索引顺序读取，或额外执行 `filesort`。`Using filesort` 不表示一定写磁盘，是否溢出取决于数据规模和排序缓冲区。

`Using index` 表示覆盖索引，**不能仅凭这个标记判断是否避免了排序**。要结合 `ORDER BY`、索引列顺序、执行计划中的排序节点或 `Using filesort` 分析。[ORDER BY 优化](https://dev.mysql.com/doc/refman/8.4/en/order-by-optimization.html)

### 案例演示

![排序执行计划示例](/note-mysql/assets/1683611736658-a5a874ee-c7c7-40f1-86a8-8e4404923b51.png)

![不同排序方向的执行计划示例](/note-mysql/assets/1683612032954-2131997a-7e4f-44b1-b642-970cb7684dd2.png)

### 优化原则

- 结合等值过滤条件和排序列设计联合索引。
- MySQL 8.4 支持降序索引；混合升降序排序需要合适的索引方向，也可能通过反向扫描满足。
- 只查询需要的列，覆盖索引可能减少回表。
- 无法避免排序时，再结合实际排序规模评估 `sort_buffer_size`，不要盲目增大所有连接的内存配置。

## 3.4 GROUP BY 优化

![GROUP BY 优化](/note-mysql/assets/1683612718935-72f18e62-e500-44ce-a1b0-d168f19c9205.png)

合适的索引可能减少分组扫描、排序或临时表开销，具体取决于分组列、过滤条件和聚合方式。`GROUP BY` 不保证输出顺序，需要排序时显式写 `ORDER BY`。[GROUP BY 优化](https://dev.mysql.com/doc/refman/8.4/en/group-by-optimization.html)

## 3.5 LIMIT 优化

深分页的成本来自跳过前面的记录。`LIMIT 2000000, 10` 通常仍需访问前面的记录；如果索引已经满足排序，也不意味着这些记录都要额外排序。

![深分页执行示例](/note-mysql/assets/1683613643399-0e3dace1-69db-4bcd-a07a-9f5f76051b97.png)

可以先从覆盖索引中取得目标主键，再取完整行。以下 `tb_sku` 来自索引章的独立测试表：

```sql
SELECT t.*
FROM tb_sku AS t
INNER JOIN (
    SELECT id FROM tb_sku ORDER BY id LIMIT 2000000, 10
) AS page ON page.id = t.id
ORDER BY t.id;
```

![延迟获取完整行的示例](/note-mysql/assets/1683613956369-4c97005e-aca8-475a-9616-1a5b7b9d868c.png)

这能减少部分回表开销，但不能消除跳过记录的成本。连续翻页且允许以主键作为游标时，可以使用 `WHERE id > 上次末尾编号 ORDER BY id LIMIT 10`；并发增删及不同排序规则需要另行考虑。

## 3.6 COUNT 优化

- `COUNT(*)` 统计匹配行数；`COUNT(列)` 只统计该列非空的行，语义不同。
- InnoDB 不维护所有事务都能直接使用的精确总行数，需要按当前事务可见性扫描索引等结构进行计数。
- MyISAM 对单表、无 `WHERE` 的总行数统计有专门优化，不能推广到所有带条件查询。

![旧环境中的计数执行示例](/note-mysql/assets/1683614139218-51f59b2e-4cbd-4f4b-b5c4-c7fc67d99bf8.png)

InnoDB 对 `COUNT(1)` 和 `COUNT(*)` 的处理相同，不存在必须套用的「列 < 主键 < 1 < *」性能排名。按正确语义选择写法，再检查过滤条件和执行计划。[COUNT 规则](https://dev.mysql.com/doc/refman/8.4/en/aggregate-functions.html)

预先维护计数可以减少查询成本，但必须同时解决事务一致性、失败重试和并发更新；用缓存保存一个数字并不会自动得到准确结果。

## 3.7 UPDATE 优化

InnoDB 的记录锁加在索引记录上。缺少合适索引时，语句可能扫描并锁住大量记录，影响范围看起来接近整表，但 **不会因此自动把行锁升级成表锁**。

锁的范围取决于实际扫描的索引、隔离级别和匹配情况。`READ COMMITTED` 还会释放不匹配记录的部分锁；不能只凭 `WHERE` 中写了索引列，就认定只锁一行。应缩小扫描范围、保持事务简短，并结合 [锁章节](05-locks.md) 分析。[InnoDB 语句加锁规则](https://dev.mysql.com/doc/refman/8.4/en/innodb-locks-set.html)
