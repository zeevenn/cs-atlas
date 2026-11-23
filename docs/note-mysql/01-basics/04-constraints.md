---
title: "4. 约束"
---

## 4.1 常用规则分别解决什么问题

表结构不只定义列的类型，还可以限制哪些数据允许写入。例如，员工编号不能重复、薪资不能为负、填写的部门必须存在，这些规则都可以交给数据库检查。

| 规则          | 在员工表中的用途               | 说明                                                    |
| ------------- | ------------------------------ | ------------------------------------------------------- |
| `PRIMARY KEY` | 用 `id` 唯一标识员工           | 唯一且非空；一张表只有一个主键，可以包含多列            |
| `UNIQUE`      | 已填写的邮箱不能重复           | 可以有多个唯一索引；MySQL 的单列唯一索引允许多个 `NULL` |
| `NOT NULL`    | 姓名和薪资必须填写             | 不会禁止空字符串或 `0`                                  |
| `CHECK`       | 薪资必须满足 `salary >= 0`     | 拒绝条件为假的记录；条件为未知值时仍可通过              |
| `FOREIGN KEY` | 员工的部门编号必须引用已有部门 | 允许空值的外键列可以填 `NULL`                           |

`DEFAULT` 提供默认值，`AUTO_INCREMENT` 生成自增编号，二者是列属性，不代替上述约束；自增编号也不保证连续。[CREATE TABLE 规则](https://dev.mysql.com/doc/refman/8.4/en/create-table.html)

## 4.2 用约束表达具体规则

第 2 章已经为员工表设置了主键和非空约束。现在补上邮箱唯一、薪资非负、部门引用三条规则：

```sql
ALTER TABLE employee
    ADD CONSTRAINT uq_employee_email UNIQUE (email),
    ADD CONSTRAINT chk_employee_salary CHECK (salary >= 0),
    ADD CONSTRAINT fk_employee_department
        FOREIGN KEY (department_id) REFERENCES department (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE;
```

`CONSTRAINT` 后的名称方便后续识别、修改或删除约束。这段变更执行一次即可；已有数据必须先符合规则，否则增加约束会失败。

约束生效后，下面三条语句都会被拒绝，可以分别执行观察错误：

```sql
-- 林晨已经使用这个邮箱，违反唯一约束
UPDATE employee SET email = 'lin@example.com' WHERE id = 2;

-- 薪资为负，违反检查约束
UPDATE employee SET salary = -1 WHERE id = 2;

-- 初始数据中不存在编号为 99 的部门，违反外键约束
UPDATE employee SET department_id = 99 WHERE id = 2;
```

初始数据中周宁和陈雨的邮箱均为 `NULL`，不违反唯一约束。薪资列则需要同时保留 `NOT NULL` 和 `CHECK (salary >= 0)`：前者禁止缺失，后者禁止负数；只有 `CHECK` 时，空值仍可能通过。[CHECK 规则](https://dev.mysql.com/doc/refman/8.4/en/create-table-check-constraints.html)

**版本差异**：MySQL 从 8.0.16 开始实际执行这里的检查约束；更早版本会解析并忽略有限的 `CHECK` 写法。[MySQL 8.0 版本说明](https://dev.mysql.com/doc/refman/8.0/en/create-table-check-constraints.html)

## 4.3 外键与删除、更新行为

部门表是被引用的父表，员工表是保存外键的子表。许安的部门编号可以为 `NULL`，但不能填一个不存在的编号。

外键还需要规定：父表的记录被删除，或被引用的键发生变更时，子表怎么办？

| 行为                    | 以部门和员工为例                                                      |
| ----------------------- | --------------------------------------------------------------------- |
| `RESTRICT`、`NO ACTION` | 部门仍被员工引用时，拒绝删除部门或修改其被引用的编号；InnoDB 立即检查 |
| `CASCADE`               | 删除部门时连带删除员工，或修改部门编号时同步更新员工的部门编号        |
| `SET NULL`              | 将相关员工的部门编号设为 `NULL`，要求该列允许空值                     |

本章选择 `ON DELETE RESTRICT`，因此研发部仍有员工时不能直接删除；`ON UPDATE CASCADE` 则表示修改部门编号时，同步修改员工表中的引用。选择级联删除前，需要确认删除部门时确实也应该删除员工记录。[外键及引用动作](https://dev.mysql.com/doc/refman/8.4/en/create-table-foreign-keys.html)

```sql
-- 查看表上实际生效的约束
SHOW CREATE TABLE employee;
```

约束保证的是数据库中明确定义的规则。部门编号合法，并不意味着调部门已经经过审批，业务流程仍需由应用保证。
