---
title: "MySQL 实战 45 讲"
description: 林晓斌  网名丁奇，前腾讯云数据库负责人
---

## 课程介绍

MySQL 使用和面试中遇到的问题，很多人会通过搜索别人的经验来解决 ，零散不成体系。实际上只要理解了 MySQL 的底层工作原理，就能很快地直戳问题的本质。

本专栏一共 **45** 讲，**全集**更新完毕，通过探讨 MySQL 实战中最常见的 **36 个** 痛点问题，串起各个零散的知识点，配合 **100+** 手绘详解图，由线到面带你构建 MySQL 系统的学习路径。

在专栏中，丁奇结合自己十多年来，通过 MySQL 源码找答案的经历，梳理了 **MySQL 的主线知识**，比如**事务、索引、锁**等；并基于这条主线，带你缕清**概念、机制、原理、案例分析**以及本质，让你真正能掌握 **MySQL 核心技术与底层原理。**

值得一提的是，每篇文章中都附有**实践案例**，给你从理论到实战的系统性指导，让你少走弯路，彻底搞懂 MySQL。

本课程共包括两大模块。

**模块一，基础篇**。为你深入浅出地讲述 MySQL 核心知识，涵盖 MySQL 基础架构、日志系统、事务隔离、锁等内容。

**模块二，实践篇**。将从一个个关键的数据库问题出发，分析数据库原理，并给出实践指导。每个问题，都不只是简单地给出答案，而是从为什么要这么想、到底该怎样做出发，让你能够知其所以然，都将能够解决你平时工作中的一个疑惑点。

## 课程目录

![MySQL 实战 45 讲（配图）](<./images/image-42.png>)

> 本文档仅供学习使用，如您有条件，可支持作者：[课程链接](https://time.geekbang.org/column/intro/100020801)

![MySQL 实战 45 讲（配图）](<./images/image-4.png>)

## 阅读目录

### 基础架构、索引与事务

- [01 基础架构：一条SQL查询语句是如何执行的？](<01-foundations/01-ji-chu-jia-gou-yi-tiao-sql-cha-xun-yu-ju-shi-ru-he-zhi-hang-de.md>)
- [02 日志系统：一条SQL更新语句是如何执行的？](<01-foundations/02-ri-zhi-xi-tong-yi-tiao-sql-geng-xin-yu-ju-shi-ru-he-zhi-hang-de.md>)
- [03 事务隔离：为什么你改了我还看不见？](<01-foundations/03-shi-wu-ge-li-wei-shi-mo-ni-gai-le-wo-huan-kan-bu-jian.md>)
- [04 深入浅出索引（上）](<01-foundations/04-shen-ru-qian-chu-suo-yin-shang.md>)
- [05 深入浅出索引（下）](<01-foundations/05-shen-ru-qian-chu-suo-yin-xia.md>)
- [06 全局锁和表锁 ：给表加个字段怎么有这么多阻碍？](<01-foundations/06-quan-ju-suo-he-biao-suo-gei-biao-jia-ge-zi-duan-zen-mo-you-zhe-mo-duo-zu-ai.md>)
- [07 行锁功过：怎么减少行锁对性能的影响？](<01-foundations/07-hang-suo-gong-guo-zen-mo-jian-shao-hang-suo-dui-xing-neng-de-ying-xiang.md>)
- [08 事务到底是隔离的还是不隔离的？](<01-foundations/08-shi-wu-dao-di-shi-ge-li-de-huan-shi-bu-ge-li-de.md>)

### 索引优化、查询与锁

- [09 普通索引和唯一索引，应该怎么选择？](<02-query-and-locks/09-pu-tong-suo-yin-he-wei-yi-suo-yin-ying-gai-zen-mo-xuan-ze.md>)
- [10 MySQL为什么有时候会选错索引？](<02-query-and-locks/10-mysql-wei-shi-mo-you-shi-hou-hui-xuan-cuo-suo-yin.md>)
- [11 怎么给字符串字段加索引？](<02-query-and-locks/11-zen-mo-gei-zi-fu-chuan-zi-duan-jia-suo-yin.md>)
- [12 为什么我的MySQL会“抖”一下？](<02-query-and-locks/12-wei-shi-mo-wo-de-mysql-hui-dou-yi-xia.md>)
- [13 为什么表数据删掉一半，表文件大小不变？](<02-query-and-locks/13-wei-shi-mo-biao-shu-ju-shan-diao-yi-ban-biao-wen-jian-da-xiao-bu-bian.md>)
- [14 count(\*)这么慢，我该怎么办？](<02-query-and-locks/14-count-zhe-mo-man-wo-gai-zen-mo-ban.md>)
- [15 答疑文章（一）：日志和索引相关问题](<02-query-and-locks/15-da-yi-wen-zhang-yi-ri-zhi-he-suo-yin-xiang-guan-wen-ti.md>)
- [16 “order by”是怎么工作的？](<02-query-and-locks/16-order-by-shi-zen-mo-gong-zuo-de.md>)
- [17 如何正确地显示随机消息？](<02-query-and-locks/17-ru-he-zheng-que-di-xian-shi-sui-ji-xiao-xi.md>)
- [18 为什么这些SQL语句逻辑相同，性能却差异巨大？](<02-query-and-locks/18-wei-shi-mo-zhe-xie-sql-yu-ju-luo-ji-xiang-tong-xing-neng-que-cha-yi-ju-da.md>)
- [19 为什么我只查一行的语句，也执行这么慢？](<02-query-and-locks/19-wei-shi-mo-wo-zhi-cha-yi-hang-de-yu-ju-ye-zhi-hang-zhe-mo-man.md>)
- [20 幻读是什么，幻读有什么问题？](<02-query-and-locks/20-huan-du-shi-shi-mo-huan-du-you-shi-mo-wen-ti.md>)
- [21 为什么我只改一行的语句，锁这么多？](<02-query-and-locks/21-wei-shi-mo-wo-zhi-gai-yi-hang-de-yu-ju-suo-zhe-mo-duo.md>)
- [22 MySQL有哪些“饮鸩止渴”提高性能的方法？](<02-query-and-locks/22-mysql-you-na-xie-yin-zhen-zhi-ke-ti-gao-xing-neng-de-fang-fa.md>)

### 日志、主备与运维

- [23 MySQL是怎么保证数据不丢的？](<03-replication-and-operations/23-mysql-shi-zen-mo-bao-zheng-shu-ju-bu-diu-de.md>)
- [24 MySQL是怎么保证主备一致的？](<03-replication-and-operations/24-mysql-shi-zen-mo-bao-zheng-zhu-bei-yi-zhi-de.md>)
- [25 MySQL是怎么保证高可用的？](<03-replication-and-operations/25-mysql-shi-zen-mo-bao-zheng-gao-ke-yong-de.md>)
- [26 备库为什么会延迟好几个小时？](<03-replication-and-operations/26-bei-ku-wei-shi-mo-hui-yan-chi-hao-ji-ge-xiao-shi.md>)
- [27 主库出问题了，从库怎么办？](<03-replication-and-operations/27-zhu-ku-chu-wen-ti-le-cong-ku-zen-mo-ban.md>)
- [28 读写分离有哪些坑？](<03-replication-and-operations/28-du-xie-fen-li-you-na-xie-keng.md>)
- [29 如何判断一个数据库是不是出问题了？](<03-replication-and-operations/29-ru-he-pan-duan-yi-ge-shu-ju-ku-shi-bu-shi-chu-wen-ti-le.md>)
- [30 答疑文章（二）：用动态的观点看加锁](<03-replication-and-operations/30-da-yi-wen-zhang-er-yong-dong-tai-de-guan-dian-kan-jia-suo.md>)
- [31 误删数据后除了跑路，还能怎么办？](<03-replication-and-operations/31-wu-shan-shu-ju-hou-chu-le-pao-lu-huan-neng-zen-mo-ban.md>)
- [32 为什么还有kill不掉的语句？](<03-replication-and-operations/32-wei-shi-mo-huan-you-kill-bu-diao-de-yu-ju.md>)
- [33 我查这么多数据，会不会把数据库内存打爆？](<03-replication-and-operations/33-wo-cha-zhe-mo-duo-shu-ju-hui-bu-hui-ba-shu-ju-ku-nei-cun-da-bao.md>)

### 查询实践、引擎与自增 ID

- [34 到底可不可以使用join？](<04-advanced-practice/34-dao-di-ke-bu-ke-yi-shi-yong-join.md>)
- [35 join语句怎么优化？](<04-advanced-practice/35-join-yu-ju-zen-mo-you-hua.md>)
- [36 为什么临时表可以重名？](<04-advanced-practice/36-wei-shi-mo-lin-shi-biao-ke-yi-zhong-ming.md>)
- [37 什么时候会使用内部临时表？](<04-advanced-practice/37-shi-mo-shi-hou-hui-shi-yong-nei-bu-lin-shi-biao.md>)
- [38 都说InnoDB好，那还要不要使用Memory引擎？](<04-advanced-practice/38-du-shuo-innodb-hao-na-huan-yao-bu-yao-shi-yong-memory-yin-qing.md>)
- [39 自增主键为什么不是连续的？](<04-advanced-practice/39-zi-zeng-zhu-jian-wei-shi-mo-bu-shi-lian-xu-de.md>)
- [40 insert语句的锁为什么这么多？](<04-advanced-practice/40-insert-yu-ju-de-suo-wei-shi-mo-zhe-mo-duo.md>)
- [41 怎么最快地复制一张表？](<04-advanced-practice/41-zen-mo-zui-kuai-di-fu-zhi-yi-zhang-biao.md>)
- [42 grant之后要跟着flush privileges吗？](<04-advanced-practice/42-grant-zhi-hou-yao-gen-zhuo-flush-privileges-ma.md>)
- [43 要不要使用分区表？](<04-advanced-practice/43-yao-bu-yao-shi-yong-fen-qu-biao.md>)
- [44 答疑文章（三）：说一说这些好问题](<04-advanced-practice/44-da-yi-wen-zhang-san-shuo-yi-shuo-zhe-xie-hao-wen-ti.md>)
- [45 自增id用完怎么办？](<04-advanced-practice/45-zi-zeng-id-yong-wan-zen-mo-ban.md>)

### 补充阅读

- [点线网面，一起构建MySQL知识网络](<05-supplement/dian-xian-wang-mian-yi-qi-gou-jian-mysql-zhi-shi-wang-luo.md>)
- [林晓斌：我的 MySQL 心路历程](<05-supplement/lin-xiao-bin-wo-de-mysql-xin-lu-li-cheng.md>)
