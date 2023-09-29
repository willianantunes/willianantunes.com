---
id: a1373370-5e53-11ee-94c7-cf2a83f67466
title: Understanding Read Phenomena by Practice with MariaDB and PostgreSQL
date: 2023-09-28T23:06:17.544Z
cover: /assets/posts/blog-38-understanding-read-phenomena-by-practice-with-mariadb-and-postgresql.png
description: Read phenomena is a must-know topic if you design an application
  that uses a database. Read many articles but didn't understand them? Let's
  learn by practice, then.
tags:
  - django
  - postgresql
  - mariadb
  - acid
---
**Warning:** This is a note, so don't expect much 😅!

Let's see each read phenomenon, starting with MariaDB and then PostgreSQL. I'll cover the very basics of isolation by practice, also. That's crucial for an application developer to understand. For example, suppose you are designing a new application with a context where concurrency may lead to an inconsistent state of its data. In that case, an appropriate [database isolation](https://en.wikipedia.org/wiki/Isolation_(database_systems)) can help you. Check out the table below about *isolation levels vs read phenomena*. We'll explore each one.

| Isolation Level  | Dirty Read             | Nonrepeatable Read | Phantom Read           | Serialization Anomaly |
| ---------------- | ---------------------- | ------------------ | ---------------------- | --------------------- |
| Read uncommitted | Allowed, but not in PG | Possible           | Possible               | Possible              |
| Read committed   | Not possible           | Possible           | Possible               | Possible              |
| Repeatable read  | Not possible           | Not possible       | Allowed, but not in PG | Possible              |
| Serializable     | Not possible           | Not possible       | Not possible           | Not possible          |

A quick notice: When you see a `TX #NUMBER`, you must open a terminal with a CLI that connects with the target database. [Download the project](https://github.com/willianantunes/tutorials/tree/master/2023/09/database_isolation) so you can execute the commands by yourself.

## Understanding read phenomena in MariaDB

You can start the service with the following command:

```shell
docker-compose up db-mariadb
```

When it's up and running, you can issue the following in another terminal:

```shell
docker-compose run terminal-mariadb
```

Then connect to the database instance using [MariaDB CLI](https://mariadb.com/kb/en/mysql-command-line-client/):

```shell
mariadb -u root -p'root' \
-h db-mariadb -P 3306 \
-D development
```

It's worth mentioning that the isolation level in MariaDB is `REPEATABLE READ` by default. Know more in the [knowledge base](https://mariadb.com/kb/en/mariadb-transactions-and-isolation-levels-for-sql-server-users/#isolation-levels-and-locks).

### Dirty read

It's when you read a row that has not been committed yet by another transaction. What if the other transaction executes rollback while your transaction continues processing using it? This is the typical scenario for the dirty read.

TX 1:

```sql
SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
BEGIN;
SELECT * FROM `core_account` WHERE `core_account`.`username` = 'ysullivan';
```

Output:

```text
+----------------------------------+----------------------------+----------------------------+-----------+-----------+
| id                               | created_at                 | updated_at                 | username  | balance   |
+----------------------------------+----------------------------+----------------------------+-----------+-----------+
| bad19496526b4cf3831ad4a8244eecf1 | 2023-09-22 00:20:55.377114 | 2023-09-22 00:20:55.377144 | ysullivan | 1000.0000 |
+----------------------------------+----------------------------+----------------------------+-----------+-----------+
```

TX 2:

```sql
BEGIN;
UPDATE core_account SET balance = 1001.0000 WHERE username = 'ysullivan';
```

TX 1:

```
SELECT * FROM `core_account` WHERE `core_account`.`username` = 'ysullivan';
```

You'll get `1001`, though the TX 2 hasn't been committed yet:

```text
+----------------------------------+----------------------------+----------------------------+-----------+-----------+
| id                               | created_at                 | updated_at                 | username  | balance   |
+----------------------------------+----------------------------+----------------------------+-----------+-----------+
| bad19496526b4cf3831ad4a8244eecf1 | 2023-09-22 00:20:55.377114 | 2023-09-22 00:20:55.377144 | ysullivan | 1001.0000 |
+----------------------------------+----------------------------+----------------------------+-----------+-----------+
```

You can run rollback in both transactions by executing `ROLLBACK;`.

### Non-repeatable read

TX 1:

```sql
SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
BEGIN;
SELECT SUM(balance) FROM core_account;
```

Output:

```text
+--------------+
| SUM(balance) |
+--------------+
|   55000.0000 |
+--------------+
```

TX 2:

```sql
BEGIN;
UPDATE core_account SET balance = 1001.0000 WHERE username = 'ysullivan';
COMMIT;
```

TX 1:

```sql
SELECT SUM(balance) FROM core_account;
```

You don't get `55000`, but `55001`, actually. This is not a `dirty read` because TX 2 committed its data. We query and receive a certain value, and when we repeat the exact same query, it gives you another value. Thus, the phenomena name `non-repeatable read`.

Output:

```text
+--------------+
| SUM(balance) |
+--------------+
|   55001.0000 |
+--------------+
```

### Phantom read

TX 1:

```sql
SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
BEGIN;
SELECT COUNT(*), SUM(balance) FROM core_account;
```

Output:

```text
+----------+--------------+
| COUNT(*) | SUM(balance) |
+----------+--------------+
|       10 |   55001.0000 |
+----------+--------------+
```

TX 2:

```sql
BEGIN;
INSERT INTO `core_account` (id, created_at, updated_at, username, balance) VALUES ('735d45b06a174b34bf14b04b0cf6bd27',CURRENT_TIMESTAMP(6),CURRENT_TIMESTAMP(6),'willianantunes',50.0000);
COMMIT;
```

TX 1:

```sql
SELECT COUNT(*), SUM(balance) FROM core_account;
```

We get `11` rows and `55051` when it should be `10` rows and `55001`. One row has been added by another committed transaction, though when `TX 1` started, it didn't have this extra row. That's why it's phantom. 

```text
+----------+--------------+
| COUNT(*) | SUM(balance) |
+----------+--------------+
|       11 |   55051.0000 |
+----------+--------------+
```

### Lost updates

You have to do the commands quickly to reproduce the `lost update` phenomena. If you delay doing so, you'll notice that the TX 2 SQL will block during the update statement until, eventually, it receives the error `ERROR 1205 (HY000): Lock wait timeout exceeded; try restarting transaction`.

We are not specifying the isolation level. So, it will be [REPEATABLE READ](https://mariadb.com/kb/en/set-transaction/#repeatable-read) by default. Check it by executing the command `SELECT @@global.transaction_ISOLATION;`. By the way, repeatable read should not accept lost updates, but [this seems not to be true in MySQL/MariaDB](https://stackoverflow.com/a/10428319/3899136).

TX 1:

```sql
BEGIN;
-- At this point the balance is 1001.0000. In case it's not:
-- UPDATE core_account SET balance = 1001.0000 WHERE username = 'ysullivan';
UPDATE core_account SET balance = balance - 1000.0000 WHERE username = 'ysullivan';
SELECT balance FROM core_account WHERE username = 'ysullivan';
```

Output:

```text
+---------+
| balance |
+---------+
|  1.0000 |
+---------+
```

TX 2:

```sql
BEGIN;
SELECT balance FROM core_account WHERE username = 'ysullivan';
-- The statement below will block, so proceed with the next step as quickly as possible! 
UPDATE core_account SET balance = balance - 501.0000 WHERE username = 'ysullivan';
```

As the output is `1001.0000`, the update statement should result in a balance of `500.0000` in the end. Will it be? Let's see the output before the update statement:

```text
+-----------+
| balance   |
+-----------+
| 1001.0000 |
+-----------+
```

TX 1:

```sql
COMMIT;
SELECT balance FROM core_account WHERE username = 'ysullivan';
```

Output:

```text
+---------+
| balance |
+---------+
|  1.0000 |
+---------+
```

TX 2:

```sql
COMMIT;
SELECT balance FROM core_account WHERE username = 'ysullivan';
```

TX 2's update is lost, and in the end, we have a negative balance 😱:

```text
+-----------+
| balance   |
+-----------+
| -500.0000 |
+-----------+
```

## Understanding read phenomena in PostgreSQL

You start with the following command:

```shell
docker-compose up db-postgresql
```

When it's up and running, you can issue the following in another terminal:

```shell
docker-compose run terminal-postgresql
```

Then connect to the database instance using [PostgreSQL CLI](https://www.postgresql.org/docs/16/index.html):

```shell
psql postgresql://postgres:postgres@db-postgresql:5432/postgres
```

The default isolation level in PostgreSQL is `READ COMMITTED`. Know more in [its guide](https://www.postgresql.org/docs/16/transaction-iso.html).

### Dirty read

It doesn't happen on any isolation level. If we look at the [SET TRANSACTION guide](https://www.postgresql.org/docs/16/sql-set-transaction.html), it says the following:

> The SQL standard defines one additional level, READ UNCOMMITTED. In PostgreSQL READ UNCOMMITTED is treated as READ COMMITTED.

### Non-repeatable read

TX 1:

```sql
BEGIN;
SELECT SUM(balance) FROM core_account;
```

Output:

```text
    sum     
------------
 55000.0000
```

TX 2:

```sql
BEGIN;
UPDATE core_account SET balance = balance + 1 WHERE username = 'ysullivan';
COMMIT;
```

TX 1:

```sql
SELECT SUM(balance) FROM core_account;
```

You don't get `55000`, but `55001`, actually. If we want to fix it, we can start the first transaction with `BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;`.

Output:

```text
    sum     
------------
 55001.0000
```

### Phantom read

TX 1:

```sql
BEGIN;
SELECT COUNT(*), SUM(balance) FROM core_account;
```

Output:

```text
 count |    sum     
-------+------------
    10 | 55001.0000
```

TX 2:

```sql
BEGIN;
INSERT INTO core_account (id, created_at, updated_at, username, balance) VALUES (gen_random_uuid(),CURRENT_TIMESTAMP(6),CURRENT_TIMESTAMP(6),'willianantunes',50.0000);
COMMIT;
```

TX 1:

```sql
SELECT COUNT(*), SUM(balance) FROM core_account;
```

We get `11` rows and `55051` when it should be `10` rows and `55001`. In PostgreSQL, you can fix it by starting the first transaction with the command `BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;`. PostgreSQL uses [snapshot](https://en.wikipedia.org/wiki/Snapshot_isolation). That's why you don't get phantom reads from it.

```text
 count |    sum     
-------+------------
    11 | 55051.0000
```

### Lost updates

TX 1:

```sql
BEGIN;
-- At this point the balance is 1001.0000. In case it's not:
-- UPDATE core_account SET balance = 1001.0000 WHERE username = 'ysullivan';
UPDATE core_account SET balance = balance - 1000.0000 WHERE username = 'ysullivan';
SELECT balance FROM core_account WHERE username = 'ysullivan';
```

Output:

```text
 balance 
---------
  1.0000
```

TX 2:

```sql
BEGIN;
SELECT balance FROM core_account WHERE username = 'ysullivan';
-- The statement below will block, so proceed with the next step as quickly as possible! 
UPDATE core_account SET balance = balance - 501.0000 WHERE username = 'ysullivan';
```

As the output is `1001`, the update statement should result in a balance of `500.0000` in the end. Will it be? Let's see the output before the update statement:

```text
+-----------+
| balance   |
+-----------+
| 1001.0000 |
+-----------+
```

TX 1:

```sql
COMMIT;
SELECT balance FROM core_account WHERE username = 'ysullivan';
```

Output:

```text
+---------+
| balance |
+---------+
|  1.0000 |
+---------+
```

TX 2:

```sql
COMMIT;
SELECT balance FROM core_account WHERE username = 'ysullivan';
```

TX 2's update is lost, and in the end, we have a negative balance 😱. To fix it, we can start the second transaction with `BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;`. When TX 1 executes the commit, TX 2's terminal will return `ERROR: could not serialize access due to concurrent update`.

```text
  balance  
-----------
 -500.0000
```

By the way, after executing the first transaction, if you run the following query:

```sql
SELECT activity.*, pl.*, pg_blocking_pids(activity.pid) FROM pg_stat_activity activity
    INNER JOIN pg_locks pl on activity.backend_xid = pl.transactionid
WHERE activity.usename = 'postgres' and activity.backend_xid IS NOT NULL
ORDER BY query_start;
```

You'll get something like this:

```text
+-----+--------+---+----------+--------+--------+----------------+-----------+---------------+-----------+---------------------------------+---------------------------------+---------------------------------+---------------------------------+---------------+----------+-------------------+-----------+------------+--------+--------------------------------------------------------------+--------------+-------------+--------+--------+----+-----+----------+-------------+-------+-----+--------+------------------+---+-------------+-------+--------+---------+----------------+
|datid|datname |pid|leader_pid|usesysid|usename |application_name|client_addr|client_hostname|client_port|backend_start                    |xact_start                       |query_start                      |state_change                     |wait_event_type|wait_event|state              |backend_xid|backend_xmin|query_id|query                                                         |backend_type  |locktype     |database|relation|page|tuple|virtualxid|transactionid|classid|objid|objsubid|virtualtransaction|pid|mode         |granted|fastpath|waitstart|pg_blocking_pids|
+-----+--------+---+----------+--------+--------+----------------+-----------+---------------+-----------+---------------------------------+---------------------------------+---------------------------------+---------------------------------+---------------+----------+-------------------+-----------+------------+--------+--------------------------------------------------------------+--------------+-------------+--------+--------+----+-----+----------+-------------+-------+-----+--------+------------------+---+-------------+-------+--------+---------+----------------+
|5    |postgres|110|null      |10      |postgres|psql            |172.27.0.3 |null           |59832      |2023-09-28 22:04:09.196351 +00:00|2023-09-28 22:14:52.353457 +00:00|2023-09-28 22:14:52.354163 +00:00|2023-09-28 22:14:52.354369 +00:00|Client         |ClientRead|idle in transaction|839        |null        |null    |SELECT balance FROM core_account WHERE username = 'ysullivan';|client backend|transactionid|null    |null    |null|null |null      |839          |null   |null |null    |4/3               |110|ExclusiveLock|true   |false   |null     |                |
+-----+--------+---+----------+--------+--------+----------------+-----------+---------------+-----------+---------------------------------+---------------------------------+---------------------------------+---------------------------------+---------------+----------+-------------------+-----------+------------+--------+--------------------------------------------------------------+--------------+-------------+--------+--------+----+-----+----------+-------------+-------+-----+--------+------------------+---+-------------+-------+--------+---------+----------------+
```

Notice the lock mode is `ExclusiveLock`, which is a *Table-Level Lock Mode* [according to the documentation](https://www.postgresql.org/docs/16/explicit-locking.html):

> **EXCLUSIVE (ExclusiveLock)**: Conflicts with the ROW SHARE, ROW EXCLUSIVE, SHARE UPDATE EXCLUSIVE, SHARE, SHARE ROW EXCLUSIVE, EXCLUSIVE, and ACCESS EXCLUSIVE lock modes. This mode allows only concurrent ACCESS SHARE locks, i.e., only reads from the table can proceed in parallel with a transaction holding this lock mode.

If we execute the TX 2 transaction and recheck `pg_stat_activity` and `pg_locks`, you'll see:

```text
+-----+--------+---+----------+--------+--------+----------------+-----------+---------------+-----------+---------------------------------+---------------------------------+---------------------------------+---------------------------------+---------------+-------------+-------------------+-----------+------------+--------+----------------------------------------------------------------------------------+--------------+-------------+--------+--------+----+-----+----------+-------------+-------+-----+--------+------------------+---+-------------+-------+--------+---------------------------------+----------------+
|datid|datname |pid|leader_pid|usesysid|usename |application_name|client_addr|client_hostname|client_port|backend_start                    |xact_start                       |query_start                      |state_change                     |wait_event_type|wait_event   |state              |backend_xid|backend_xmin|query_id|query                                                                             |backend_type  |locktype     |database|relation|page|tuple|virtualxid|transactionid|classid|objid|objsubid|virtualtransaction|pid|mode         |granted|fastpath|waitstart                        |pg_blocking_pids|
+-----+--------+---+----------+--------+--------+----------------+-----------+---------------+-----------+---------------------------------+---------------------------------+---------------------------------+---------------------------------+---------------+-------------+-------------------+-----------+------------+--------+----------------------------------------------------------------------------------+--------------+-------------+--------+--------+----+-----+----------+-------------+-------+-----+--------+------------------+---+-------------+-------+--------+---------------------------------+----------------+
|5    |postgres|110|null      |10      |postgres|psql            |172.27.0.3 |null           |59832      |2023-09-28 22:04:09.196351 +00:00|2023-09-28 22:14:52.353457 +00:00|2023-09-28 22:14:52.354163 +00:00|2023-09-28 22:14:52.354369 +00:00|Client         |ClientRead   |idle in transaction|839        |null        |null    |SELECT balance FROM core_account WHERE username = 'ysullivan';                    |client backend|transactionid|null    |null    |null|null |null      |839          |null   |null |null    |3/9               |109|ShareLock    |false  |false   |2023-09-28 22:15:10.146125 +00:00|                |
|5    |postgres|110|null      |10      |postgres|psql            |172.27.0.3 |null           |59832      |2023-09-28 22:04:09.196351 +00:00|2023-09-28 22:14:52.353457 +00:00|2023-09-28 22:14:52.354163 +00:00|2023-09-28 22:14:52.354369 +00:00|Client         |ClientRead   |idle in transaction|839        |null        |null    |SELECT balance FROM core_account WHERE username = 'ysullivan';                    |client backend|transactionid|null    |null    |null|null |null      |839          |null   |null |null    |4/3               |110|ExclusiveLock|true   |false   |null                             |                |
|5    |postgres|109|null      |10      |postgres|psql            |172.27.0.4 |null           |59762      |2023-09-28 22:04:07.981163 +00:00|2023-09-28 22:15:10.145378 +00:00|2023-09-28 22:15:10.145965 +00:00|2023-09-28 22:15:10.145965 +00:00|Lock           |transactionid|active             |840        |839         |null    |UPDATE core_account SET balance = balance - 501.0000 WHERE username = 'ysullivan';|client backend|transactionid|null    |null    |null|null |null      |840          |null   |null |null    |3/9               |109|ExclusiveLock|true   |false   |null                             |{110}           |
+-----+--------+---+----------+--------+--------+----------------+-----------+---------------+-----------+---------------------------------+---------------------------------+---------------------------------+---------------------------------+---------------+-------------+-------------------+-----------+------------+--------+----------------------------------------------------------------------------------+--------------+-------------+--------+--------+----+-----+----------+-------------+-------+-----+--------+------------------+---+-------------+-------+--------+---------------------------------+----------------+
```

That means the third row with client_addr as `172.27.0.4` wants a lock but is being blocked by PID `110`. If TX 1 commits, then the lock is released, and TX 2 can acquire a lock:

```text
+-----+--------+---+----------+--------+--------+----------------+-----------+---------------+-----------+---------------------------------+---------------------------------+---------------------------------+---------------------------------+---------------+----------+-------------------+-----------+------------+--------+----------------------------------------------------------------------------------+--------------+-------------+--------+--------+----+-----+----------+-------------+-------+-----+--------+------------------+---+-------------+-------+--------+---------+----------------+
|datid|datname |pid|leader_pid|usesysid|usename |application_name|client_addr|client_hostname|client_port|backend_start                    |xact_start                       |query_start                      |state_change                     |wait_event_type|wait_event|state              |backend_xid|backend_xmin|query_id|query                                                                             |backend_type  |locktype     |database|relation|page|tuple|virtualxid|transactionid|classid|objid|objsubid|virtualtransaction|pid|mode         |granted|fastpath|waitstart|pg_blocking_pids|
+-----+--------+---+----------+--------+--------+----------------+-----------+---------------+-----------+---------------------------------+---------------------------------+---------------------------------+---------------------------------+---------------+----------+-------------------+-----------+------------+--------+----------------------------------------------------------------------------------+--------------+-------------+--------+--------+----+-----+----------+-------------+-------+-----+--------+------------------+---+-------------+-------+--------+---------+----------------+
|5    |postgres|109|null      |10      |postgres|psql            |172.27.0.4 |null           |59762      |2023-09-28 22:04:07.981163 +00:00|2023-09-28 22:15:10.145378 +00:00|2023-09-28 22:15:10.145965 +00:00|2023-09-28 22:20:19.388310 +00:00|Client         |ClientRead|idle in transaction|840        |null        |null    |UPDATE core_account SET balance = balance - 501.0000 WHERE username = 'ysullivan';|client backend|transactionid|null    |null    |null|null |null      |840          |null   |null |null    |3/9               |109|ExclusiveLock|true   |false   |null     |                |
+-----+--------+---+----------+--------+--------+----------------+-----------+---------------+-----------+---------------------------------+---------------------------------+---------------------------------+---------------------------------+---------------+----------+-------------------+-----------+------------+--------+----------------------------------------------------------------------------------+--------------+-------------+--------+--------+----+-----+----------+-------------+-------+-----+--------+------------------+---+-------------+-------+--------+---------+----------------+
```

If a resource is currently locked in an incompatible mode, any transaction attempting to acquire the lock is queued and must wait until the lock is released, as seen with TX 2. Waiting transactions do not utilize processor resources; the backend processes involved enter a dormant state and are awakened by the operating system when the resource becomes available. Look at [relation-level locks](https://postgrespro.com/blog/pgsql/5967999) for additional information.
