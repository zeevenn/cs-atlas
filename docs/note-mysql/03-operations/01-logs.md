---
title: "1. 日志"
---

## 1.1 错误日志

错误日志是 MySQL 中最重要的日志之一，它记录了当 mysqld 启动和停止时，以及服务器在运行过程中发生任何严重错误时的相关信息。当数据库出现任何故障导致无法正常使用时，建议首先查看此日志。 该日志是默认开启的，默认存放目录 `/var/log/`，默认的日志文件名为 mysqld.log 。查看日志 置：

```sql
show variables like '%log_error%';
```

![错误日志（图 1）](/note-mysql/assets/1684127028346-598bae76-afe0-4b53-ab77-d94744b42295.png)

## 1.2 二进制日志

二进制日志（BINLOG）记录了所有的 DDL（数据定义语言）语句和 DML（数据操纵语言）语句，但不包括数据查询（`SELECT`、`SHOW`）语句。
作用：
①. 灾难时的数据恢复；
②. MySQL 的主从复制。在 MySQL 8 版本中，默认二进制日志是开启着的，涉及到的参数如下：

```sql
show variables like '%log_bin%';
```

![二进制日志（图 1）](/note-mysql/assets/1684127103697-5e0d7d7e-33ed-404e-91b7-ab91ea2451df.png)
参数说明：

- `log_bin_basename`：当前数据库服务器的 binlog 日志的基础名称(前缀)，具体的 binlog 文件名需要再该 basename 的基础上加上编号(编号从 000001 开始)。
- `log_bin_index`：binlog 的索引文件，里面记录了当前服务器关联的 binlog 文件有哪些。

![二进制日志（图 2）](/note-mysql/assets/1684127210313-747d60c1-b5b2-481e-9a0a-2f1f8b54787c.png)

```sql
show variables like'%binlog_format%';
```

![二进制日志（图 3）](/note-mysql/assets/1684127249740-2b9cd808-4fb5-48b0-ac5e-ff13bfbe896e.png)
由于日志是以二进制方式存储的，不能直接读取，需要通过二进制日志查询工具 mysqlbinlog 来 看，具体语法：

```text
mysqlbinlog [ 参数选项 ] logfilename

参数选项：

 -d 指定数据库名称，只列出指定的数据库相关操作。

 -o 忽略掉日志中的前n行命令。

 -v 将行事件(数据变更)重构为SQL语句

 -vv 将行事件(数据变更)重构为SQL语句，并输出注释信息
```

对于比较繁忙的业务系统，每天生成的 binlog 数据巨大，如果长时间不清除，将会占用大量磁盘空间。可以通过以下几种方式清理日志：
![二进制日志（图 4）](/note-mysql/assets/1684127556074-51342b98-89da-4576-a7d0-fcee4ce32b9a.png)
也可以在 mysql 的配置文件中配置二进制日志的过期时间，设置了之后，二进制日志过期会自动删除。（默认 30 天）

```sql
show variables like'%binlog_expire_logs_seconds%';
```

## 1.3 查询日志

查询日志中记录了客户端的所有操作语句，而二进制日志不包含查询数据的 SQL 语句。默认情况下，查询日志是未开启的。
![查询日志（图 1）](/note-mysql/assets/1684127618677-955313b9-780d-494c-8302-1bc0dd402e0b.png)
如果需要开启查询日志，可以修改 MySQL 的配置文件 `/etc/my.cnf` 文件，添加如下内容：

```ini
#该选项用来开启查询日志 ， 可选值 ： 0 或者 1 ； 0 代表关闭， 1 代表开启

general_log=1

#设置日志的文件名 ， 如果没有指定， 默认的文件名为 host_name.log

general_log_file=mysql_query.log
```

开启了查询日志之后，在 MySQL 的数据存放目录，也就是 `/var/lib/mysql/` 目录下就会出现 `mysql_query`.log 文件。之后所有的客户端的增删改查操作都会记录在该日志文件之中，长时间运 行后，该日志文件将会非常大。

## 1.4 慢查询日志

慢查询日志记录了所有执行时间超过参数 `long_query_time` 设置值并且扫描记录数不小于 `min_examined_row_limit` 的所有的 SQL 语句的日志，默认未开启。`long_query_time` 默认为 10 秒，最小为 0，精度可以到微秒。如果需要开启慢查询日志，需要在 MySQL 的配置文件 `/etc/my.cnf` 中配置如下参数：

```ini
#慢查询日志

slow_query_log=1

#执行时间参数

long_query_time=2
```

默认情况下，不会记录管理语句，也不会记录不使用索引进行查找的查询。可以使用 `log_slow_admin_statements` 和更改此行为 `log_queries_not_using_indexes`，如下所述。

```ini
#记录执行较慢的管理语句

log_slow_admin_statements =1

#记录执行较慢的未使用索引的语句

log_queries_not_using_indexes = 1
```

上述所有的参数配置完成之后，都需要重新启动 MySQL 服务器才可以生效。
