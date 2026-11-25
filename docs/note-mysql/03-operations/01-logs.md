---
title: "1. 日志"
---

## 1.1 错误日志

错误日志记录服务器启动、关闭及运行期间的诊断信息，包括错误、警告等。排查启动失败或异常退出时，应先确认日志去向，而不是假定它一定在 `/var/log/mysqld.log`。

```sql
SHOW VARIABLES LIKE 'log_error';
SHOW VARIABLES LIKE 'log_error_services';
SHOW VARIABLES LIKE 'datadir';
```

日志可能写入文件、标准错误输出，或由服务管理器收集，取决于发行包、启动方式和日志组件配置。[错误日志](https://dev.mysql.com/doc/refman/8.4/en/error-log.html)

![错误日志](/note-mysql/assets/1684127028346-598bae76-afe0-4b53-ab77-d94744b42295.png)

## 1.2 二进制日志

binlog 记录用于复制和恢复的数据变更事件，以及相关事务信息。MySQL 8.4 默认开启二进制日志，默认使用 `ROW` 格式；实际实例仍可能通过启动选项关闭。

binlog 不是所有操作的逐字 SQL 审计记录。例如，普通查询通常不记录；事务回滚、临时表、非事务表以及日志开关等也会影响具体记录行为。[二进制日志](https://dev.mysql.com/doc/refman/8.4/en/binary-log.html)

```sql
SELECT @@log_bin, @@binlog_format, @@log_bin_basename, @@log_bin_index;
SHOW BINARY LOGS;
SHOW BINARY LOG STATUS;
```

`SHOW BINARY LOG STATUS` 是 MySQL 8.4 的语法；旧资料中的 `SHOW MASTER STATUS` 已被移除。

![Binlog 配置示例](/note-mysql/assets/1684127103697-5e0d7d7e-33ed-404e-91b7-ab91ea2451df.png)

| 项目               | 含义                                             |
| ------------------ | ------------------------------------------------ |
| `log_bin_basename` | Binlog 文件名前缀，不含最终的编号部分            |
| `log_bin_index`    | 记录受服务器管理的 binlog 文件列表的索引文件     |
| `binlog_format`    | 记录格式；8.4 默认 `ROW`，该变量及非行格式已弃用 |

![Binlog 文件与索引文件](/note-mysql/assets/1684127210313-747d60c1-b5b2-481e-9a0a-2f1f8b54787c.png)

![旧环境中的日志格式配置](/note-mysql/assets/1684127249740-2b9cd808-4fb5-48b0-ac5e-ff13bfbe896e.png)

使用 `mysqlbinlog` 查看事件，例如：

```sh
mysqlbinlog --base64-output=DECODE-ROWS -vv /path/to/binlog.000001
```

| 选项                                  | 用途                                                     |
| ------------------------------------- | -------------------------------------------------------- |
| `--start-position`、`--stop-position` | 按事件位置选择范围，位置应落在有效事件边界               |
| `--start-datetime`、`--stop-datetime` | 按时间筛选，需要核对时区及事务边界                       |
| `--offset`                            | 跳过指定数量的日志事件，不是跳过文本行数                 |
| `-v`、`-vv`                           | 将行事件展开为便于阅读的注释式伪 SQL，后者包含更多元数据 |

`DECODE-ROWS` 生成的可读行事件不能当成可直接重放的 SQL。执行时间点恢复时，需要一致性备份及其后完整的日志链，并按恢复流程生成可重放输出；`--database` 的过滤语义也随记录格式而异，不能随意拿它截取恢复范围。[mysqlbinlog](https://dev.mysql.com/doc/refman/8.4/en/mysqlbinlog.html)

清理 binlog 前，确认备份恢复窗口，以及所有副本、订阅程序仍需要的日志。由服务器执行清理，不要直接用文件删除命令破坏日志索引。

```sql
-- 语法示例：执行前必须把目标文件替换为已核实的安全边界
-- 删除该文件之前的日志，不删除目标文件本身
PURGE BINARY LOGS TO 'binlog.000010';
```

![旧环境中的日志清理命令示例](/note-mysql/assets/1684127556074-51342b98-89da-4576-a7d0-fcee4ce32b9a.png)

离线或延迟副本可能还没拉取待删除日志，服务器无法替你保证这些副本未来仍能接续复制。`RESET BINARY LOGS AND GTIDS` 会重置日志和 GTID 历史，不是常规清理手段。[PURGE BINARY LOGS](https://dev.mysql.com/doc/refman/8.4/en/purge-binary-logs.html)

```sql
SHOW VARIABLES LIKE 'binlog_expire_logs_seconds';
SHOW VARIABLES LIKE 'binlog_expire_logs_auto_purge';
```

MySQL 8.4 的默认过期时间是 30 天，但实际清理还受自动清理开关和触发时机等影响。保留时间应覆盖副本最大延迟及恢复需要。

## 1.3 查询日志

通用查询日志（general query log）主要记录客户端连接、断开及收到的语句，可用于短期排查。它反映收到语句的顺序，不等于事务提交顺序，也不是只记录成功的修改。

![查询日志](/note-mysql/assets/1684127618677-955313b9-780d-494c-8302-1bc0dd402e0b.png)

默认关闭，可由有权限的管理员动态开启：

```sql
SHOW VARIABLES LIKE 'log_output';
SHOW VARIABLES LIKE 'general_log_file';
SET GLOBAL general_log = ON;
-- 完成诊断后关闭
SET GLOBAL general_log = OFF;
```

输出位置由 `log_output` 决定，可以是文件、表或不输出；相对文件路径通常相对于数据目录，不能一概写死为 `/var/lib/mysql/`。日志可能包含业务数据，应控制访问权限和保留时间。[通用查询日志](https://dev.mysql.com/doc/refman/8.4/en/query-log.html)

## 1.4 慢查询日志

慢日志默认关闭，通常记录执行时间达到 `long_query_time` 且检查行数达到 `min_examined_row_limit` 等条件的语句。`long_query_time` 默认是 10 秒，可设置小数。

```sql
SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 2;
SET SESSION long_query_time = 2;
SHOW VARIABLES LIKE 'slow_query_log_file';
SHOW VARIABLES LIKE 'min_examined_row_limit';
```

这些动态配置不必一律重启服务器。`long_query_time` 的全局值是新连接的默认值，已有连接还需检查自己的会话值；需要跨重启保留时，再使用配置文件或适用变量的持久化设置。

| 选项                                     | 含义                                                                         |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| `log_slow_admin_statements`              | 将符合慢日志条件的部分管理语句纳入记录                                       |
| `log_queries_not_using_indexes`          | 额外记录未使用索引定位的查询，即使未达到时间阈值；仍受其他条件和限流设置影响 |
| `log_throttle_queries_not_using_indexes` | 限制上述额外记录的速率，避免日志快速膨胀                                     |

**不开启未使用索引查询的额外记录，不代表慢日志会忽略所有全表扫描。** 普通查询即使没有使用索引，只要达到正常慢日志条件，仍可被记录。[慢日志条件与动态参数](https://dev.mysql.com/doc/refman/8.4/en/slow-query-log.html)
