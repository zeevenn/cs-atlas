---
title: "2. SQL"
---

## 2.1 通用规则与分类

SQL 语句通常以分号结束，可分行书写。本篇统一大写关键字、小写表名和列名，字符串使用单引号。关键字不区分大小写，但表名的大小写规则与平台、服务器设置有关。[标识符大小写规则](https://dev.mysql.com/doc/refman/8.4/en/identifier-case-sensitivity.html)

| 分类 | 用途                       | 代表语句                     |
| ---- | -------------------------- | ---------------------------- |
| DDL  | 定义数据库、表等对象       | `CREATE`、`ALTER`、`DROP`    |
| DML  | 写入、修改、删除数据       | `INSERT`、`UPDATE`、`DELETE` |
| DQL  | 查询数据，教程中常单独列出 | `SELECT`                     |
| DCL  | 管理账号与权限             | `GRANT`、`REVOKE`            |

```sql
-- 单行注释：两个减号后留空格
/* 多行注释 */
SELECT 1;
```

## 2.2 DDL：建表与选择类型

先建立部门表和员工表。后续章节都使用这组表和初始数据。

```sql
CREATE DATABASE atlas_demo CHARACTER SET utf8mb4;
USE atlas_demo;

CREATE TABLE department (
    id INT PRIMARY KEY,
    name VARCHAR(50) NOT NULL
) ENGINE = InnoDB;

CREATE TABLE employee (
    id INT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    department_id INT,
    salary DECIMAL(10, 2) NOT NULL,
    entry_date DATE NOT NULL,
    manager_id INT
) ENGINE = InnoDB;
```

`PRIMARY KEY` 标识一行，`NOT NULL` 表示该列不能缺失，`ENGINE = InnoDB` 指定存储引擎。其他约束在 [第 4 章](04-constraints.md) 补充。

类型根据数据含义选择：

| 数据           | 常用类型                | 说明                                                                      |
| -------------- | ----------------------- | ------------------------------------------------------------------------- |
| 整数编号、数量 | `INT`、`BIGINT`         | 按取值范围选择                                                            |
| 金额等精确小数 | `DECIMAL(p, s)`         | `p` 为总位数，`s` 为小数位数；`DECIMAL(10, 2)` 可保存 8 位整数和 2 位小数 |
| 固定长度字符串 | `CHAR(n)`               | 适合长度固定的编码，需留意尾部空格规则                                    |
| 可变长度字符串 | `VARCHAR(n)`            | `n` 是最大字符数，实际字节数取决于编码                                    |
| 日期           | `DATE`                  | 只有年月日                                                                |
| 日期时间       | `DATETIME`、`TIMESTAMP` | 后者在存取时按会话时区与 UTC 转换，前者不做这种转换                       |

金额通常选 `DECIMAL`，避免 `FLOAT`、`DOUBLE` 的近似误差。详细规则见 [DECIMAL](https://dev.mysql.com/doc/refman/8.4/en/precision-math-decimal-characteristics.html)、[字符串类型](https://dev.mysql.com/doc/refman/8.4/en/char.html) 和 [日期时间类型](https://dev.mysql.com/doc/refman/8.4/en/datetime.html)。

查看和修改表结构：

```sql
SHOW TABLES;
DESCRIBE employee;
SHOW CREATE TABLE employee;

ALTER TABLE employee ADD COLUMN phone VARCHAR(32);
ALTER TABLE employee MODIFY COLUMN phone VARCHAR(64);
ALTER TABLE employee RENAME COLUMN phone TO mobile;
ALTER TABLE employee DROP COLUMN mobile;
```

`MODIFY` 修改列定义，`RENAME COLUMN` 只改名；`CHANGE old_name new_name 完整列定义` 可以同时改名和定义。使用 `MODIFY` 或 `CHANGE` 时，要写全需要保留的 `NOT NULL`、`DEFAULT` 等属性。[ALTER TABLE 语法](https://dev.mysql.com/doc/refman/8.4/en/alter-table.html)

## 2.3 DML：写入与修改数据

插入时显式指定列名，让每个值的含义清楚，也避免依赖表中列的排列顺序。

```sql
INSERT INTO department (id, name)
VALUES (1, '研发部'), (2, '运营部'), (3, '财务部');

INSERT INTO employee
    (id, name, email, department_id, salary, entry_date, manager_id)
VALUES
    (1, '林晨', 'lin@example.com', 1, 12000.00, '2022-03-01', NULL),
    (2, '周宁', NULL, 1, 9000.00, '2024-06-15', 1),
    (3, '陈雨', NULL, 2, 8000.00, '2023-09-01', 1),
    (4, '许安', 'xu@example.com', NULL, 7000.00, '2024-10-01', NULL);
```

初始数据中，部门编号 `1`、`2`、`3` 分别是研发部、运营部、财务部。员工的主要信息如下：

| `id` | `name` | `department_id` | `salary` | `manager_id` |
| ---- | ------ | --------------- | -------- | ------------ |
| 1    | 林晨   | 1               | 12000.00 | `NULL`       |
| 2    | 周宁   | 1               | 9000.00  | 1            |
| 3    | 陈雨   | 2               | 8000.00  | 1            |
| 4    | 许安   | `NULL`          | 7000.00  | `NULL`       |

`department_id` 为空表示尚未分配部门，`manager_id` 为空表示没有记录直属上级。周宁和陈雨的上级编号都是 `1`，对应林晨；财务部暂时没有员工。

`UPDATE` 修改行，`DELETE` 删除行。**二者缺少 `WHERE` 时都会影响全表。** 下面用事务包住练习，最后撤销修改，保留后续章节的初始数据；提交与回滚的原理见 [第 6 章](06-transactions.md)。

```sql
START TRANSACTION;

UPDATE employee SET salary = salary + 500 WHERE id = 2;
DELETE FROM employee WHERE id = 4;
SELECT id, name, salary FROM employee ORDER BY id;

ROLLBACK;
```

还要区分三种删除操作：

| 操作                                | 删除什么               | 支持 `WHERE` | 能否通过事务回滚      |
| ----------------------------------- | ---------------------- | ------------ | --------------------- |
| `DELETE FROM employee WHERE id = 4` | 符合条件的行           | 是           | InnoDB 中未提交时可以 |
| `TRUNCATE TABLE employee`           | 全部行，重置自增计数器 | 否           | 会隐式提交，不能回滚  |
| `DROP TABLE employee`               | 表结构及全部数据       | 否           | 会隐式提交，不能回滚  |

## 2.4 DQL：从筛选行到生成结果

### 基础查询与条件

查询部门编号为 `1` 或 `2`、薪资至少为 8000 的员工，并按薪资从高到低排列：

```sql
SELECT e.id, e.name AS employee_name, e.salary
FROM employee AS e
WHERE e.salary >= 8000 AND e.department_id IN (1, 2)
ORDER BY e.salary DESC, e.id ASC;
```

结果依次为林晨、周宁、陈雨。`AS` 设置别名：`e` 是表的别名，`employee_name` 是结果列名；`e.name` 表示取 `e` 这张表的 `name` 列。`DESC` 为降序，`ASC` 为升序，也是默认方向。

| 需求     | 写法                                          | 说明                                         |
| -------- | --------------------------------------------- | -------------------------------------------- |
| 组合条件 | `AND`、`OR`、`NOT`                            | 分别表示且、或、非；混用时用括号明确组合关系 |
| 范围筛选 | `salary BETWEEN 8000 AND 10000`               | 包含两端                                     |
| 集合匹配 | `department_id IN (1, 2)`                     | 匹配其中任意一个值                           |
| 前缀匹配 | `name LIKE '林%'`                             | `%` 匹配任意长度，`_` 匹配单个字符           |
| 判断空值 | `email IS NULL`、`email IS NOT NULL`          | 不能用 `email = NULL` 判断                   |
| 去重     | `SELECT DISTINCT department_id FROM employee` | 多列时按所选列的整个组合去重                 |

`NULL` 表示缺失或未知，不是 `0` 或空字符串。普通比较涉及 `NULL` 时通常得到未知值，而 **`WHERE` 只保留条件为真的行**。例如许安的 `department_id IN (1, 2)` 不是真，因此不会出现在上面的结果中。[比较运算与 NULL](https://dev.mysql.com/doc/refman/8.4/en/comparison-operators.html)

查询整个年份时，可以使用左闭右开的区间。这种写法也适用于带时间部分的列，不会遗漏最后一天的其他时间：

```sql
SELECT id, name, entry_date
FROM employee
WHERE entry_date >= '2024-01-01'
  AND entry_date < '2025-01-01';
```

### 聚合、分组与筛选组

聚合函数把多行数据汇总为一个值：

| 函数                         | 用途                    |
| ---------------------------- | ----------------------- |
| `COUNT(*)`                   | 统计行数                |
| `COUNT(email)`               | 统计 `email` 非空的行数 |
| `SUM(salary)`、`AVG(salary)` | 求和、平均值            |
| `MAX(salary)`、`MIN(salary)` | 最大值、最小值          |

不分组时，对全部符合条件的行汇总；使用 `GROUP BY department_id` 时，每个部门分别汇总。下面只统计已分配部门的员工，再保留人数至少为 `2` 的部门：

```sql
SELECT department_id,
       COUNT(*) AS employee_count,
       COUNT(email) AS known_email_count,
       AVG(salary) AS avg_salary
FROM employee
WHERE department_id IS NOT NULL
GROUP BY department_id
HAVING COUNT(*) >= 2
ORDER BY avg_salary DESC;
```

| `department_id` | `employee_count` | `known_email_count` | `avg_salary` |
| --------------- | ---------------- | ------------------- | ------------ |
| 1               | 2                | 1                   | 10500.00     |

`WHERE` 先排除许安，剩余员工分成研发部和运营部两组；`HAVING` 再排除只有一人的运营部。研发部有两名员工，但周宁没有邮箱，所以两个计数不同。

多数聚合函数忽略 `NULL`。对空集合做不带 `GROUP BY` 的聚合时，`COUNT()` 返回 `0`，`SUM()`、`AVG()` 返回 `NULL`；带分组时，没有对应行就不会生成该组。[聚合函数](https://dev.mysql.com/doc/refman/8.4/en/aggregate-functions.html)

MySQL 默认启用 `ONLY_FULL_GROUP_BY`。分组查询中的非聚合列应在分组列中，或能由分组列确定。例如按部门分组后，不能直接选择员工姓名，因为一个部门可能对应多个姓名。[GROUP BY 规则](https://dev.mysql.com/doc/refman/8.4/en/group-by-handling.html)

### 排序与分页

```sql
SELECT id, name, salary
FROM employee
ORDER BY salary DESC, id ASC
LIMIT 2 OFFSET 2;
```

跳过前 `2` 行，再取 `2` 行，得到陈雨和许安。增加唯一的 `id` 作为第二排序条件，可以确定同薪资员工的先后顺序；并发增删仍可能使不同次分页的边界变化。

分析查询结果时，按 **取数据 → 筛选行 → 分组 → 筛选组 → 生成查询列 → 去重 → 排序 → 截取结果** 理解即可。这是逻辑顺序，数据库的实际执行方式可能不同。[SELECT 语法](https://dev.mysql.com/doc/refman/8.4/en/select.html)

## 2.5 DCL：账号与权限

MySQL 账号由用户名和主机部分共同标识，`'atlas_reader'@'localhost'` 表示从本机连接的这个账号。创建账号和授予权限是两步；以下语句由具备相应权限的管理员执行：

```sql
CREATE USER 'atlas_reader'@'localhost' IDENTIFIED BY RANDOM PASSWORD;
GRANT SELECT ON atlas_demo.* TO 'atlas_reader'@'localhost';
SHOW GRANTS FOR 'atlas_reader'@'localhost';
REVOKE SELECT ON atlas_demo.* FROM 'atlas_reader'@'localhost';
```

第一条语句生成并返回随机密码；`GRANT` 授予 `atlas_demo` 中所有表的查询权限，`REVOKE` 撤销该权限，但不删除账号。权限也可以只授予某一张表，按应用实际需要选择。[账号管理](https://dev.mysql.com/doc/refman/8.4/en/create-user.html) · [GRANT 语法](https://dev.mysql.com/doc/refman/8.4/en/grant.html)
