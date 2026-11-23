---
title: "3. SQL 优化"
---

## 3.1 插入数据

### 3.1.1 INSERT

#### 批量插入

`Insertinto tb_test values(1,'Tom'),(2,'Cat'),(3,'Jerry');`

#### 手动事务提交

```sql
start transaction;

insert into tb_test values(1,'Tom'),(2,'Cat'),(3,'Jerry');

insert into tb_test values(4,'Tom'),(5,'Cat'),(6,'Jerry');

insert into tb_test values(7,'Tom'),(8,'Cat'),(9,'Jerry');
commit;
```

#### 主键顺序插入

- 主键乱序插入 : 8 1 9 21 88 2 4 15 89 5 7 3
- 主键顺序插入 : 1 2 3 4 5 7 8 9 15 21 88 89

### 3.1.2 大批量插入数据

如果一次性需要插入大批量数据，使用 `insert` 语句插入性能较低，此时可以使用 MySQL 数据库提供的 load 指令进行插入：
![大批量插入数据（图 1）](/note-mysql/assets/1683607992162-fb2710e0-2ffd-49be-9f0e-f71ff937e93a.png)

```sh
# 客户端连接服务端时，加上参数 --local-infile

mysql --local-infile -u root -p
```

```sql
-- 设置全局参数local_infile为1，开启从本地加载文件导入数据的开关

set global local_infile = 1;

-- 执行load指令将准备好的数据，加载到表结构中

load data local infile '/root/sql1.log' into table tb_user fields
terminated by ',' lines terminated by '\n' ;
```

#### 案例演示

首先连接服务器并且设置完参数后（`local_infile`）后，创建表：

```sql
CREATE TABLE `tb_user` (
 `id` INT(11) NOT NULL AUTO_INCREMENT,
 `username` VARCHAR(50) NOT NULL,
 `password` VARCHAR(50) NOT NULL,
 `name` VARCHAR(20) NOT NULL,
 `birthday` DATE DEFAULT NULL,
 `sex` CHAR(1) DEFAULT NULL,
 PRIMARY KEY (`id`),
 UNIQUE KEY `unique_user_username` (`username`)
) ENGINE=INNODB DEFAULT CHARSET=utf8 ;
```

然后导入 sql 文件 [`load_user_100w_sort`.sql](https://www.yuque.com/attachments/yuque/0/2023/sql/35653686/1683609019369-904f5608-c30a-4ed7-ab6b-68519c9f32fe.sql?_lake_card=%7B%22src%22%3A%22https%3A%2F%2Fwww.yuque.com%2Fattachments%2Fyuque%2F0%2F2023%2Fsql%2F35653686%2F1683609019369-904f5608-c30a-4ed7-ab6b-68519c9f32fe.sql%22%2C%22name%22%3A%22load_user_100w_sort.sql%22%2C%22size%22%3A57650380%2C%22ext%22%3A%22sql%22%2C%22source%22%3A%22%22%2C%22status%22%3A%22done%22%2C%22download%22%3Atrue%2C%22taskId%22%3A%22u694ba945-9e87-484d-8bd5-048dfea12b3%22%2C%22taskType%22%3A%22upload%22%2C%22type%22%3A%22%22%2C%22__spacing%22%3A%22both%22%2C%22mode%22%3A%22title%22%2C%22id%22%3A%22ua966eff0%22%2C%22margin%22%3A%7B%22top%22%3Atrue%2C%22bottom%22%3Atrue%7D%2C%22card%22%3A%22file%22%7D)
导入文件命令：`load data local infile '/root/load_user_100w_sort.sql' into table tb_user fields terminated by ',' lines terminated by '\n';`
![案例演示（图 1）](/note-mysql/assets/1683609093736-d6de9cd9-bb45-4feb-866d-9616d8806cfa.png)
注意：在使用 load 指令的时候，主键顺序插入性能高于乱序插入

## 3.2 主键优化

### 3.2.1 数据组织方式

在 InnoDB 存储引擎中，表数据都是根据主键顺序组织存放的，这种存储方式的表称为索引组织表（Index prganized `table` IOT）。
![数据组织方式（图 1）](/note-mysql/assets/1683609402461-829339dc-02a4-4831-94b1-5b409055e0a1.png)
行数据，都是存储在聚集索引的叶子节点上的。而我们之前也讲解过 InnoDB 的逻辑结构图：
![数据组织方式（图 2）](/note-mysql/assets/1683609468037-e38a3029-ff5e-4fbe-bce7-26a0c6dec812.png)
在 InnoDB 引擎中，数据行是记录在逻辑结构 page 页中的，而每一个页的大小是固定的，默认 16K。 那也就意味着，一个页中所存储的行也是有限的，如果插入的数据行 row 在该页存储不小，将会存储到下一个页中，页与页之间会通过指针连接。

### 3.2.2 页分裂

页可以为空，也可以填充一半，也可以填充 100%。每个页包含了 2-N 行数据(如果一行数据过大，会行溢出)，根据主键排列。

#### 主键顺序插入

1. 从磁盘中申请页，逐渐顺序插入
2. 若第一页没有满，继续往第一页插入
3. 当第一页写满后，再写入第一个页，页与页之间会通过指针连接
4. 第二页写满了，在往第三页写入....

![主键顺序插入（图 1）](/note-mysql/assets/1683609782965-f0654815-6201-417e-925c-5f8d3cda8a33.png)

#### 主键乱序插入

1. 若页 1，页 2 已经写满，存放了如下数据：
   1. ![主键乱序插入（图 1）](/note-mysql/assets/1683609905001-48e88274-4814-4c01-affa-1a93e13464a0.png)
2. 此时再插入 `id` 为 50 的记录，不会开启新的一页，因为索引结构的叶子节点是有序的，按照顺序应该存放在 47 之后。
   1. ![主键乱序插入（图 2）](/note-mysql/assets/1683609967969-312ded27-6a76-4e7e-be47-e81e118b3483.png)
3. 但是 47 所在的页 1 已经写满了，存储不了 50 对应的数据，此时会开辟一个新的页 3，但是并不会把 50 直接存放进页 3，而是将页 1 后一半的数据移动到页 3，然后再页 3 插入 50 对应的数据，此时需要重新设置链表指针。
   1. ![主键乱序插入（图 3）](/note-mysql/assets/1683610052314-88fb6069-8cb9-4ff9-9fd2-8dd64a12ad9b.png)
   2. ![主键乱序插入（图 4）](/note-mysql/assets/1683610060116-c4bab20b-c6b7-46f7-9640-1373c19f1aa5.png)
   3. ![主键乱序插入（图 5）](/note-mysql/assets/1683610065925-04e05375-5514-4e25-9009-5d34acbe2784.png)

这种现象被称为「页分裂」，是比较耗费性能的操作。

### 3.2.3 页合并

当删除一行记录时，实际上记录并没有被物理删除，只是记录被标记（Flaged）为删除并且它的空间变得允许被其他记录声明使用。
当页中删除的记录达到 `MERGE_THRESHOLD`(默认为页的 50%)，InnoDB 会开始寻找最靠近的页（前或后）看看是否可以将两个页合并以优化空间使用：
![页合并（图 1）](/note-mysql/assets/1683610374550-af831cba-553f-4748-a402-4265ad41a5ff.png)
`MERGE_THRESHOLD`：合并页的阈值，可以自己设置，在创建表或者创建索引时指定。

### 3.2.4 主键设计原则

- 满足业务需求的情况下，尽量降低主键的长度
- 插入数据时，尽量选择顺序插入，选择使用 `AUTO_INCREMENT` 自增主键
- 尽量不要使用 UUID 做主键或者是其他自然主键，如身份证号。
- 业务操作时，避免对主键的修改。

## 3.3 ORDER BY 优化

- `Using filesort`：通过表的索引或全表扫描，读取满足条件的数据行，然后在排序缓冲区 `sort buffer` 中完成排序操作，所有不是通过索引直接返回排序结果的排序都叫 FileSort 排序。
- `Using index`：通过有序索引顺序扫描直接返回有序数据，这种情况即为 `Using index`，不需要额外排序，操作效率高。

对于以上的两种排序方式，`Using index` 的性能高，而 `Using filesort` 的性能低，我们在优化排序 操作时，尽量要优化为 `Using index`。

### 案例演示

![案例演示（图 1）](/note-mysql/assets/1683611736658-a5a874ee-c7c7-40f1-86a8-8e4404923b51.png)
![案例演示（图 2）](/note-mysql/assets/1683612032954-2131997a-7e4f-44b1-b642-970cb7684dd2.png)

### 优化原则

- 根据排序字段建立合适的索引，多字段排序时，也遵循最左前缀法则。
- 尽量使用覆盖索引
- 多字段排序，一个升序一个降序，此时需要注意联合索引在创建时的规则
- 如果不可避免地出现 filesort，大数据量排序时，可以适当增大排序缓冲区的大小：`sort_buffer_size`（默认 256K）。

## 3.4 GROUP BY 优化

![GROUP BY 优化（图 1）](/note-mysql/assets/1683612718935-72f18e62-e500-44ce-a1b0-d168f19c9205.png)

- 在分组操作时，可以通过索引来提高效率。
- 分组操作时，索引的使用也是满足最左前缀法则的。

## 3.5 LIMIT 优化

在数据量比较大时，如果进行 `limit` 分页查询，在查询时，越往后，分页查询效率越低。
案例演示：在 1000w 条记录的表中分页查询：
![LIMIT 优化（图 1）](/note-mysql/assets/1683613643399-0e3dace1-69db-4bcd-a07a-9f5f76051b97.png)
通过测试我们会看到，越往后，分页查询效率越低，这就是分页查询的问题所在。 因为，当在进行分页查询时，如果执行 `limit 2000000,10`，此时需要 MySQL 排序前 2000010 记录，仅仅返回 2000000 - 2000010 的记录，其他记录丢弃，查询排序的代价非常大。
优化思路: 一般分页查询时，通过创建覆盖索引能够比较好地提高性能，可以通过覆盖索引加子查询形式进行优化。

```sql
explain select * from tb_sku t , (select id from tb_sku order by id   limit 2000000,10) a where t.id = a.id;
```

![LIMIT 优化（图 2）](/note-mysql/assets/1683613956369-4c97005e-aca8-475a-9616-1a5b7b9d868c.png)

## 3.6 COUNT 优化

- MyISAM 引擎把一个表的总行数存在了磁盘上，因此执行 `count(*)` 的时候会直接返回这个 数，效率很高；但是如果是带条件的 `count`，MyISAM 也慢。
- InnoDB 引擎就麻烦了，它执行 `count(*)` 的时候，需要把数据一行一行地从引擎里面读出 来，然后累积计数。

如果说要大幅度提升 InnoDB 表的 `count` 效率，主要的优化思路：自己计数(可以借助于 redis 这样的数 据库进行,但是如果是带条件的 `count` 又比较麻烦了)。
`count()` 是一个聚合函数，对于返回的结果集，一行行地判断，如果 `count` 函数的参数不是 `NULL`，累计值就加 1，否则不加，最后返回累计值。
用法：`count(*)`、`count(主键)`、`count(字段)`、`count(数字)`
![COUNT 优化（图 1）](/note-mysql/assets/1683614139218-51f59b2e-4cbd-4f4b-b5c4-c7fc67d99bf8.png)
按照效率排序的话，`count(字段)` `<` `count(主键 id)` `<` `count(1)` ≈ `count(*)`，所以尽量使用 `count(*)`。

## 3.7 UPDATE 优化

InnoDB 的行锁是针对索引加的锁，不是针对记录加的锁 ,并且该索引不能失效，否则会从行锁 升级为表锁。其实简单来说就是两个事务同时修改表记录，如果查询条件是索引列，则使用的是行锁，锁的是当前这条记录，如果查询条件是非索引列，那么行锁就会升级为表锁，另一个事务会阻塞，直到其他事务已经提交完成。
