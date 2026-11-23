---
title: "5. 多表查询"
---

## 5.1 先明确表间关系

员工表只保存部门编号，查询员工的部门名称时，需要把员工与部门对应起来。本章沿用 [第 2 章的初始数据](02-sql.md#_2-3-dml-写入与修改数据)：研发部有林晨、周宁，运营部有陈雨，财务部没有员工，许安尚未分配部门。

| 关系   | 例子                                             | 保存方式                                                     |
| ------ | ------------------------------------------------ | ------------------------------------------------------------ |
| 一对多 | 一个部门可以有多名员工，一名员工最多属于一个部门 | 在员工表保存 `department_id`                                 |
| 多对多 | 学生可选多门课，一门课也可有多名学生             | 用选课表保存学生编号、课程编号，每行表示一条选课关系         |
| 一对一 | 员工基本信息与扩展档案                           | 在档案表保存员工编号，并加唯一约束，避免一名员工对应多份档案 |

连接时要先知道一行可能匹配多少行。部门匹配多名员工是正常的一对多关系，不能一看到部门名称重复，就加 `DISTINCT`。

## 5.2 内连接与外连接

![内连接、左连接与右连接](/note-mysql/assets/join-overview.svg)

图中交叠处表示满足 `ON` 条件的匹配，着色只表示保留范围，不表示结果行数或去重。MySQL 不直接支持 `FULL OUTER JOIN`。[JOIN 语法](https://dev.mysql.com/doc/refman/8.4/en/join.html)

### 内连接：只列出能找到部门的员工

```sql
SELECT e.id, e.name, d.name AS department_name
FROM employee AS e
INNER JOIN department AS d ON d.id = e.department_id
ORDER BY e.id;
```

`ON` 指定匹配条件：员工的部门编号等于部门的编号时，两行才能组合成一行。**内连接只保留匹配成功的组合**。

![内连接匹配示意](/note-mysql/assets/inner-join.svg)

| `id` | `name` | `department_name` |
| ---- | ------ | ----------------- |
| 1    | 林晨   | 研发部            |
| 2    | 周宁   | 研发部            |
| 3    | 陈雨   | 运营部            |

许安没有匹配到部门，财务部没有匹配到员工，因此都没有出现在结果中。研发部出现两次，分别对应两名员工。

如果不限制如何匹配，例如写成 `FROM employee CROSS JOIN department`，每名员工都会与每个部门组合，得到 `4 × 3 = 12` 行，这叫笛卡尔积。结果行数异常时，应先检查连接条件。

### 左连接：没有部门的员工也要列出

![左连接匹配示意](/note-mysql/assets/left-join.svg)

把员工表放在左边，改用左连接：

```sql
SELECT e.id, e.name, d.name AS department_name
FROM employee AS e
LEFT JOIN department AS d ON d.id = e.department_id
ORDER BY e.id;
```

| `id` | `name` | `department_name` |
| ---- | ------ | ----------------- |
| 1    | 林晨   | 研发部            |
| 2    | 周宁   | 研发部            |
| 3    | 陈雨   | 运营部            |
| 4    | 许安   | `NULL`            |

**左连接保留左表的每一行；右表没有匹配行时，右表列补 `NULL`**。所以许安保留了，但财务部仍不会单独出现。若要列出全部部门，应把部门表放在左边。[JOIN 语义](https://dev.mysql.com/doc/refman/8.4/en/join.html)

右连接 `RIGHT JOIN` 保留右表的每一行；交换两张表的位置，可以改写成左连接。

### 匹配条件与结果过滤不同

需求：列出全部部门，只显示其中薪资至少为 10000 的员工。没有符合条件的员工，也要保留部门。

```sql
SELECT d.id, d.name, e.name AS employee_name
FROM department AS d
LEFT JOIN employee AS e
    ON e.department_id = d.id AND e.salary >= 10000
ORDER BY d.id, e.id;
```

| `id` | `name` | `employee_name` |
| ---- | ------ | --------------- |
| 1    | 研发部 | 林晨            |
| 2    | 运营部 | `NULL`          |
| 3    | 财务部 | `NULL`          |

研发部只有林晨匹配成功。运营部的陈雨薪资不够，财务部没有员工，两个部门都由左连接保留，员工列补 `NULL`。

如果把薪资条件移到 `WHERE`：

```sql
SELECT d.id, d.name, e.name AS employee_name
FROM department AS d
LEFT JOIN employee AS e ON e.department_id = d.id
WHERE e.salary >= 10000
ORDER BY d.id, e.id;
```

结果只剩研发部和林晨。周宁、陈雨因薪资不足被过滤；财务部补出的薪资为 `NULL`，也不能通过 `WHERE`。

**`ON` 决定哪些行能匹配，`WHERE` 决定连接后的哪些行能留下**。左连接保证匹配阶段保留左表行，后面的筛选仍可能将它们排除。

![ON 与 WHERE 对照](/note-mysql/assets/join-on-vs-where.svg)

### 包含零计数的统计

统计每个部门的人数，包括人数为 `0` 的财务部：

```sql
SELECT d.id, d.name, COUNT(e.id) AS employee_count
FROM department AS d
LEFT JOIN employee AS e ON e.department_id = d.id
GROUP BY d.id, d.name
ORDER BY d.id;
```

| `id` | `name` | `employee_count` |
| ---- | ------ | ---------------- |
| 1    | 研发部 | 2                |
| 2    | 运营部 | 1                |
| 3    | 财务部 | 0                |

这里的关键是财务部在分组前仍有一行，但其中的 `e.id` 为 `NULL`。`COUNT(*)` 会把这行计为 `1`，`COUNT(e.id)` 才能得到 `0`。也不能改数邮箱，因为真实员工的邮箱可能为空。[COUNT 的空值处理](https://dev.mysql.com/doc/refman/8.4/en/aggregate-functions.html)

## 5.3 自连接与联合查询

### 自连接：从同一张表中查员工和上级

上级本身也是员工，用员工的 `manager_id` 匹配上级的 `id` 即可：

```sql
SELECT e.name AS employee_name, m.name AS manager_name
FROM employee AS e
LEFT JOIN employee AS m ON m.id = e.manager_id
ORDER BY e.id;
```

| `employee_name` | `manager_name` |
| --------------- | -------------- |
| 林晨            | `NULL`         |
| 周宁            | 林晨           |
| 陈雨            | 林晨           |
| 许安            | `NULL`         |

`e` 和 `m` 分别承担员工、上级两个角色，但来自同一张表，这就是自连接。使用左连接可以保留没有上级的员工。

### 联合查询：把两次查询的结果接在一起

连接把匹配行中的列放到同一行；联合查询把两批结果行接在一起。例如，合并研发部员工名单和薪资至少为 9000 的员工名单：

```sql
SELECT id, name FROM employee WHERE department_id = 1
UNION ALL
SELECT id, name FROM employee WHERE salary >= 9000;
```

两次查询都返回林晨、周宁。`UNION ALL` 保留全部 `4` 行，两人各出现两次；改成 `UNION` 则去重，得到两人各一行。未指定 `ORDER BY` 时，不保证结果顺序。

参与联合的查询需要列数相同，对应列类型兼容。去重针对所选列的整个组合，因此这里保留 `id`，避免同名的不同员工被合并。[UNION 规则](https://dev.mysql.com/doc/refman/8.4/en/union.html)

## 5.4 子查询：把一次查询的结果交给另一次查询 {#_5-4-按子查询返回的形状选用法}

### 返回一个值：谁的薪资高于全体平均薪资

全体员工的平均薪资是 `9000`。把计算平均值的查询嵌入条件，就不必将这个数写死：

```sql
SELECT id, name, salary
FROM employee
WHERE salary > (SELECT AVG(salary) FROM employee)
ORDER BY id;
```

结果只有林晨，薪资为 `12000.00`。括号内的查询给外层提供一个比较值，这种一行一列的子查询叫标量子查询。作为单值使用时，没有返回行得到 `NULL`，返回多行则报错。[标量子查询](https://dev.mysql.com/doc/refman/8.4/en/scalar-subqueries.html)

### 返回一组值：哪些部门有高薪员工

```sql
SELECT id, name
FROM department
WHERE id IN (
    SELECT department_id
    FROM employee
    WHERE salary >= 9000
)
ORDER BY id;
```

子查询返回两行部门编号，都是 `1`。`IN` 判断部门编号是否在这组值中，所以只返回研发部一次。这里不能直接换成 `=`，因为子查询返回了多行。

### 只问有没有：哪些部门没有员工

```sql
SELECT d.id, d.name
FROM department AS d
WHERE NOT EXISTS (
    SELECT 1 FROM employee AS e WHERE e.department_id = d.id
)
ORDER BY d.id;
```

子查询引用外层的 `d.id`，这叫关联子查询。对每个部门，`NOT EXISTS` 要求找不到任何所属员工，因此只有财务部被保留。`EXISTS` 则要求至少找到一行；`SELECT 1` 中的 `1` 只是常量，不是员工编号或计数。[EXISTS 与 NOT EXISTS](https://dev.mysql.com/doc/refman/8.4/en/exists-and-not-exists-subqueries.html)

这个需求也容易被写成 `NOT IN`：

```sql
SELECT id, name
FROM department
WHERE id NOT IN (SELECT department_id FROM employee);
```

但子查询包含许安的空部门编号。即使对财务部，`3 NOT IN (1, 1, 2, NULL)` 也不是真，结果一个部门都查不到。使用 `NOT IN` 前必须处理这些空值；这里用 `NOT EXISTS` 更直接。[IN 与 NOT IN 的空值规则](https://dev.mysql.com/doc/refman/8.4/en/comparison-operators.html)

### 返回一张结果表：先汇总，再查部门名称

放在 `FROM` 中的子查询称为派生表，后续查询可以把它的结果当作表使用：

```sql
SELECT d.name AS department_name, x.employee_count
FROM (
    SELECT department_id, COUNT(*) AS employee_count
    FROM employee
    WHERE department_id IS NOT NULL
    GROUP BY department_id
) AS x
INNER JOIN department AS d ON d.id = x.department_id
ORDER BY d.id;
```

子查询先得到「部门编号 `1`、人数 `2`」和「部门编号 `2`、人数 `1`」，再连接出名称，结果为研发部 `2` 人、运营部 `1` 人。财务部不在子查询的分组结果中，因此不会出现。[派生表](https://dev.mysql.com/doc/refman/8.4/en/derived-tables.html)
