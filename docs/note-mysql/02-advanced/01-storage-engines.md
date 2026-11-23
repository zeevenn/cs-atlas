---
title: "1. 存储引擎"
---

## 1.1 MySQL 体系结构

![MySQL 体系结构（图 1）](/note-mysql/assets/1683535413569-762b9373-876c-43bf-8f2e-17773381c252.png)

- **连接层**：最上层是一些客户端和连接服务，主要完成一些类似于连接处理、授权认证及相关的安全服务。服务器也会为安全接入的每个客户端验证它所具有的操作权限。
- **服务层**：第二层架构主要完成大多数的核心服务功能，如 SQL 接口、并完成缓存的查询，SQL 的分析和优化，部分内置函数的执行。所有跨存储引擎的功能也在这一层实现，如过程、函数等。
- **引擎层**：存储引擎真正的负责了 MySQL 中数据的存储和提取，服务器通过 API 和存储引擎进行通信。不同的存储引擎具有不同的功能，这样我们可以根据自己的需要没来选取适合的存储引擎。
- **存储层**：主要是将数据存储在文件系统之上，并完成与存储引擎的交互。

## 1.2 存储引擎简介

存储引擎就是存储数据、建立索引、更新/查询数据等技术的实现方式。存储引擎是 **基于表** 的，而不是基于库的，所以存储引擎也可被称为表类型。
![存储引擎简介（图 1）](/note-mysql/assets/1683535877857-2f3faa97-74a5-4dc5-979a-d97f1bd1ae5e.png)

## 1.3 存储引擎特点

### 1.3.1 InnoDB

- 介绍：InnoDB 是一种兼顾高可靠性和高性能的通用存储引擎，在 MySQL 5.5 之后，InnoDB 是默认的 MySQL 存储引擎。
- 特点：
    - DML 操作遵循 ACID 模型，支持事务；
    - 行级锁，提高并发访问性能；
    - 支持外键 FOREIGN KEY 约束，保证数据的完整性和可靠性。

- 文件：`xxx.ibd`：XXX 代表的是表名，InnoDB 引擎的每张表都会对应着这样一个表空间文件，存储该表的表结构（frm、sdi）、数据和索引。参数：`innodb_file_per_table`。
- ![InnoDB（图 1）](/note-mysql/assets/1683536413473-fa87f88b-5b43-4a26-877a-f521e806df9c.png)

### 1.3.2 MyISAM

- 介绍：MyISAM 是 MySQL 早期的默认存储引擎
- 特点：
    - 不支持事务，不支持外键
    - 支持表锁，不支持行锁
    - 访问速度快
- 文件：
    - `XXX.MYD` 存储表结构信息
    - `XXX.MYI` 存储数据
    - `XXX.sdi` 存储索引

### 1.3.3 Memory

- 介绍：Memoey 引擎的表数据是存储在内存中的，但由于受到硬件问题、断电问题的影响，只能将这些表作为临时表或缓存使用。
- 特点：
    - 内存存储速度快
    - hash 索引（默认）
- 文件：`XXX.sdi` 存储表结构信息

![Memory（图 1）](/note-mysql/assets/1683536750860-9e1e126d-5a26-4ce8-a7de-27802b01abe2.png)

## 1.4 存储引擎选择

在选择存储引擎时，应根据应用系统的特点选择合适的存储引擎。对于复杂的应用系统，还可以根据实际情况选择多种存储引擎进行组合。

- InnoDB：是 MySQL 默认的存储引擎，支持事务、外键和行锁。如果应用对事务的完整性有较高的要求，在并发条件下要求数据的一致性，数据操作除了插入和查询之外，还包含很多的更新、删除操作，那么 InnoDB 存储引擎是比较合适的选择。
- MyISAM：如果应用是以读操作和插入操作为主，只有很少的更新和删除操作，并且对事务的完整性、并发性要求不是很高，那么选择这个存储引擎是非常合适的。
- Memory：将所有数据保存在内存中，访问速度快，通常用于临时表及缓存，Memory 的缺陷就是对表的大小有限制，太大的表无法缓存在内存中，而且无法保证数据的安全性。

## 1.5 MySQL 安装（Linux）

1. 下载网址：[https://www.mysql.com/](https://www.mysql.com/)
   ![MySQL 安装（Linux）（图 1）](/note-mysql/assets/1683537579804-ad80e0f5-f02a-426e-9954-56bf1f4856cf.png)
2. 创建目录并解压：`tar -xvf mysql-8.0.33-1.el7.x86_64.rpm-bundle.tar -C /mysql/`
   ![MySQL 安装（Linux）（图 2）](/note-mysql/assets/1683538077872-9e304a27-84d0-4787-8efb-2bc2687dadf8.png)
3. 安装：这里需要注意安装是由顺序的：
   1. `rpm -ivh mysql-community-common-8.0.33-1.el7.x86_64.rpm`
   2. `rpm -ivh mysql-community-client-plugins-8.0.33-1.el7.x86_64.rpm`
   3. `rpm -ivh mysql-community-libs-8.0.33-1.el7.x86_64.rpm --force --nodeps`
   4. `rpm -ivh mysql-community-libs-compat-8.0.33-1.el7.x86_64.rpm --force --nodeps`
   5. `rpm -ivh mysql-community-devel-8.0.33-1.el7.x86_64.rpm --force --nodeps`
   6. `rpm -ivh mysql-community-client-8.0.33-1.el7.x86_64.rpm --force --nodeps`
   7. `rpm -ivh mysql-community-server-8.0.33-1.el7.x86_64.rpm --force --nodeps`
4. 启动 mysql：`systemctl start mysqlId`
   1. 第一次进入需要输入密码，查看默认密码：`grep 'temporary password' /var/log/mysqld.log`
5. 修改密码：原有密码太复杂修改密码，密码校验规则严格，先修改规则在修改密码
   1. `set global validate_password.policy = 0;`、`set global validate_password.length = 6;`
   2. `ALTER USER 'root'@'localhost' IDENTIFIED BY '980918';`
6. 修改 MySQL 用户访问权限，方便再 Windos 中访问数据库
   1. `create user 'root'@'%' IDENTIFIED WITH mysql_native_password BY '980918';`
   2. 分配权限；`grant all on *.* to 'root'@'%' ;`

最后给出两份完整的文档（Linux 下 MySQL 8 安装和卸载）：
[MySQL-Linux 安装.pdf](https://www.yuque.com/attachments/yuque/0/2023/pdf/35653686/1683609230846-0e008928-9b5c-4886-b5e6-17e11ad0565e.pdf)
[MySQL 卸载-Linux.pdf](https://www.yuque.com/attachments/yuque/0/2023/pdf/35653686/1683609238395-fa72e7ac-ed45-4de6-8b69-63ed983d2ccc.pdf)
