---
title: "5. 锁"
---

## 5.1 概述

锁用于协调并发访问。分析一条 SQL 会不会阻塞另一条 SQL，需要同时看事务边界、隔离级别、访问路径，以及双方请求的锁类型。

## 5.2 分类

- 全局读锁：限制整个实例上的表更新，常用于某些备份或维护流程。
- 表级锁：作用于表范围，包括显式表锁、元数据锁和 InnoDB 意向锁等。
- 记录锁与间隙锁：作用于索引记录或索引间隙，控制更细粒度的并发访问。

## 5.3 全局锁 {#_5-2-全局锁}

`FLUSH TABLES WITH READ LOCK` 获取全局读锁，会阻塞更新表数据、修改表结构等操作，并可能等待已有操作。锁由当前连接持有，不能在加锁后立即断开连接再认为锁仍然存在。

### 5.3.1 语法 {#_5-2-1-语法}

在同一个管理连接中获取和释放锁：

```sql
FLUSH TABLES WITH READ LOCK;
-- 另一个连接按既定备份流程执行备份
UNLOCK TABLES;
```

需要足够的管理权限；实际备份应事先评估等待、业务阻塞和解锁流程。[FLUSH TABLES 规则](https://dev.mysql.com/doc/refman/8.4/en/flush.html)

### 5.3.2 特点 {#_5-2-2-特点}

全局读锁会阻塞业务写入，也可能影响副本应用复制事件。对于全部使用 InnoDB 的逻辑备份，通常可以利用一致性快照减少锁定时间：

```sh
mysqldump --single-transaction -u root -p atlas_demo > atlas_demo.sql
```

`--single-transaction` 不为 MyISAM 等非事务表提供相同的一致性保证；备份期间仍需协调 `ALTER TABLE`、`DROP TABLE` 等 DDL。[mysqldump 一致性备份](https://dev.mysql.com/doc/refman/8.4/en/mysqldump.html#option_mysqldump_single-transaction)

## 5.4 表级锁 {#_5-3-表级锁}

### 5.4.1 表锁 {#_5-3-1-表锁}

显式表锁通过 `LOCK TABLES` 获取，通过 `UNLOCK TABLES` 释放。例如，使用索引章建立的 `tb_user` 表：

```sql
LOCK TABLES tb_user READ;
SELECT id, name FROM tb_user ORDER BY id;
UNLOCK TABLES;
```

**读锁**：其他连接可以读，写入需要等待读锁释放。

![表共享读锁示例](/note-mysql/assets/1683786796151-9a2c6937-2593-4b3d-bbf0-7f70215e3a85.png)

**写锁**：持锁连接可以读写，其他连接对该表的读写会等待。

![表独占写锁示例](/note-mysql/assets/1683786811724-c96005fd-50b7-4dad-80a1-91ea6bf49d9e.png)

`LOCK TABLES` 有隐式提交等特殊事务规则，不应用它代替常规 InnoDB 事务中的行级并发控制。[LOCK TABLES 规则](https://dev.mysql.com/doc/refman/8.4/en/lock-tables.html)

### 5.4.2 元数据锁 {#_5-3-2-元数据锁}

元数据锁（MDL）保护表定义等元数据。访问表时由服务器自动获取；事务访问过的表，其相关 MDL 通常要到事务结束才释放，因此长事务可能阻塞后续 DDL。

DML 和查询通常取得共享类 MDL，变更表结构的 DDL 需要更强的 MDL。即使使用在线 DDL，也可能在部分阶段等待元数据锁，不能简单理解成「在线操作完全不加锁」。

![元数据锁](/note-mysql/assets/1683787154206-4666f7f2-aaf5-4ce2-917e-a74e91afd74e.png)

```sql
SELECT object_type, object_schema, object_name,
       lock_type, lock_duration, lock_status
FROM performance_schema.metadata_locks
WHERE object_schema = DATABASE();
```

需要相应的查看权限和 Performance Schema 监控配置。[元数据锁](https://dev.mysql.com/doc/refman/8.4/en/metadata-locking.html)

### 5.4.3 意向锁 {#_5-3-3-意向锁}

InnoDB 的意向锁是表级标记，用来说明事务已持有或准备获取某些行的锁，让表级锁请求不必逐行检查。

![意向锁](/note-mysql/assets/1683787539843-8c5facac-ad64-469f-9c9c-274ed32d2214.png)

| 意向锁 | 典型来源                                       | 与表级共享锁 `S` | 与表级排他锁 `X` |
| ------ | ---------------------------------------------- | ---------------- | ---------------- |
| `IS`   | `SELECT ... FOR SHARE`                         | 兼容             | 冲突             |
| `IX`   | `SELECT ... FOR UPDATE`、`UPDATE`、`DELETE` 等 | 冲突             | 冲突             |

`IS` 与 `IX` 之间互相兼容，但这不表示它们保护的行锁也一定兼容。普通一致性读通常不会因此申请行共享锁。[意向锁兼容规则](https://dev.mysql.com/doc/refman/8.4/en/innodb-locking.html)

## 5.5 行级锁 {#_5-4-行级锁}

InnoDB 的记录锁加在索引记录上；没有显式主键的表，也有聚集索引供访问。缺少合适索引可能扩大扫描及加锁范围，**不是自动升级成表锁**。

**记录锁**：锁定索引记录。

![记录锁](/note-mysql/assets/1683788379718-4f5eda46-e9bc-4c0c-97ad-d2e61b87ea92.png)

**间隙锁**：锁定索引记录之间的间隙，也可能覆盖首条记录之前或末条记录之后的间隙，主要用于阻止插入。

![间隙锁](/note-mysql/assets/1683788387453-b105af42-2eba-4088-b974-cd69fd500d07.png)

**临键锁（next-key lock）**：记录锁与其前方间隙锁的组合。

![临键锁](/note-mysql/assets/1683788392491-363e25f3-53d5-4ecc-bb7b-96e4e69d9934.png)

### 5.5.1 行锁 {#_5-4-1-行锁}

记录锁分为共享锁 `S` 和排他锁 `X`：共享锁之间兼容；同一记录上的排他锁与其他事务的共享锁、排他锁冲突。

```sql
START TRANSACTION;
SELECT id, name FROM tb_user WHERE id = 1 FOR UPDATE;
-- 在同一事务中完成依赖这条记录的操作
COMMIT;
```

唯一索引精确查找已存在的记录时，通常只需对目标记录加记录锁。普通一致性读仍可能读取该行的历史版本，所以「排他锁阻止其他事务读取」应限定为冲突的锁定读。[InnoDB 加锁读取](https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html)

![共享锁与排他锁示例](/note-mysql/assets/1683788478581-32b14b7a-4fde-4b8d-9853-df35b6465b3a.png)

![记录锁冲突示例](/note-mysql/assets/1683788487175-a24d30fc-4ff6-4e3a-9b7e-f43a39299852.png)

### 5.5.2 间隙锁与临键锁 {#_5-4-2-间隙锁-临键锁}

在默认的 `REPEATABLE READ` 下，范围锁定读及修改可能使用临键锁，防止其他事务向扫描范围插入新记录。

- 完整匹配唯一索引、且目标记录存在时，通常不需要锁前方间隙。
- 唯一索引等值查找未命中时，可能锁住目标键应落入的间隙。
- 非唯一索引等值查找及范围扫描，要结合实际扫描的索引区间和执行计划分析，不能只背某个比较符对应固定锁范围。
- `READ COMMITTED` 通常不为一般搜索使用间隙锁，但外键检查和重复键检查等仍有例外。

间隙锁之间可以共存，它们主要阻止其他事务向间隙插入记录。快照读与锁定读应分开分析，不能用「RR 一定有幻读」概括所有读取方式。[锁类型与适用条件](https://dev.mysql.com/doc/refman/8.4/en/innodb-locking.html)
