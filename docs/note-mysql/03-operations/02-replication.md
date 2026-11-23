---
title: "2. 主从复制"
---

## 2.1 概述

主从复制是指将主数据库的 DDL 和 DML 操作通过二进制日志传到从库服务器中，然后在从库上对这 些日志重新执行（也叫重做），从而使得从库和主库的数据保持同步。
MySQL 支持一台主库同时向多台从库进行复制，从库同时也可以作为其他从服务器的主库，实现链状复制。
![概述（图 1）](/note-mysql/assets/1684128112951-0cd4b40b-a815-437d-9bd6-c18096fbd133.png)
MySQL 复制的优点主要包含以下三个方面：

- 主库出现问题，可以快速切换到从库提供服务。
- 实现读写分离，降低主库的访问压力。
- 可以在从库中执行备份，以避免备份期间影响主库服务。

## 2.2 原理

MySQL 主从复制的核心就是二进制日志，具体的过程如下：
![原理（图 1）](/note-mysql/assets/1684128165471-d3a65879-da12-489e-bd0f-c8496e40ef7b.png)
从上图来看，复制分成三步：

1. Master 主库在事务提交时，会把数据变更记录在二进制日志文件 Binlog 中。
2. 从库读取主库的二进制日志文件 Binlog ，写入到从库的中继日志 Relay Log
3. slave 重做中继日志中的事件，将改变反映它自己的数据。

## 2.3 搭建

### 准备

![准备（图 1）](/note-mysql/assets/1684130779942-736e38ee-e197-4b09-8d67-ff84e1d104ba.png)

### 主库准备

1. 修改配置文件 `/etc/my.cnf`

```ini
#mysql 服务ID，保证整个集群环境中唯一，取值范围：1 – 232-1，默认为1

server-id=1

#是否只读,1 代表只读, 0 代表读写

read-only=0

#忽略的数据, 指不需要同步的数据库

#binlog-ignore-db=mysql
#指定同步的数据库

#binlog-do-db=db01
```

1. 重启 MySQL 服务器 `systemctl restart mysqld`
2. 登录 mysql，创建远程连接的账号，并授予主从复制权限

```sql
#创建itcast用户，并设置密码，该用户可在任意主机连接该MySQL服务

CREATE USER 'itcast'@'%' IDENTIFIED WITH mysql_native_password BY 'Root@123456'
;
#为 'itcast'@'%' 用户分配主从复制权限

GRANT REPLICATION SLAVE ON *.* TO 'itcast'@'%';
```

1. 通过指令，查看二进制日志坐标 `show master status ;`
   1. ![主库准备（图 1）](/note-mysql/assets/1684130963675-1da0aca0-b2cd-4fd1-8a1f-42fb70c0c2c0.png)
   2. 字段含义说明： file : 从哪个日志文件开始推送日志文件 position ：从哪个位置开始推送日志 ， `binlog_ignore_db` : 指定不需要同步的数据库

### 从库配置

1. 修改配置文件 `/etc/my.cnf`

```ini
#mysql 服务ID，保证整个集群环境中唯一，取值范围：1 – 2^32-1，和主库不一样即可

server-id=2

#是否只读,1 代表只读, 0 代表读写

read-only=1
```

1. 重启 MySQL 服务
2. 登录 MySQL，设置主库配置

```sql
CHANGE REPLICATION SOURCE TO SOURCE_HOST='192.168.200.200', SOURCE_USER='itcast',
SOURCE_PASSWORD='Root@123456', SOURCE_LOG_FILE='binlog.000010',
SOURCE_LOG_POS=984;
```

![从库配置（图 1）](/note-mysql/assets/1684131033564-1b738c26-1b1e-468c-a02b-d1d3ef1b5ea7.png)

1. 开启同步操作 `start replica ;`
2. 查看主从同步状态 `show replica status ;`
   1. 这里需要注意，主从库的 `server-uuid` 不能一样，具有唯一性 `vim /var/lib/mysql/auto.cnf`
   2. ![从库配置（图 2）](/note-mysql/assets/1684131070718-6c5f441b-8426-4adc-b923-ca99634fe63e.png)

### 测试

在主库做操作：

```sql
create database db01;
use db01;

create table tb_user(
 id int(11) primary key not null auto_increment,
 name varchar(50) not null,
 sex varchar(1)
)engine=innodb default charset=utf8mb4;

insert into tb_user(id,name,sex) values(null,'Tom', '1'),(null,'Trigger','0'),
(null,'Dawn','1');
```

在从库查验数据，验证主从是否同步
