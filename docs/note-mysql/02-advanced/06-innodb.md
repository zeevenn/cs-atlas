---
title: "6. InnoDB 引擎"
---

## 6.1 逻辑存储结构

![逻辑存储结构（图 1）](/note-mysql/assets/1684114494772-c2ccff78-ec25-4c93-b3e8-9f6c6a2d062d.png)

## 6.2 架构

MySQL 5.5 版本开始，默认使用 InnoDB 存储引擎，它擅长事务处理，具有崩溃恢复特性，在日常开发 中使用非常广泛。下面是 InnoDB 架构图，左侧为内存结构，右侧为磁盘结构。
![架构（图 1）](/note-mysql/assets/1684114557545-b7843d64-af23-4bf5-a56b-1f4697bfd804.png)

### 6.2.1 内存架构

![内存架构（图 1）](/note-mysql/assets/1684114845545-688a71f6-966c-4e92-aab9-6f2bbce0f4be.png)
在内存结构中，主要分为四块：Buffer Pool、Change Buffer、`Adaptive Hash index`、Log Buffer

#### Buffer Pool

InnoDB 存储引擎基于磁盘文件存储，访问物理硬盘和在内存中进行访问，速度相差很大，为了尽可能弥补这两者之间的 I/O 效率的差值，就需要把经常使用的数据加载到缓冲池中，避免每次访问都进行磁盘 I/O。在 InnoDB 的缓冲池中不仅仅缓存了索引页和数据页，还包含了 `undo` 页、插入缓存、自适应哈希索引以及 InnoDb 的锁信息等。
缓冲池 Buffer Pool，是主内存中的一个区域，里面可以缓存磁盘中经常操作的真实数据，在执行增删改查操作时，先操作缓冲池中的数据（若缓冲池没有数据，则从磁盘加载并缓存），然后再以一定频率刷新到磁盘，从而减少磁盘 I/O，加快处理速度。
缓冲池以页为单位，底层采用链表数据结构管理 page，根据状态，将 Page 分为三类：

- `free page`：空闲 page，未被使用。
- `clean page`：被使用 page，数据没有被修改过。
- `dirty page`：脏页，被使用 page，数据被修改过，页中数据与磁盘的数据产生了不一致。

在专用服务器上，通常将多大 80%的物理内存分配给缓冲池，参数设置：`show variables like 'innodb_buffer_pool_size';`

#### Change Buffer

更改缓冲区（针对非唯一二级索引），在执行 DML 语句时，如果这些数据 Page 没有在 Buffer Pool 中，不会直接操作磁盘，而会将数据变更存在更改缓冲区中，在未来数据被读取时，将数据合并恢复到 Buffer Pool 中，再将合并后的数据刷新到磁盘中。
那 Change Buffer 存在的意义是什么？
![Change Buffer（图 1）](/note-mysql/assets/1684115381993-718796c2-37e6-4f65-bd8b-fb09c8d92bb9.png)
与聚集索引不同，二级索引通常是非唯一的，并且以相对随机的顺序插入二级索引。同样，删除和更新可能会影响索引树中不相邻的二级索引页，如果每一次都操作磁盘，会造成大量的磁盘 I/O。有了 Change Buffer 之后，我们可以在缓冲池中进行合并处理，减少磁盘 I/O。

#### Adaptive Hash Index

自适应 hash 索引，用于优化 Buffer Pool 数据的查询。InnoDB 存储引擎会监控对表上各索引页的查询，如果观察到 hash 索引可以提升速度，则建立 Hash 索引，称之为自适应 hash 索引，无需人工干预，是系统根据情况自动完成的。参数：`adaptive_hash_index`

#### Log Buffer

日志缓冲区是用来保存要写入磁盘中的 log 日志数据（redo log，undo log），默认大小为 16MB，日志缓冲区的日志会定期刷新到磁盘中。如果需要更新、插入或删除许多行的事务，增加日志缓冲区的大小可以节省磁盘 I/O。
参数：`innodb_log_buffer_size` 缓冲区大小 `innodb_flush_log_at_trx_commit` 日志刷新到磁盘时机

### 6.2.2 磁盘架构

![磁盘架构（图 1）](/note-mysql/assets/1684115945734-961cd924-a1dc-4572-a9a5-c9999708ab1d.png)

#### System Tablespace

系统表空间是更改缓冲区的存储取余，如果表是在系统表空间而不是每个表文件或通用表空间创建的，它也可能包含表和索引数据

#### File-per-Table-Tablespaces

每个表的文件表空间包含单个 InnoDB 表的数据和索引，并存储在文件系统上的单个数据文件中

#### General Tablespaces

通用表空间，需要用过 `CREATE TABLESAPCE` 语法创建通用表空间， 再创建表时，可以指定该表空间

#### Undo Tablespaces

撤销表空间，MySQL 实例再初始化时会自动创建两个默认的 undo 表空间，用于存储 undo log 日志

#### Temporary Tablespaces

InnoDB 使用会话临时表空间和全局临时表空间。存储用户创建的临时表等数据。

#### Doublewrite Buffer Files

双写缓冲区，InnoDB 引擎将数据页从 Buffer Pool 刷新到磁盘前，先将数据页写入双写缓冲区文件中，便于系统异常时恢复数据。

#### Redo Log

重做日志，用来实现事务的持久性，该日志文件由两部分组成：重做日志缓冲以及重做日志文件，前者是存储在内存中，后者再此盘中。当事务提交之后会把所有修改信息都会存储到该日志中，用于在刷新脏页到磁盘时，发生错误时，进行数据恢复使用，以循环的方式写入重做日志文件。

### 6.2.3 后台线程

![后台线程（图 1）](/note-mysql/assets/1684116846359-13cb6bb2-2ee2-4d8d-be7b-b0f509a52a3f.png)

#### Master Thread

核心后台线程，负责调度其他线程，还负责将缓冲池中的数据异步刷新到磁盘中，保持数据的一致性，还包括脏页的刷新、合并插入缓存、undo 页的回收。

#### IO Thread

在 InnoDB 存储引擎中大量使用了 AIO 来处理 IO 请求，这样可以极大地提高数据库的性能，而 IO Thread 主要负责这些请求的回调：
![IO Thread（图 1）](/note-mysql/assets/1684117070396-bfba2e25-aa56-4308-9946-45c0e467abb4.png)

#### Purge Thread

主要用于回收事务已经提交了的 undo log，在事务提交之后，undo log 可能不用了，就用它来回收。

#### Page Cleaner Thread

协助 Master Thread 刷新脏页到磁盘的线程，它可以减轻 Master Thread 的工作压力，减少阻塞。

## 6.3 事务原理

### 6.3.1 事务基础

事务是一组操作的集合，它是一个不可分割的工作单位，事务会把所有的操作作为一个整体一起向系统提交或撤销操作请求，即这些操作要么同时成功，要么同时失败。
特性：

- 原子性(Atomicity)：事务是不可分割的最小单元，要么全部成功，要么全部失败。
- 一致性(Consistency)：事务完成时，必须使所有的数据都保持一致状态。
- 隔离性(Isolation)：数据库提供的隔离机制，保证事务在不受外部并发操作影响的独立环境下运行。
- 持久性(Durability)：事务一旦提交或者回滚，它对数据库中的数据的改变就是永久的。

对于原子性、一致性和持久性是通过 redo log、undo log 来保证的，而隔离性是通过锁和 MVCC 保证的。

### 6.3.2 Redo log

重做日志，用来实现事务的持久性，该日志文件由两部分组成：重做日志缓冲以及重做日志文件，前者是存储在内存中，后者再此盘中。当事务提交之后会把所有修改信息都会存储到该日志中，用于在刷新脏页到磁盘时，发生错误时，进行数据恢复使用，以循环的方式写入重做日志文件。
在 InnoDB 存储引擎的内存结构中，主要的内存区域就是缓冲池， 在缓冲池中存储了很多的数据页，当我们在一个事物中，执行多个增删改的操作时，InnoDB 引擎会先操作缓冲池中的数据，如果缓冲区没有对应的数据，会通过后台线程将磁盘中的数据加载出来，存放在缓冲区中，然后将缓冲池中的数据修改，修改后的数据页我们称为脏页。而脏页则会在一定的时机，通过后台线程刷新到磁盘中，从而保证缓冲区与磁盘的数据一致，而缓冲区的脏页数据并不是实时刷新的，而是一段时间之后将缓冲区的数据刷新到磁盘中，假如刷新到磁盘的过程中出错了，而提示给用户事务提交成功，而数据却没有持久化下来，这就出现问题了，没有保证事务的持久性。
![Redo log（图 1）](/note-mysql/assets/1684118279157-a4a5c261-febf-4bcb-9b0d-204ef4b63ebd.png)
有了 redo log 之后，当对缓冲区的数据进行增删改查之后，会首先将操作的数据页的变化，记录在 redo log buffer 中，在事务提交时，会将 redo log buffer 中的数据刷新到 redo log 磁盘文件中，过一段时间之后，如果刷新缓冲区的脏页到磁盘时，发生错误，此时就可以借助于 redo log 进行数据恢复，这样就保证了事务的持久性。而如果脏页成功刷新到磁盘或者涉及到的数据已经落盘，此时 redo log 就没有作用了，就可以删除了，所以存在的两个 redo log 文件时循环写的。
问题：为什么不在提交事务时立刻将脏页刷新会磁盘呢？
因为在业务操作中，我们操作数据一般都是随机读写磁盘的，而不是顺序读写磁盘，而 redo log 在往磁盘文件中写入数据，由于是日志文件，所以都是顺序写的。顺序写的效率，要远大于随机写，这种先写日志的方式，称之为 WAL（Write-ahead logging）。
![Redo log（图 2）](/note-mysql/assets/1684118539655-bd383304-dd5b-4028-a900-eab0893354b9.png)

### 6.3.3 Undo log

回滚日志，用于记录数据被修改前的信息，作用包含两个：提供回滚和 MVCC（多版本并发控制）。
Undo log 和 Redo log 记录物理日志不一样，它是逻辑日志。可以认为当 `delete` 一条记录时，undo log 中会记录一条对应的 `insert` 记录，反之亦然，当 uodate 一条记录时，它记录一条对应相反的 `update` 记录。当执行 rollback 时，就可以从 undo log 中的逻辑记录读取到相应的内容并进行回滚。
Undo log 销毁：undo log 在事务执行时产生，事务提交时，并不会立即删除 undo log，因为这些日志可能还用于 MVCC。
Undo log 存储：undo log 采用段的方式进行管理和记录，存放在前面介绍的 rollback segment 回滚段中，内部包干 1024 个 undo log segment。

## 6.4 MVCC

### 6.4.1 基本概念

当前读：读取的是记录的最新版本，读取时还要保证其他事务不能修改当前记录，会对读取的记录进行加锁，对于日常的操作，如：`select .... lock in share mode`、`select .... for update\inert\delete` 都是一种当前读。
快照读：简单的 `select`（不加锁）就是快照读，快照读，读取的是记录数据的可见版本，有可能是历史数据，你不加锁，是非阻塞读：

- Read Committed：每次 `select`，都生成一个快照读。
- Repeatable Read：开启事务后第一个 `select` 语句才是快照读的地方。
- Serializable：快照读会退化为当前读。

MVCC：全称 Multi-Version Concurrency Control，多版本并发控制。指维护一个数据的多个版本，使得读写操作没有冲突，快照读为 MySQL 实现 MVCC 提供了一个非阻塞读功能。MVCC 的具体实现，还需要依赖于数据库中的三个隐式字段、undo log 日志，readView。

### 6.4.2 隐藏字段

![隐藏字段（图 1）](/note-mysql/assets/1684119419106-ff6ab3f6-40a7-4051-aacf-98a9685c3e34.png)

### 6.4.3 Undo log

回滚日志，在 `insert`、`update`、`delete` 的时候产生的便于数据回滚的日志。
当 `insert` 产生的时候，产生的 undo log 日志只在回滚时需要，在事务提交后，可被立即删除。
而 `update`、`delete` 的时候，产生的 undo log 日志不仅在回滚时需要，在快照读时也需要，不会立即被删除。
![Undo log（图 1）](/note-mysql/assets/1684120016131-8294001e-aa7e-4397-a8a1-f2fbf5d0ba72.png)

### 6.4.4 ReadView

ReadView（读视图）是快照读 SQL 执行时 MVCC 提取数据的依据，记录并维护系统当前活跃的事务（未提交的）`id`，包含了四个核心字段：
![ReadView（图 1）](/note-mysql/assets/1684120169127-bc856375-497c-41d9-99c7-580fa951689a.png)
版本链访问规则：
![ReadView（图 2）](/note-mysql/assets/1684120329897-be8c7b3f-d708-4f2f-960e-73abe269f224.png)
不同的隔离级别，生成 ReadView 的时机不同：

- READ COMMITTED：在事务中每执行一次快照读时生成 ReadView。
- REPEATABLE READ：仅在事务中第一次执行快照读时生成 ReadView，后续复用该 ReadView。
