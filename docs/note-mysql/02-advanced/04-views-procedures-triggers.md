---
title: "4. 视图、存储过程与触发器"
---

## 4.1 视图

视图保存查询定义，读取时根据基础表等对象生成结果，通常不保存独立的查询结果副本。修改可更新视图，实际修改的也是基础表数据。

### 4.1.1 操作语法

本章在练习数据库中使用索引章的 `tb_user`，学生示例另建以下表。对象按顺序创建一次即可，不要在已有业务表上直接执行建表练习。

```sql
CREATE TABLE student (
    id INT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    no VARCHAR(20)
) ENGINE = InnoDB;

INSERT INTO student (id, name, no)
VALUES (1, '林晨', 'S001'), (2, '周宁', 'S002');

CREATE VIEW stu_v_1 AS
SELECT id, name FROM student WHERE id <= 10;
SHOW CREATE VIEW stu_v_1;
SELECT * FROM stu_v_1 ORDER BY id;

CREATE OR REPLACE VIEW stu_v_1 AS
SELECT id, name, no FROM student WHERE id <= 10;
ALTER VIEW stu_v_1 AS
SELECT id, name FROM student WHERE id <= 10;
DROP VIEW stu_v_1;
```

没有检查选项时，通过可插入视图写入的数据可以不满足视图条件：

```sql
CREATE VIEW stu_v_1 AS
SELECT id, name FROM student WHERE id <= 20;

INSERT INTO stu_v_1 (id, name)
VALUES (6, 'Tom'), (17, 'Mary'), (22, 'Bob');
SELECT * FROM stu_v_1 ORDER BY id;
SELECT * FROM student WHERE id = 22;
```

编号 `22` 的学生已经写入基础表，但不会出现在视图中。

![视图筛选与基础表数据](/note-mysql/assets/1683616597885-df5fbd31-9c5e-445c-9bd2-2b16a42fa309.png)

### 4.1.2 检查选项

`WITH CHECK OPTION` 检查通过可更新视图执行的插入、更新，防止修改后的记录违反检查范围内的视图条件。它不是用于限制删除的额外过滤器。

**CASCADED**：检查当前视图，并把级联检查要求递归应用到底层视图，即使底层视图没有声明自己的检查选项。省略 `LOCAL` / `CASCADED` 时，默认使用 `CASCADED`。

![CASCADED 检查范围](/note-mysql/assets/1683616892235-59955aeb-9689-4cff-ae3d-f8435c82f87b.png)

**LOCAL**：检查当前视图，再按底层视图自己的检查选项递归处理。底层视图未声明检查选项时，不会因为当前视图是 `LOCAL` 就强制检查它；但已经声明的底层检查仍然生效。

![LOCAL 检查范围](/note-mysql/assets/1683617191120-fa3c86ca-719c-4e58-ad17-275459d3f024.png)

```sql
CREATE VIEW stu_v_local AS
SELECT id, name FROM stu_v_1 WHERE id >= 10
WITH LOCAL CHECK OPTION;

CREATE VIEW stu_v_cascaded AS
SELECT id, name FROM stu_v_1 WHERE id >= 10
WITH CASCADED CHECK OPTION;

-- stu_v_1 没有检查选项，25 满足当前 LOCAL 视图的条件，可以写入基础表
INSERT INTO stu_v_local (id, name) VALUES (25, 'Local');
SELECT id, name FROM student WHERE id = 25;
```

下面的写入则会失败，因为级联检查还要求满足底层的 `id <= 20`：

```sql
-- 预期报错：CHECK OPTION failed
INSERT INTO stu_v_cascaded (id, name) VALUES (26, 'Cascaded');
```

若为底层 `stu_v_1` 增加检查选项，之后经由 `stu_v_local` 的写入也必须满足那个底层检查。[视图检查选项](https://dev.mysql.com/doc/refman/8.4/en/view-check-option.html)

### 4.1.3 视图的更新

可更新性取决于视图与基础表之间是否存在可明确映射的记录和列。含以下结构的视图通常不能直接更新：

- 聚合函数或窗口函数，例如 `SUM()`、`COUNT()`。
- `DISTINCT`、`GROUP BY`、`HAVING`。
- `UNION`、`UNION ALL` 等集合运算。

连接视图在特定条件下也可能更新部分基础表，所以不能简单认为「所有多表视图都不能更新」。可插入还需要满足基础表必填列等要求。[可更新与可插入视图](https://dev.mysql.com/doc/refman/8.4/en/view-updatability.html)

### 4.1.4 视图的作用

- **简化查询**：封装常用连接与筛选逻辑。
- **控制可见范围**：通过列选择和行条件暴露部分数据，并配合视图权限、`SQL SECURITY` 和基础表权限管理。
- **稳定查询接口**：基础表调整后，可以在视图中使用别名等方式维持对外字段，但需要维护视图定义。

MySQL 本身支持列级授权；视图并不是因为数据库「不能给列授权」才有安全作用。若用户仍有直接读取基础表的权限，就能绕过视图的可见范围。

### 4.1.5 案例演示

隐藏手机号、邮箱等列：

```sql
CREATE VIEW tb_user_v AS
SELECT id, name, profession, age, gender, status, createtime FROM tb_user;
SELECT * FROM tb_user_v ORDER BY id;
```

将学生与课程的连接封装为视图：

```sql
CREATE TABLE course (id INT PRIMARY KEY, name VARCHAR(50) NOT NULL);
CREATE TABLE student_course (
    studentid INT NOT NULL,
    courseid INT NOT NULL,
    PRIMARY KEY (studentid, courseid)
);
INSERT INTO course VALUES (1, '数据库'), (2, '操作系统');
INSERT INTO student_course VALUES (1, 1), (1, 2), (2, 1);

CREATE VIEW tb_stu_course_view AS
SELECT s.name AS student_name, s.no AS student_no, c.name AS course_name
FROM student AS s
INNER JOIN student_course AS sc ON sc.studentid = s.id
INNER JOIN course AS c ON c.id = sc.courseid;
SELECT * FROM tb_stu_course_view ORDER BY student_no, course_name;
```

![视图查询示例](/note-mysql/assets/1683618470625-a1709695-096e-44d6-b9ae-fb06ba70714c.png)

## 4.2 存储过程

存储过程把一组 SQL 保存在服务器端，通过 `CALL` 调用。它可以封装业务步骤并减少网络往返，但不会自动让复杂 SQL 更快，也不会自动把全部操作放进一笔事务。

![存储过程](/note-mysql/assets/1683620441606-7ef1ad53-51f4-4e76-ac3f-429f4c3476f3.png)

### 4.2.1 基本语法

MySQL 命令行客户端默认用分号判断语句结束。创建含多条语句的程序时，先用客户端指令 `DELIMITER` 临时改变结束符；它不是发给服务器执行的 SQL。通过驱动或其他工具创建时，要遵循该工具的提交方式。

```sql
DELIMITER $$
CREATE PROCEDURE p1()
BEGIN
    SELECT COUNT(*) AS student_count FROM student;
END$$
DELIMITER ;

CALL p1();
SHOW CREATE PROCEDURE p1;
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = DATABASE();
DROP PROCEDURE p1;
```

`BEGIN ... END` 表示程序块，不等于 `START TRANSACTION`。创建、执行程序分别需要相应权限。[存储程序定义](https://dev.mysql.com/doc/refman/8.4/en/stored-programs-defining.html)

### 4.2.2 变量

#### 系统变量

```sql
SHOW SESSION VARIABLES LIKE 'group_concat_max_len';
SELECT @@session.group_concat_max_len, @@global.group_concat_max_len;
SET SESSION group_concat_max_len = 8192;
```

会话变量影响当前连接。对兼有全局和会话作用域的变量，修改全局默认值通常影响以后建立的连接，不直接覆盖已有连接的会话值。部分变量只读或只有全局作用域，不能套用同一种设置方法。

`SET GLOBAL` 的动态修改通常不会跨重启保存；持久化可通过配置文件或适用变量的 `SET PERSIST` 完成，需要相应管理权限。[系统变量](https://dev.mysql.com/doc/refman/8.4/en/using-system-variables.html)

#### 用户自定义变量

用户变量以 `@` 开头，作用域是当前连接，不用提前声明；未赋值时为 `NULL`。

```sql
SET @student_count = 0;
SELECT COUNT(*) INTO @student_count FROM student;
SELECT @student_count;
```

优先用 `SET` 或 `SELECT ... INTO` 赋值，避免依赖同一表达式中用户变量赋值与读取的求值顺序。

#### 局部变量

局部变量用 `DECLARE` 在程序块开头声明，作用域限于对应程序块。声明应位于游标、处理器和可执行语句之前，并遵守各类声明的顺序。

```sql
DELIMITER $$
CREATE PROCEDURE p2()
BEGIN
    DECLARE stu_count INT DEFAULT 0;
    SELECT COUNT(*) INTO stu_count FROM student;
    SELECT stu_count;
END$$
DELIMITER ;
CALL p2();
```

### 4.2.3 IF

程序中的条件分支以 `END IF` 结束，中间分支写作 `ELSEIF`：

```sql
DELIMITER $$
CREATE PROCEDURE p3()
BEGIN
    DECLARE score INT DEFAULT 58;
    DECLARE result VARCHAR(10);
    IF score >= 85 THEN
        SET result = '优秀';
    ELSEIF score >= 60 THEN
        SET result = '及格';
    ELSE
        SET result = '不及格';
    END IF;
    SELECT result;
END$$
DELIMITER ;
CALL p3();
```

这个例子返回 `'不及格'`。它与查询表达式中的 `IF(condition, a, b)` 是不同语法。

### 4.2.4 参数

| 参数    | 用途                           |
| ------- | ------------------------------ |
| `IN`    | 输入参数，默认模式             |
| `OUT`   | 输出参数                       |
| `INOUT` | 读取传入值，并将修改后的值返回 |

把上例的分数改成输入参数，并用输出参数接收结果：

```sql
DELIMITER $$
CREATE PROCEDURE p4(IN score INT, OUT result VARCHAR(10))
BEGIN
    IF score IS NULL OR score < 0 OR score > 100 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'score must be 0..100';
    END IF;
    IF score >= 85 THEN
        SET result = '优秀';
    ELSEIF score >= 60 THEN
        SET result = '及格';
    ELSE
        SET result = '不及格';
    END IF;
END$$
DELIMITER ;
CALL p4(85, @result);
SELECT @result;
```

`INOUT` 示例把 200 分制换算成百分制：

```sql
DELIMITER $$
CREATE PROCEDURE p5(INOUT score DECIMAL(6, 2))
BEGIN
    IF score IS NULL OR score < 0 OR score > 200 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'score must be 0..200';
    END IF;
    SET score = score / 2;
END$$
DELIMITER ;
SET @score = 198;
CALL p5(@score);
SELECT @score;
```

结果分别为 `'优秀'`、`99.00`。

### 4.2.5 CASE

程序中的 `CASE` 以 `END CASE` 结束，每个分支执行语句；查询中的 `CASE` 表达式则以 `END` 结束并返回一个值。

以下例子按月份判断季度，避免把季度与不同地区的季节划分混用：

```sql
DELIMITER $$
CREATE PROCEDURE p6(IN p_month INT)
BEGIN
    DECLARE result VARCHAR(10);
    CASE
        WHEN p_month BETWEEN 1 AND 3 THEN SET result = '第一季度';
        WHEN p_month BETWEEN 4 AND 6 THEN SET result = '第二季度';
        WHEN p_month BETWEEN 7 AND 9 THEN SET result = '第三季度';
        WHEN p_month BETWEEN 10 AND 12 THEN SET result = '第四季度';
        ELSE SET result = '非法输入';
    END CASE;
    SELECT result;
END$$
DELIMITER ;
CALL p6(3);
```

### 4.2.6 WHILE

`WHILE` 先判断条件，再执行循环。以下例子计算从 `1` 到非负整数 `n` 的和，`n = 0` 时返回 `0`：

```sql
DELIMITER $$
CREATE PROCEDURE p7(IN n INT)
BEGIN
    DECLARE total BIGINT DEFAULT 0;
    IF n IS NULL OR n < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'n must be nonnegative';
    END IF;
    WHILE n > 0 DO
        SET total = total + n;
        SET n = n - 1;
    END WHILE;
    SELECT total;
END$$
DELIMITER ;
CALL p7(100);
```

### 4.2.7 REPEAT

`REPEAT` 先执行循环体，直到 `UNTIL` 条件为真才退出。零次累加需要在进入循环前单独判断：

```sql
DELIMITER $$
CREATE PROCEDURE p8(IN n INT)
BEGIN
    DECLARE total BIGINT DEFAULT 0;
    IF n IS NULL OR n < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'n must be nonnegative';
    END IF;
    IF n > 0 THEN
        REPEAT
            SET total = total + n;
            SET n = n - 1;
        UNTIL n = 0
        END REPEAT;
    END IF;
    SELECT total;
END$$
DELIMITER ;
CALL p8(100);
```

两种循环在 `n = 100` 时都返回 `5050`。计数范围较大时，应评估循环成本及数值类型是否足够。

### 4.2.8 LOOP

`LOOP` 本身没有退出条件，用 `LEAVE` 退出指定块或循环，用 `ITERATE` 跳到指定循环的下一轮。下面演示跳过偶数并累加小于 `5` 的正奇数：

```sql
DELIMITER $$
CREATE PROCEDURE p9()
BEGIN
    DECLARE n INT DEFAULT 0;
    DECLARE total INT DEFAULT 0;
    number_loop: LOOP
        SET n = n + 1;
        IF n >= 5 THEN LEAVE number_loop; END IF;
        IF MOD(n, 2) = 0 THEN ITERATE number_loop; END IF;
        SET total = total + n;
    END LOOP number_loop;
    SELECT total;
END$$
DELIMITER ;
CALL p9();
```

结果为 `4`。[存储程序流程控制](https://dev.mysql.com/doc/refman/8.4/en/flow-control-statements.html)

## 4.3 存储函数

存储函数通过 `RETURN` 返回单个值，可以用于表达式；它不是「把存储过程加一个返回值」就可以随意互换，函数的参数和可执行语句有额外限制。

```sql
DELIMITER $$
CREATE FUNCTION half_score(score DECIMAL(6, 2))
RETURNS DECIMAL(6, 2)
DETERMINISTIC
NO SQL
BEGIN
    RETURN score / 2;
END$$
DELIMITER ;
SELECT half_score(198);
```

`DETERMINISTIC` 声明相同输入产生相同结果；`NO SQL`、`READS SQL DATA` 等用于声明数据访问特征。它们不是由 MySQL 自动证明的性质，必须符合函数实际行为。启用二进制日志时，创建函数还受权限和相关配置限制。[存储过程与函数语法](https://dev.mysql.com/doc/refman/8.4/en/create-procedure.html)

## 4.4 触发器

### 4.4.1 介绍 {#_4-1-介绍}

触发器在指定表发生 `INSERT`、`UPDATE`、`DELETE` 时，按 `BEFORE` 或 `AFTER` 时机自动逐行执行。MySQL 使用行级触发器；`TRUNCATE TABLE` 不会触发 `DELETE` 触发器。

| 事件     | 可引用的记录 |
| -------- | ------------ |
| `INSERT` | `NEW`        |
| `UPDATE` | `OLD`、`NEW` |
| `DELETE` | `OLD`        |

![OLD 与 NEW 的适用事件](/note-mysql/assets/1683784221876-a77c4018-4bf1-4b7c-93aa-34a8b14ffa4b.png)

### 4.4.2 语法 {#_4-2-语法}

创建时指定触发器名、时机、事件、表和 `FOR EACH ROW`；触发器体包含多条语句时，也需正确处理客户端结束符。

```sql
SHOW TRIGGERS;
```

删除使用 `DROP TRIGGER 触发器名`。InnoDB 上触发器的修改与触发它的语句属于同一事务；不能把触发器当成独立提交的审计通道。[触发器规则](https://dev.mysql.com/doc/refman/8.4/en/trigger-syntax.html)

### 4.4.3 案例 {#_4-3-案例}

下面只演示记录插入事件。用 `JSON_OBJECT()` 保存参数，可以保留空值的含义，避免 `CONCAT()` 因某列为空而把整段日志变为 `NULL`。

```sql
CREATE TABLE user_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    operation VARCHAR(10) NOT NULL,
    operate_time DATETIME(6) NOT NULL,
    operate_id INT NOT NULL,
    operate_params JSON NOT NULL
) ENGINE = InnoDB;

DELIMITER $$
CREATE TRIGGER tb_user_insert_trigger
AFTER INSERT ON tb_user FOR EACH ROW
BEGIN
    INSERT INTO user_logs (operation, operate_time, operate_id, operate_params)
    VALUES ('insert', NOW(6), NEW.id,
            JSON_OBJECT('id', NEW.id, 'name', NEW.name,
                        'phone', NEW.phone, 'email', NEW.email,
                        'profession', NEW.profession));
END$$
DELIMITER ;

START TRANSACTION;
INSERT INTO tb_user (id, name, phone, email, profession, age, gender, status, createtime)
VALUES (26, '示例用户', '18800000000', NULL, '软件工程', 23, '1', '1', NOW());
SELECT operation, operate_id, operate_params FROM user_logs ORDER BY id;
ROLLBACK;
```

回滚后，新员工和本次触发器写入的日志都会撤销。对更新、删除事件记录日志时，再分别使用对应事件允许的 `OLD` / `NEW` 数据。

![旧环境中的插入触发器示例](/note-mysql/assets/1683784864548-4f27a583-bd4b-4e7e-b872-4792fc4569f0.png)
