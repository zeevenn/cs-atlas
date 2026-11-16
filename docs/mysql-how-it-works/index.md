---
title: "MySQL 是怎样运行的"
---

从一条记录如何存储开始，逐步理解数据页、B+ 树、查询优化，以及事务与锁。这里整理了《MySQL 是怎样运行的》的第 0–26 章，建议按顺序阅读。

[从第 0 章开始](/mysql-how-it-works/01-basics/00-万里长征第一步（非常重要）-如何愉快的阅读本小册.md)

> [!NOTE]
> **阅读版本**
>
> 原文以 MySQL 5.7 为主要背景。MySQL 8.0 / 8.4 的配置、数据字典、日志及优化器行为可能不同。

## 阅读目录

### 开始阅读

- [第 0 章 万里长征第一步（非常重要）-如何愉快的阅读本小册](<01-basics/00-万里长征第一步（非常重要）-如何愉快的阅读本小册.md>)
- [第 1 章 装作自己是个小白-重新认识 MySQL](<01-basics/01-装作自己是个小白-重新认识MySQL.md>)
- [第 2 章 MySQL 的调控按钮-启动选项和系统变量](<01-basics/02-MySQL的调控按钮-启动选项和系统变量.md>)
- [第 3 章 乱码的前世今生-字符集和比较规则](<01-basics/03-乱码的前世今生-字符集和比较规则.md>)

### 记录、数据页与索引

- [第 4 章 从一条记录说起-InnoDB 记录结构](<02-storage-and-indexes/04-从一条记录说起-InnoDB记录结构.md>)
- [第 5 章 盛放记录的大盒子-InnoDB 数据页结构](<02-storage-and-indexes/05-盛放记录的大盒子-InnoDB数据页结构.md>)
- [第 6 章 快速查询的秘籍-B+ 树索引](<02-storage-and-indexes/06-快速查询的秘籍-B+树索引.md>)
- [第 7 章 好东西也得先学会怎么用-B+ 树索引的使用](<02-storage-and-indexes/07-好东西也得先学会怎么用-B+树索引的使用.md>)
- [第 8 章 数据的家-MySQL 的数据目录](<02-storage-and-indexes/08-数据的家-MySQL的数据目录.md>)
- [第 9 章 存放页的大池子-InnoDB 的表空间](<02-storage-and-indexes/09-存放页的大池子-InnoDB的表空间.md>)

### 查询与优化

- [第 10 章 条条大路通罗马-单表访问方法](<03-query-optimization/10-条条大路通罗马-单表访问方法.md>)
- [第 11 章 两个表的亲密接触-连接的原理](<03-query-optimization/11-两个表的亲密接触-连接的原理.md>)
- [第 12 章 谁最便宜就选谁-MySQL 基于成本的优化](<03-query-optimization/12-谁最便宜就选谁-MySQL基于成本的优化.md>)
- [第 13 章 兵马未动，粮草先行-InnoDB 统计数据是如何收集的](<03-query-optimization/13-兵马未动，粮草先行-InnoDB统计数据是如何收集的.md>)
- [第 14 章 不好看就要多整容-MySQL 基于规则的优化（内含关于子查询优化二三事儿）](<03-query-optimization/14-不好看就要多整容-MySQL基于规则的优化（内含关于子查询优化二三事儿）.md>)
- [第 15 章 查询优化的百科全书-Explain 详解（上）](<03-query-optimization/15-查询优化的百科全书-Explain详解（上）.md>)
- [第 16 章 查询优化的百科全书-Explain 详解（下）](<03-query-optimization/16-查询优化的百科全书-Explain详解（下）.md>)
- [第 17 章 神兵利器-optimizer trace 表的神器功效](<03-query-optimization/17-神兵利器-optimizer trace的神器功效.md>)

### 缓存、事务与日志

- [第 18 章 调节磁盘和 CPU 的矛盾-InnoDB 的 Buffer Pool](<04-transactions-and-logs/18-调节磁盘和CPU的矛盾-InnoDB的Buffer Pool.md>)
- [第 19 章 从猫爷被杀说起-事务简介](<04-transactions-and-logs/19-从猫爷被杀说起-事务简介.md>)
- [第 20 章 说过的话就一定要办到-redo 日志（上）](<04-transactions-and-logs/20-说过的话就一定要办到-redo日志（上）.md>)
- [第 21 章 说过的话就一定要办到-redo 日志（下）](<04-transactions-and-logs/21-说过的话就一定要办到-redo日志（下）.md>)
- [第 22 章 后悔了怎么办-undo 日志（上）](<04-transactions-and-logs/22-后悔了怎么办-undo日志（上）.md>)
- [第 23 章 后悔了怎么办-undo 日志（下）](<04-transactions-and-logs/23-后悔了怎么办-undo日志（下）.md>)

### 并发控制与参考资料

- [第 24 章 一条记录的多幅面孔-事务的隔离级别与 MVCC](<05-concurrency-and-references/24-一条记录的多幅面孔-事务的隔离级别与MVCC.md>)
- [第 25 章 工作面试老大难-锁](<05-concurrency-and-references/25-工作面试老大难-锁.md>)
- [第 26 章 写作本书时用到的一些重要的参考资料](<05-concurrency-and-references/26-写作本书时用到的一些重要的参考资料.md>)
