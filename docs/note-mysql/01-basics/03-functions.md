---
title: "3. 函数"
---

## 3.1 字符串函数

函数接收参数并返回计算结果，可以放在查询列或条件中。下面这些表达式可直接放到 `SELECT` 后运行：

| 用途         | 表达式                         | 结果或说明                                         |
| ------------ | ------------------------------ | -------------------------------------------------- |
| 拼接         | `CONCAT('My', 'SQL')`          | `'MySQL'`；任意参数为 `NULL` 时返回 `NULL`         |
| 转换大小写   | `LOWER('SQL')`、`UPPER('sql')` | `'sql'`、`'SQL'`                                   |
| 去掉两端空格 | `TRIM(' SQL ')`                | `'SQL'`，内部空格保留                              |
| 截取字符     | `SUBSTRING('abcdef', 2, 3)`    | `'bcd'`，正向位置从 `1` 开始                       |
| 左侧补齐     | `LPAD('7', 3, '0')`            | `'007'`；`RPAD()` 从右侧补齐，目标长度更短时会截断 |
| 统计字符数   | `CHAR_LENGTH('中文')`          | `2`                                                |
| 统计字节数   | `LENGTH('中文')`               | `utf8mb4` 编码下为 `6`                             |

例如，为员工编号补齐显示位数，再组合成一段文本：

```sql
SELECT id, CONCAT(LPAD(id, 5, '0'), ' / ', name) AS employee_label
FROM employee
ORDER BY id;
```

林晨的结果是 `'00001 / 林晨'`。补零只改变结果的显示方式，表中的 `id` 仍然是整数 `1`。[字符串函数](https://dev.mysql.com/doc/refman/8.4/en/string-functions.html)

## 3.2 数值函数

| 用途           | 表达式             | 结果    |
| -------------- | ------------------ | ------- |
| 保留指定小数位 | `ROUND(12.345, 2)` | `12.35` |
| 向上取整       | `CEIL(1.2)`        | `2`     |
| 向下取整       | `FLOOR(-1.2)`      | `-2`    |
| 绝对值         | `ABS(-7)`          | `7`     |
| 求余数         | `MOD(7, 3)`        | `1`     |

`FLOOR()` 向负无穷方向取整，因此对负数取整不等于去掉小数部分。`ROUND()` 对精确数和近似数的舍入规则可能不同，这里的 `12.345` 是精确数值字面量。[数值函数](https://dev.mysql.com/doc/refman/8.4/en/mathematical-functions.html)

## 3.3 日期函数

| 用途               | 表达式                                                           | 结果或说明                  |
| ------------------ | ---------------------------------------------------------------- | --------------------------- |
| 当前日期、日期时间 | `CURDATE()`、`NOW()`                                             | 取决于运行时间和会话时区    |
| 提取年月日         | `YEAR('2024-06-15')`、`MONTH('2024-06-15')`、`DAY('2024-06-15')` | `2024`、`6`、`15`           |
| 增加时间           | `DATE_ADD('2024-06-15', INTERVAL 7 DAY)`                         | `'2024-06-22'`              |
| 减少时间           | `DATE_SUB('2024-06-15', INTERVAL 1 MONTH)`                       | `'2024-05-15'`              |
| 日期相差天数       | `DATEDIFF('2024-06-17', '2024-06-15')`                           | `2`，第一个日期减第二个日期 |
| 指定单位的时间差   | `TIMESTAMPDIFF(MONTH, '2024-06-15', '2024-07-15')`               | `1`，结束时间减开始时间     |

`DATEDIFF()` 忽略时间部分，`TIMESTAMPDIFF()` 按指定单位返回整数差值；两者的参数方向相反。[日期时间函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html)

```sql
SELECT name, DATEDIFF(CURDATE(), entry_date) AS employment_days
FROM employee
ORDER BY employment_days DESC, id ASC;
```

这条查询计算入职天数，结果随运行日期变化。若要计算完整的入职年数，可以改用 `TIMESTAMPDIFF(YEAR, entry_date, CURDATE())`。

## 3.4 条件与空值处理

| 写法                                  | 用途                                         |
| ------------------------------------- | -------------------------------------------- |
| `IF(condition, a, b)`                 | 条件为真时返回 `a`，否则返回 `b`             |
| `IFNULL(value, fallback)`             | `value` 为 `NULL` 时使用备用值               |
| `COALESCE(a, b, ...)`                 | 返回第一个非空参数，全部为空时返回 `NULL`    |
| `CASE WHEN ... THEN ... ELSE ... END` | 按顺序判断多个条件，返回第一个满足条件的分支 |

`IFNULL()` 和 `COALESCE()` 不会把空字符串视为 `NULL`。前面提到 `CONCAT()` 遇到空值会返回空值，所以拼接邮箱前可以先做回退：

```sql
SELECT name,
       CONCAT(name, ' / ', COALESCE(email, '未填写')) AS contact
FROM employee
ORDER BY id;
```

周宁没有邮箱，结果为 `'周宁 / 未填写'`，而不是 `NULL`。

多个分支用 `CASE` 表达，例如按薪资划分等级：

```sql
SELECT name,
       CASE
           WHEN salary >= 10000 THEN 'A'
           WHEN salary >= 8000 THEN 'B'
           ELSE 'C'
       END AS salary_band
FROM employee
ORDER BY id;
```

林晨、周宁、陈雨、许安依次为 `'A'`、`'B'`、`'B'`、`'C'`。这里必须先判断较高门槛，否则林晨也会先命中 `salary >= 8000` 的分支。没有命中分支且省略 `ELSE` 时，结果为 `NULL`。[条件函数](https://dev.mysql.com/doc/refman/8.4/en/flow-control-functions.html) · [COALESCE](https://dev.mysql.com/doc/refman/8.4/en/comparison-operators.html)
