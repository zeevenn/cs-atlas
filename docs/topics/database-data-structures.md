---
title: "数据库中的数据结构"
description: 从记录、数据页到 B+ 树、哈希表与缓存链表，按顺序选读数据库底层数据结构。
---

数据库如何把一条记录存下来，又如何在大量数据中快速找到它？这个专题把两套 MySQL 资料中的相关章节组织在一起，沿着“存储 → 查找 → 索引使用 → 缓存”的顺序阅读。

**所需基础**：会写基本的 SQL，了解数组、链表和树的概念。无需先读完原书；遇到术语时，可以回到[教材目录](/library/)补读。

**学习目标**：能画出从记录到数据页、再到 B+ 树的组织关系，并解释哈希表和链表在数据库中的具体用途。

当前内容以 MySQL / InnoDB 为主，尚未覆盖跳表、LSM 树及其他存储引擎的数据结构。《MySQL 是怎样运行的》以 MySQL 5.7 为主要背景，涉及配置和实现细节时，请结合所用版本核对。

## 1. 建立索引模型的直觉

读[《MySQL 实战 45 讲》04：深入浅出索引（上）](/geektime-mysql-shizhan-45/01-foundations/04-shen-ru-qian-chu-suo-yin-shang.md)。先对比哈希表、有序数组和搜索树，再理解 InnoDB 为什么采用 B+ 树。

**读后自查**：等值查询与范围查询，对数据结构的要求有什么不同？为什么只看时间复杂度，还不足以解释数据库索引的选择？

## 2. 理解记录如何组成数据页

依次阅读《MySQL 是怎样运行的》：

- [第 4 章：InnoDB 记录结构](/mysql-how-it-works/02-storage-and-indexes/04-从一条记录说起-InnoDB记录结构.md)，了解字段与记录头如何组织。
- [第 5 章：InnoDB 数据页结构](/mysql-how-it-works/02-storage-and-indexes/05-盛放记录的大盒子-InnoDB数据页结构.md)，关注记录链表、页目录与页之间的联系。

**读后自查**：页内记录与页目录分别如何参与查找？为什么记录有序，还需要页目录？

## 3. 从数据页走到 B+ 树

读[《MySQL 是怎样运行的》第 6 章：B+ 树索引](/mysql-how-it-works/02-storage-and-indexes/06-快速查询的秘籍-B+树索引.md)，沿着从简单索引方案到多层目录的推导，理解聚簇索引与二级索引。

**读后自查**：两种索引的叶子节点分别存什么？通过二级索引查找完整记录，为什么可能需要再查一次聚簇索引？

## 4. 把索引结构与 SQL 对应起来

依次阅读：

- [《MySQL 是怎样运行的》第 7 章：B+ 树索引的使用](/mysql-how-it-works/02-storage-and-indexes/07-好东西也得先学会怎么用-B+树索引的使用.md)，理解联合索引、范围查找、排序与覆盖索引。
- [《MySQL 实战 45 讲》05：深入浅出索引（下）](/geektime-mysql-shizhan-45/01-foundations/05-shen-ru-qian-chu-suo-yin-xia.md)，通过案例理解回表、最左前缀与索引下推。

**读后自查**：给定联合索引 `(a, b, c)`，能否画出数据的排序方式，并解释不同查询条件如何利用它？

## 5. 观察哈希表与链表的实际用途

依次阅读：

- [《MySQL 是怎样运行的》第 18 章：InnoDB 的 Buffer Pool](</mysql-how-it-works/04-transactions-and-logs/18-调节磁盘和CPU的矛盾-InnoDB的Buffer Pool.md>)，关注缓存页的哈希查找，以及 free、flush、LRU 链表各自的职责。
- [《MySQL 实战 45 讲》38：都说 InnoDB 好，那还要不要使用 Memory 引擎？](/geektime-mysql-shizhan-45/04-advanced-practice/38-du-shuo-innodb-hao-na-huan-yao-bu-yao-shi-yong-memory-yin-qing.md)，对比不同引擎的数据组织方式和索引选择。

**读后自查**：定位一个缓存页、选择一个淘汰页，为什么适合使用不同的数据结构？哈希索引适合哪些查询，又有哪些限制？

## 串起来检验理解

画一张“一次查询如何找到记录”的图，分别标出二级索引、聚簇索引、数据页与 Buffer Pool。再尝试说明一次插入可能影响哪些结构。

如果还说不清某一步，回到对应章节补读。想继续学习完整的查询优化、事务与日志，可以回到[教材与专栏](/library/)按原目录阅读。
