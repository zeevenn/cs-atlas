---
title: "6. 事务"
---

## 6.1 事务及 ACID

一次调薪要求同时修改两名员工的薪资。如果第一条修改成功，第二条失败，不能留下只改了一人的结果。事务将这组操作作为一个整体：全部成功后提交，失败时回滚。

| 特性                  | 含义                                                       |
| --------------------- | ---------------------------------------------------------- |
| 原子性（Atomicity）   | 同一事务的修改作为整体提交或撤销                           |
| 一致性（Consistency） | 事务前后满足数据与业务规则，仍需要正确的业务逻辑配合       |
| 隔离性（Isolation）   | 按隔离级别约束并发事务间的数据可见性和相互影响             |
| 持久性（Durability）  | 提交后的修改持久保存，具体故障保证还受日志、存储和配置影响 |

这四项通常简称 ACID。本章以 InnoDB 表为前提；隔离性并不表示事务之间完全没有影响，也可能发生锁等待。[InnoDB 与 ACID](https://dev.mysql.com/doc/refman/8.4/en/mysql-acid.html)

## 6.2 自动提交、提交与回滚

MySQL 默认启用 `autocommit`，未显式开启事务时，每条成功的修改语句会单独提交。使用 `START TRANSACTION`，才能把后续多条语句放进同一事务：

```sql
SELECT @@session.autocommit;

START TRANSACTION;

UPDATE employee SET salary = salary + 500 WHERE id = 1;
UPDATE employee SET salary = salary + 500 WHERE id = 2;

SELECT id, name, salary
FROM employee
WHERE id IN (1, 2)
ORDER BY id;

-- 练习时撤销修改，保留初始数据；需要保存时改用 COMMIT
ROLLBACK;
```

事务内可以看到林晨、周宁的薪资变为 `12500.00`、`9500.00`，回滚后恢复为 `12000.00`、`9000.00`。

**`COMMIT` 保存，`ROLLBACK` 撤销，二者选其一结束事务。** 已经自动提交或显式提交的修改，不能再用 `ROLLBACK` 撤销。[事务控制](https://dev.mysql.com/doc/refman/8.4/en/commit.html)

## 6.3 并发读取会遇到什么问题

当两个连接同时操作数据时，需要区分三种现象：

| 问题       | 场景                                                                               |
| ---------- | ---------------------------------------------------------------------------------- |
| 脏读       | 事务 A 读到事务 B 尚未提交的薪资；B 随后回滚，A 读到的数据从未生效                 |
| 不可重复读 | A 在同一事务中两次读周宁的薪资，B 在中间修改并提交，A 两次读到不同值               |
| 幻读       | A 在同一事务中两次查询研发部员工，B 在中间插入员工并提交，A 两次得到的员工集合不同 |

不可重复读侧重同一行的值发生变化，幻读侧重符合查询条件的行集合发生变化。是否出现这些现象，与隔离级别及读取方式有关。

## 6.4 隔离级别与 InnoDB 的实现

| 隔离级别           | 普通查询的主要行为                                                    |
| ------------------ | --------------------------------------------------------------------- |
| `READ UNCOMMITTED` | 可能读到其他事务尚未提交的修改                                        |
| `READ COMMITTED`   | 每次一致性读建立新快照，能看到此前已提交的修改                        |
| `REPEATABLE READ`  | InnoDB 默认级别；同一事务内的一致性读通常复用第一次一致性读建立的快照 |
| `SERIALIZABLE`     | 隔离更严格；显式事务中的普通查询会转为共享锁读取，可能增加等待        |

一致性读通过数据快照读取某个时点的版本。例如，在 `REPEATABLE READ` 下，即使其他事务后来提交了修改，当前事务的普通查询仍可以读到原版本。[InnoDB 隔离级别](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html)

用两个连接验证。连接 A 先设置隔离级别，两个连接都选择 `atlas_demo` 数据库：

```sql
-- 在连接 A 中、开启事务前执行
SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;
SELECT @@session.transaction_isolation;
```

按下表顺序交替执行；开始时周宁的薪资应为 `9000.00`：

| 步骤 | 连接 A                                                                                | 连接 B                                                                                      |
| ---- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1    | `START TRANSACTION;` 然后 `SELECT salary FROM employee WHERE id = 2;`，得到 `9000.00` | —                                                                                           |
| 2    | —                                                                                     | `START TRANSACTION;` 然后 `UPDATE employee SET salary = 9500 WHERE id = 2;`，最后 `COMMIT;` |
| 3    | 再次执行相同的 `SELECT`，仍得到 `9000.00`                                             | —                                                                                           |
| 4    | `COMMIT;`，结束当前事务                                                               | —                                                                                           |

若将 A 的隔离级别改为 `READ COMMITTED`，在恢复初始数据后重做实验，第 3 步会读到 `9500.00`。每轮结束后，在 B 中恢复薪资：

```sql
START TRANSACTION;
UPDATE employee SET salary = 9000 WHERE id = 2;
COMMIT;
```

普通 `START TRANSACTION` 本身不建立读快照，上例在第一次一致性读时建立；当前事务自己的修改仍然可见。[一致性非锁定读](https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html)

`SELECT ... FOR UPDATE` 是锁定读，读取最新可用的数据并加锁，必要时等待其他事务释放锁，不能套用上面的快照结果。`UPDATE`、`DELETE` 也不只是修改旧快照中的数据。锁与范围查询的细节见 [进阶篇：锁](../02-advanced/05-locks.md)。[锁定读规则](https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html)

## 6.5 事务边界的两个陷阱

**语句失败，不代表整笔事务已经回滚。** 唯一键冲突通常只撤销出错的语句，之前的修改仍在事务中；应用应处理错误并明确结束事务。死锁则会使 InnoDB 回滚其中一个事务，重试需要重新执行整笔事务。[InnoDB 错误处理](https://dev.mysql.com/doc/refman/8.4/en/innodb-error-handling.html)

**普通 DDL 不能当作可回滚的数据修改。** `ALTER TABLE`、`DROP TABLE`、`TRUNCATE TABLE` 等会隐式提交。原子 DDL 保证的是 DDL 自身的完整执行，不代表用户能事后用 `ROLLBACK` 撤销。[隐式提交语句](https://dev.mysql.com/doc/refman/8.4/en/implicit-commit.html)
