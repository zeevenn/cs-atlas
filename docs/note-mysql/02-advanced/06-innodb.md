---
title: "6. InnoDB 引擎"
---

## 6.1 逻辑存储结构

![逻辑存储结构](/note-mysql/assets/1684114494772-c2ccff78-ec25-4c93-b3e8-9f6c6a2d062d.png)

表空间由页等结构组织，页是 InnoDB 数据存取的重要单位，默认页大小为 16 KiB。区、段用于管理页面分配；不能把图中结构理解成每张表都必须独占一个文件。[InnoDB 存储结构](https://dev.mysql.com/doc/refman/8.4/en/innodb-file-space.html)

## 6.2 架构

InnoDB 是 MySQL 8.4 的默认存储引擎。下图按内存、磁盘和后台线程组织原理；旧图中的文件数量和参数默认值不一定适用于 8.4。

![架构](/note-mysql/assets/1684114557545-b7843d64-af23-4bf5-a56b-1f4697bfd804.png)

### 6.2.1 内存架构

![内存架构](/note-mysql/assets/1684114845545-688a71f6-966c-4e92-aab9-6f2bbce0f4be.png)

#### Buffer Pool

缓冲池缓存数据页、索引页等内容。访问未缓存的页时需要从存储读取；修改通常先作用于缓冲池中的页，再由刷脏机制写回文件。

- 空闲页：可用于后续分配。
- 干净页：内容与磁盘一致。
- 脏页：已修改，尚未完成相应的落盘。

缓冲池大小要为连接内存、排序、操作系统等留出余量，不能无条件使用固定百分比。

```sql
SELECT @@innodb_buffer_pool_size, @@innodb_page_size;
```

#### Change Buffer

更改缓冲针对符合条件、尚未在缓冲池中的非唯一二级索引页，暂存部分索引变更，后续在读页或后台合并时应用，从而减少随机 I/O。它不是对所有数据页都生效的写缓存。

![Change Buffer](/note-mysql/assets/1684115381993-718796c2-37e6-4f65-bd8b-fb09c8d92bb9.png)

MySQL 8.4 的 `innodb_change_buffering` 默认值为 `none`；原资料中默认启用的描述属于旧版本。[更改缓冲](https://dev.mysql.com/doc/refman/8.4/en/innodb-change-buffer.html)

#### Adaptive Hash Index

自适应哈希索引根据已缓存的 B+ 树访问模式构建，可能加速部分等值查找；它不替代原有 B+ 树索引，也不保证对所有负载有效。控制变量是 `innodb_adaptive_hash_index`，MySQL 8.4 默认关闭。[InnoDB 参数](https://dev.mysql.com/doc/refman/8.4/en/innodb-parameters.html#sysvar_innodb_adaptive_hash_index)

#### Log Buffer

日志缓冲区暂存要写入 redo log 文件的日志记录，**不是把 redo 和 undo 都放在同一个日志缓冲区**。MySQL 8.4 的 `innodb_log_buffer_size` 默认是 64 MiB。

```sql
SELECT @@innodb_change_buffering, @@innodb_adaptive_hash_index,
       @@innodb_log_buffer_size, @@innodb_flush_log_at_trx_commit;
```

`innodb_flush_log_at_trx_commit` 影响 redo 的写入和持久化时机，不能把「事务已提交」与任何配置下都能承受断电画等号。[日志缓冲区参数](https://dev.mysql.com/doc/refman/8.4/en/innodb-parameters.html#sysvar_innodb_log_buffer_size)

### 6.2.2 磁盘架构

![磁盘架构](/note-mysql/assets/1684115945734-961cd924-a1dc-4572-a9a5-c9999708ab1d.png)

#### System Tablespace

系统表空间保存更改缓冲等内部数据，也可包含位于该表空间的用户表及索引。具体组成与版本、配置有关。

#### File-per-Table-Tablespaces

独立表空间通常用一个 `.ibd` 文件保存一张表的数据和索引。是否采用它取决于建表时的表空间配置。

#### General Tablespaces

通用表空间可以容纳多张表，通过 `CREATE TABLESPACE` 创建，建表时用 `TABLESPACE` 指定。[InnoDB 表空间](https://dev.mysql.com/doc/refman/8.4/en/innodb-tablespace.html)

#### Undo Tablespaces

undo 表空间保存回滚和版本重建所需的 undo 记录。MySQL 8.4 初始化时创建默认 undo 表空间，也支持额外管理，不能把它理解成每张表自带一个 undo 文件。

#### Temporary Tablespaces

InnoDB 使用临时表空间存放相应临时表及内部数据，区分会话临时表空间和全局临时表空间。

#### Doublewrite Buffer Files

数据页写入最终位置前，通常先写入双写缓冲区，以便在发生部分页写入时恢复完整页面。redo 用于后续重放，两者解决的问题不同。[双写缓冲区](https://dev.mysql.com/doc/refman/8.4/en/innodb-doublewrite-buffer.html)

#### Redo Log

redo log 保存恢复数据页变更所需的日志。MySQL 8.0.30 起采用新的 redo 文件管理方式；8.4 通常在 `#innodb_redo` 中维护普通和备用文件，总容量由 `innodb_redo_log_capacity` 控制，不再固定为两个 `ib_logfile` 文件。[Redo 文件布局](https://dev.mysql.com/doc/refman/8.4/en/innodb-redo-log.html)

### 6.2.3 后台线程

![后台线程](/note-mysql/assets/1684116846359-13cb6bb2-2ee2-4d8d-be7b-b0f509a52a3f.png)

#### Master Thread

负责部分后台维护与协调工作。具体任务由多种后台线程协作完成，不能把所有刷页、清理和日志写入都归给一个主线程。

#### IO Thread

I/O 相关线程协助处理异步读写和完成通知；日志写入等任务还由专门线程参与。线程数量与行为取决于版本和配置。

![IO Thread](/note-mysql/assets/1684117070396-bfba2e25-aa56-4308-9946-45c0e467abb4.png)

#### Purge Thread

在旧版本不再被事务快照需要时，清理相关 undo 历史和删除标记记录。长事务可能阻碍这类清理。

#### Page Cleaner Thread

负责脏页刷新等工作，帮助控制脏页和检查点推进。不能把旧图中的线程数量当作所有版本的固定值。[InnoDB 后台线程](https://dev.mysql.com/doc/refman/8.4/en/innodb-architecture.html)

## 6.3 事务原理

### 6.3.1 事务基础

- **原子性**：事务修改作为整体提交或撤销，undo 是回滚的重要基础。
- **一致性**：事务前后满足已定义的数据与业务规则，仍需要约束和正确业务逻辑配合。
- **隔离性**：通过锁、MVCC 等机制约束并发可见性，不表示事务完全互不影响。
- **持久性**：提交后的修改持久保存，redo、刷盘策略和可靠存储共同影响故障保证。

回滚表示撤销本次修改，不是让被撤销的修改永久生效。[InnoDB 与 ACID](https://dev.mysql.com/doc/refman/8.4/en/mysql-acid.html)

### 6.3.2 Redo log

事务修改页面时产生 redo，数据页可以稍后刷盘。WAL 要求相应 redo 在脏页写入最终位置之前先持久化，这样发生崩溃时才能利用日志恢复页面变更。

![Redo 与脏页刷新](/note-mysql/assets/1684118279157-a4a5c261-febf-4bcb-9b0d-204ef4b63ebd.png)

这把随机数据页写入与日志写入分开调度，减少每次提交都刷新全部修改页的代价。redo 不是单纯的 SQL 语句日志；恢复时也需要撤销未提交事务的修改。

![WAL 与故障恢复示意](/note-mysql/assets/1684118539655-bd383304-dd5b-4028-a900-eab0893354b9.png)

检查点推进后，已经不再需要的 redo 空间可以复用。**不能因为某一页已经写盘，就手动删除 redo 文件。** 文件布局与复用由 InnoDB 管理。[Redo log](https://dev.mysql.com/doc/refman/8.4/en/innodb-redo-log.html)

### 6.3.3 Undo log

undo 保存撤销修改及重建旧版本所需的信息，用于事务回滚和一致性读。可以用「恢复修改前的状态」理解它，但它不是简单保存一条相反的 SQL。

提交后，仍可能有旧快照需要这些历史信息，所以不能立即清除所有 undo。清理和空间回收还受 purge、活跃快照及表空间管理影响。[Undo 与多版本](https://dev.mysql.com/doc/refman/8.4/en/innodb-multi-versioning.html)

## 6.4 MVCC

### 6.4.1 基本概念

**锁定读**：`SELECT ... FOR SHARE`、`SELECT ... FOR UPDATE` 等读取最新可用记录并加锁，遇到冲突时可能等待。`UPDATE`、`DELETE` 也不能按旧快照中的值直接推断执行结果。

**一致性读（快照读）**：在 `READ COMMITTED`、`REPEATABLE READ` 下，普通 `SELECT` 通常按读视图读取可见版本，不为读取的记录申请行锁；仍涉及 MDL。当前事务自己的修改可见。

MVCC 通过记录中的事务信息、undo 版本链和读视图判断可见性，让普通读取与部分并发写入能够同时进行。它不消除写写冲突，不能用它替代需要的锁和约束。[一致性非锁定读](https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html)

### 6.4.2 隐藏字段

![隐藏字段](/note-mysql/assets/1684119419106-ff6ab3f6-40a7-4051-aacf-98a9685c3e34.png)

| 字段          | 用途                                             |
| ------------- | ------------------------------------------------ |
| `DB_TRX_ID`   | 最近插入或修改聚集索引记录的事务编号             |
| `DB_ROLL_PTR` | 指向相关 undo 信息，用于重建旧版本               |
| `DB_ROW_ID`   | 没有合适显式聚集键时，供隐藏聚集索引使用的行编号 |

不能把 `DB_ROW_ID` 理解成所有表都额外使用的业务主键；二级索引记录的版本处理也不能照搬聚集索引的隐藏字段结构。[InnoDB 多版本实现](https://dev.mysql.com/doc/refman/8.4/en/innodb-multi-versioning.html)

### 6.4.3 Undo log

插入类 undo 主要用于回滚，提交后不再需要为其保留同样的旧版本链；更新类 undo 还用于一致性读，要等需要它的旧快照结束后，才能由清理机制回收。

![Undo 版本链示意](/note-mysql/assets/1684120016131-8294001e-aa7e-4397-a8a1-f2fbf5d0ba72.png)

### 6.4.4 ReadView

ReadView 记录创建读视图时的活跃读写事务、事务编号边界以及创建者信息，用于判断某个版本是否可见。

![读视图中的事务信息](/note-mysql/assets/1684120169127-bc856375-497c-41d9-99c7-580fa951689a.png)

可以按以下规则理解事务版本：创建者自己的修改可见；在读视图创建前已经提交的版本通常可见；当时仍活跃或在此后才开始修改的事务版本不可见，需要沿 undo 查找更早版本。

![版本可见性判断示意](/note-mysql/assets/1684120329897-be8c7b3f-d708-4f2f-960e-73abe269f224.png)

| 隔离级别          | 普通一致性读的读视图                     |
| ----------------- | ---------------------------------------- |
| `READ COMMITTED`  | 每次一致性读建立新的读视图               |
| `REPEATABLE READ` | 通常复用事务内第一次一致性读建立的读视图 |

普通 `START TRANSACTION` 不立即建立一致性读快照；`START TRANSACTION WITH CONSISTENT SNAPSHOT` 是另一种显式请求方式，其效果与隔离级别有关。`SERIALIZABLE` 的显式事务中，普通查询会转为共享锁读取，不能照搬上述快照结果。[隔离级别](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html)
