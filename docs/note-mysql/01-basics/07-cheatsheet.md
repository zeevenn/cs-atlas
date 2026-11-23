---
title: "MySQL 基础速查"
description: MySQL 常用 SQL、函数、约束、连接与事务写法速查。
---

## 数据库、表与数据类型

| 操作                 | 写法                                                    |
| -------------------- | ------------------------------------------------------- |
| 查看版本、当前数据库 | `SELECT VERSION();`、`SELECT DATABASE();`               |
| 查看数据库、表       | `SHOW DATABASES;`、`SHOW TABLES;`                       |
| 选择数据库           | `USE atlas_demo;`                                       |
| 查看列、完整建表语句 | `DESCRIBE employee;`、`SHOW CREATE TABLE employee;`     |
| 新建数据库           | `CREATE DATABASE atlas_demo CHARACTER SET utf8mb4;`     |
| 新增列               | `ALTER TABLE employee ADD COLUMN phone VARCHAR(32);`    |
| 修改列定义           | `ALTER TABLE employee MODIFY COLUMN phone VARCHAR(64);` |
| 重命名列             | `ALTER TABLE employee RENAME COLUMN phone TO mobile;`   |
| 删除列               | `ALTER TABLE employee DROP COLUMN mobile;`              |

`MODIFY`、`CHANGE` 要写全需保留的列属性。[ALTER TABLE 官方语法](https://dev.mysql.com/doc/refman/8.4/en/alter-table.html)

| 数据     | 常用类型                | 留意                       |
| -------- | ----------------------- | -------------------------- |
| 整数     | `INT`、`BIGINT`         | 按范围选择                 |
| 精确小数 | `DECIMAL(p, s)`         | 总位数、小数位数           |
| 字符串   | `CHAR(n)`、`VARCHAR(n)` | 定长、可变长；`n` 按字符计 |
| 日期     | `DATE`                  | 年月日                     |
| 日期时间 | `DATETIME`、`TIMESTAMP` | 后者涉及会话时区转换       |

## 写入、修改与删除

```sql
INSERT INTO department (id, name) VALUES (4, '客服部');

-- 用事务撤销修改练习
START TRANSACTION;
UPDATE employee SET salary = salary + 500 WHERE id = 2;
DELETE FROM employee WHERE id = 4;
ROLLBACK;
```

`UPDATE`、`DELETE` 缺少 `WHERE` 会影响全表。`DELETE` 保留表结构，InnoDB 中未提交时可回滚；`TRUNCATE TABLE` 清空并重置自增计数器，`DROP TABLE` 删除整张表，后二者会隐式提交，不能回滚。详见 [SQL](02-sql.md)。

## 筛选、分组与分页

| 需求                   | 写法                                              |
| ---------------------- | ------------------------------------------------- |
| 组合条件               | `AND`、`OR`、`NOT`，用括号明确组合关系            |
| 范围，包含两端         | `salary BETWEEN 8000 AND 10000`                   |
| 集合匹配               | `department_id IN (1, 2)`                         |
| 模糊匹配               | `name LIKE '林%'`，`%` 为任意长度，`_` 为单个字符 |
| 空值判断               | `email IS NULL`、`email IS NOT NULL`              |
| 去重                   | `SELECT DISTINCT department_id FROM employee`     |
| 统计行、非空值         | `COUNT(*)`、`COUNT(email)`                        |
| 求和、平均、最大、最小 | `SUM()`、`AVG()`、`MAX()`、`MIN()`                |
| 分页                   | `LIMIT 10 OFFSET 20`，跳过前 `20` 行再取 `10` 行  |

```sql
SELECT department_id, COUNT(*) AS employee_count
FROM employee
WHERE department_id IS NOT NULL
GROUP BY department_id
HAVING COUNT(*) >= 2
ORDER BY employee_count DESC, department_id ASC;
```

`WHERE` 筛行，`HAVING` 筛组；分组后的非聚合列必须有确定含义。分页需显式排序，可增加唯一列确定同值记录的顺序。详见 [查询与分组](02-sql.md#_2-4-dql-从筛选行到生成结果)。

## 常用函数

| 用途               | 写法                                                           |
| ------------------ | -------------------------------------------------------------- |
| 拼接、转换大小写   | `CONCAT(a, b)`、`LOWER(s)`、`UPPER(s)`                         |
| 去空格、截取       | `TRIM(s)`、`SUBSTRING(s, start, length)`                       |
| 补齐               | `LPAD(s, length, pad)`、`RPAD(s, length, pad)`                 |
| 字符数、字节数     | `CHAR_LENGTH(s)`、`LENGTH(s)`                                  |
| 舍入、取整         | `ROUND(x, n)`、`CEIL(x)`、`FLOOR(x)`                           |
| 绝对值、余数       | `ABS(x)`、`MOD(x, y)`                                          |
| 当前日期、日期时间 | `CURDATE()`、`NOW()`                                           |
| 提取年月日         | `YEAR(d)`、`MONTH(d)`、`DAY(d)`                                |
| 日期偏移           | `DATE_ADD(d, INTERVAL 7 DAY)`、`DATE_SUB(d, INTERVAL 1 MONTH)` |
| 日期差             | `DATEDIFF(end_date, start_date)`，只看日期部分                 |
| 指定单位时间差     | `TIMESTAMPDIFF(DAY, start_time, end_time)`                     |
| 空值回退           | `IFNULL(value, fallback)`、`COALESCE(a, b, ...)`               |
| 条件选择           | `IF(condition, a, b)`                                          |
| 多分支             | `CASE WHEN condition THEN a ELSE b END`                        |

`CONCAT()` 遇到空参数返回 `NULL`；`CASE` 取第一个满足条件的分支。详见 [函数](03-functions.md)。

## 约束与表关系

| 规则   | 写法                                                     | 留意                              |
| ------ | -------------------------------------------------------- | --------------------------------- |
| 主键   | `PRIMARY KEY (id)`                                       | 唯一且非空，可包含多列            |
| 非空   | `name VARCHAR(50) NOT NULL`                              | 不禁止空字符串                    |
| 唯一   | `UNIQUE (email)`                                         | MySQL 单列唯一索引允许多个 `NULL` |
| 检查   | `CHECK (salary >= 0)`                                    | 条件为未知值时也能通过            |
| 默认值 | `salary DECIMAL(10, 2) DEFAULT 0`                        | 不等于非空约束                    |
| 自增   | `id INT AUTO_INCREMENT PRIMARY KEY`                      | 不保证连续                        |
| 外键   | `FOREIGN KEY (department_id) REFERENCES department (id)` | 非空引用值必须存在                |

外键动作：`RESTRICT`、`NO ACTION` 拒绝破坏引用的操作，`CASCADE` 传播删除或键值变更，`SET NULL` 清空引用。`CHECK` 从 MySQL 8.0.16 起实际执行。详见 [约束](04-constraints.md)。

一对多在多的一方存关联键，多对多用中间表，一对一可用唯一外键。详见 [表间关系](05-multi-table-queries.md#_5-1-先明确表间关系)。

## 连接、合并与子查询

| 需求           | 写法或选择                          | 留意                            |
| -------------- | ----------------------------------- | ------------------------------- |
| 只留匹配组合   | `INNER JOIN ... ON ...`             | 检查一行应匹配多少行            |
| 保留左表全部行 | `LEFT JOIN ... ON ...`              | 无匹配时右表列补 `NULL`         |
| 员工关联上级   | 同表使用不同别名连接                | 用 `manager_id` 匹配上级的 `id` |
| 合并结果行     | `UNION ALL`、`UNION`                | 后者去重；列数相同，类型兼容    |
| 与单值比较     | `salary > (SELECT AVG(salary) ...)` | 标量子查询返回多行时报错        |
| 与一组值比较   | `id IN (SELECT department_id ...)`  | `NOT IN` 要处理子查询中的空值   |
| 判断有无关联行 | `EXISTS (...)`、`NOT EXISTS (...)`  | 只关心是否返回行                |
| 使用汇总结果   | `FROM (SELECT ...) AS x`            | 派生表需要别名                  |

外连接中，`ON` 控制匹配，`WHERE` 仍可能过滤掉保留的左表行。统计空部门时用 `COUNT(e.id)`，避免把补出的空行计为员工。详见 [多表查询](05-multi-table-queries.md)。

## 事务与隔离级别

```sql
SELECT @@session.autocommit;
SELECT @@session.transaction_isolation;

SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;
START TRANSACTION;
UPDATE employee SET salary = salary + 500 WHERE id = 2;
ROLLBACK;
-- 需要保存时，将 ROLLBACK 替换为 COMMIT
```

| 隔离级别           | InnoDB 普通查询的主要行为                    |
| ------------------ | -------------------------------------------- |
| `READ UNCOMMITTED` | 可能读到未提交修改                           |
| `READ COMMITTED`   | 每次一致性读建立新快照                       |
| `REPEATABLE READ`  | 默认级别，事务内通常复用第一次一致性读的快照 |
| `SERIALIZABLE`     | 显式事务中的普通查询转为共享锁读取           |

普通 `SELECT` 与 `SELECT ... FOR UPDATE` 的读取规则不同；语句失败不一定使整笔事务回滚，普通 DDL 会隐式提交。详见 [事务](06-transactions.md)。

## 账号与权限

```sql
CREATE USER 'atlas_reader'@'localhost' IDENTIFIED BY RANDOM PASSWORD;
GRANT SELECT ON atlas_demo.* TO 'atlas_reader'@'localhost';
SHOW GRANTS FOR 'atlas_reader'@'localhost';
REVOKE SELECT ON atlas_demo.* FROM 'atlas_reader'@'localhost';
```

由具备相应权限的管理员执行。创建账号、授权分为两步，账号由用户名和主机部分共同标识。详见 [账号与权限](02-sql.md#_2-5-dcl-账号与权限)。
