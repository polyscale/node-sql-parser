const { expect } = require('chai');
const Parser = require('../src/parser').default
const { selectIntoToSQL } = require('../src/select')

describe('mysql', () => {
  const parser = new Parser();
  function getParsedSql(sql, opt) {
    const ast = parser.astify(sql, opt);
    return parser.sqlify(ast, opt);
  }
  const mariadb = { database: 'mariadb' }

  describe('select', () => {
    const SQL_LIST = [
      {
        title: 'basic regexp',
        sql: [
          "SELECT 'Michael!' REGEXP '.*';",
          "SELECT 'Michael!' REGEXP '.*'"
        ]
      },
      {
        title: 'basic regexp with newline',
        sql: [
          "SELECT 'new*\n*line' REGEXP 'new\\*.\\*line';",
          `SELECT 'new*\n*line' REGEXP 'new\\*.\\*line'`
        ]
      },
      {
        title: 'basic regexp with binary',
        sql: [
          "SELECT 'a' REGEXP '^[a-d]', 'a' REGEXP BINARY 'A';",
          "SELECT 'a' REGEXP '^[a-d]', 'a' REGEXP BINARY 'A'"
        ]
      },
      {
        title: 'regexp_instr',
        sql: [
          "SELECT REGEXP_INSTR('dog cat dog', 'dog');",
          "SELECT REGEXP_INSTR('dog cat dog', 'dog')"
        ]
      },
      {
        title: 'regexp_instr with pos',
        sql: [
          "SELECT REGEXP_INSTR('dog cat dog', 'dog', 2);",
          "SELECT REGEXP_INSTR('dog cat dog', 'dog', 2)"
        ]
      },
      {
        title: 'regexp_like',
        sql: [
          "SELECT REGEXP_LIKE('CamelCase', 'CAMELCASE');",
          "SELECT REGEXP_LIKE('CamelCase', 'CAMELCASE')"
        ]
      },
      {
        title: 'regexp_like with regex',
        sql: [
          "SELECT REGEXP_LIKE('fo\r\nfo', '^f.*$', 'm');",
          "SELECT REGEXP_LIKE('fo\r\nfo', '^f.*$', 'm')"
        ]
      },
      {
        title: 'regexp_like with collate',
        sql: [
          "SELECT REGEXP_LIKE('CamelCase', 'CAMELCASE' COLLATE utf8mb4_0900_as_cs);",
          "SELECT REGEXP_LIKE('CamelCase', 'CAMELCASE' COLLATE UTF8MB4_0900_AS_CS)"
        ]
      },
      {
        title: 'regexp_like with binary',
        sql: [
          "SELECT REGEXP_LIKE('a', 'A'), REGEXP_LIKE('a', BINARY 'A');",
          "SELECT REGEXP_LIKE('a', 'A'), REGEXP_LIKE('a', BINARY 'A')"
        ]
      },
      {
        title: 'regexp_replace',
        sql: [
          "SELECT REGEXP_REPLACE('abc def ghi', '[a-z]+', 'X', 1, 3);",
          "SELECT REGEXP_REPLACE('abc def ghi', '[a-z]+', 'X', 1, 3)"
        ]
      },
      {
        title: 'regexp_substr',
        sql: [
          "SELECT REGEXP_SUBSTR('abc def ghi', '[a-z]+', 1, 3);",
          "SELECT REGEXP_SUBSTR('abc def ghi', '[a-z]+', 1, 3)"
        ]
      },
      {
        title: 'window function',
        sql: [
          `SELECT
          store.NAME AS store,
          p1.date,
          sum( p1.show_num ) AS show_num,
          sum( p1.click_num ) AS click_num,
          round( sum( p1.click_num ) / sum( p1.show_num ), 4 ) AS click_rate,
          round( sum( p1.cost ) / sum( p1.click_num ), 2 ) AS cpc,
          round(
            sum( p1.cost ) / sum( p1.click_num ) * (
            sum( p1.click_num ) / sum( p1.show_num )) * 1000,
            2
          ) AS cpm,
          round( sum( p1.cost ) / sum( p1.add_cart_num ), 2 ) AS add_cart_cost,
          sum( p1.add_cart_num ) AS add_cart_num,
          round( sum( p1.add_cart_num ) / sum( p1.click_num ), 4 ) AS add_cart_rate,
          sum( p1.paid_order_num ) AS paid_order_num,
          round( sum( p1.cost ), 2 ) AS cost,
          round( sum( p1.paid_order_zmount ), 2 ) AS final_paid_order_amount,
          round( sum( sum( p1.cost )) over w, 2 ) AS cumulative_cost,
          round( sum( sum( p1.paid_order_zmount )) over w, 2 ) AS cumulative_final_paid_order_amount,
          round(( sum( sum( p1.paid_order_zmount )) over w )/( sum( sum( p1.cost )) over w ), 2 ) AS cumulative_roi,
          p3.second_day_paid_order_zmount AS second_day_paid_order_amount,
          round( p3.second_day_paid_order_zmount / sum( p1.cost ), 2 ) AS second_day_roi,
          round( sum( p1.paid_order_zmount )/ sum( p1.cost ), 2 ) AS final_roi
        FROM
          model_plangroup_15click AS p1
          LEFT JOIN (
          SELECT
            store,
            date,
            plan_group_name,
            max( upload_date ) AS max_upload_date
          FROM
            model_plangroup_15click
          WHERE
            model_plangroup_15click.upload_date IS NOT NULL
          GROUP BY
            store,
            date,
            plan_group_name
          ) AS p2 ON p1.store = p2.store
          AND p1.date = p2.date
          AND p1.plan_group_name = p2.plan_group_name
          AND p1.upload_date = p2.max_upload_date
          LEFT JOIN model_store AS store ON store.id = p1.store
          LEFT JOIN (
          SELECT
            p.store,
            p.date,
            round( sum( ifnull( paid_order_zmount, 0 )), 2 ) AS second_day_paid_order_zmount
          FROM
            model_plangroup_15click AS p
          WHERE
            DATEDIFF( p.upload_date, p.date ) = 1
          GROUP BY
            p.store,
            p.date
          ORDER BY
            p.store,
            p.date DESC
          ) AS p3 ON p1.store = p3.store
          AND p1.date = p3.date
        WHERE
          p2.max_upload_date IS NOT NULL
        GROUP BY
          p1.store,
          p1.date window w AS ( PARTITION BY p1.store, date_format( p1.date, "%Y%m" ) ORDER BY p1.date ROWS UNBOUNDED PRECEDING)
        ORDER BY
          p1.store,
          p1.date DESC`,
          "SELECT `store`.`NAME` AS `store`, `p1`.`date`, SUM(`p1`.`show_num`) AS `show_num`, SUM(`p1`.`click_num`) AS `click_num`, round(SUM(`p1`.`click_num`) / SUM(`p1`.`show_num`), 4) AS `click_rate`, round(SUM(`p1`.`cost`) / SUM(`p1`.`click_num`), 2) AS `cpc`, round(SUM(`p1`.`cost`) / SUM(`p1`.`click_num`) * (SUM(`p1`.`click_num`) / SUM(`p1`.`show_num`)) * 1000, 2) AS `cpm`, round(SUM(`p1`.`cost`) / SUM(`p1`.`add_cart_num`), 2) AS `add_cart_cost`, SUM(`p1`.`add_cart_num`) AS `add_cart_num`, round(SUM(`p1`.`add_cart_num`) / SUM(`p1`.`click_num`), 4) AS `add_cart_rate`, SUM(`p1`.`paid_order_num`) AS `paid_order_num`, round(SUM(`p1`.`cost`), 2) AS `cost`, round(SUM(`p1`.`paid_order_zmount`), 2) AS `final_paid_order_amount`, round(SUM(SUM(`p1`.`cost`)) OVER w, 2) AS `cumulative_cost`, round(SUM(SUM(`p1`.`paid_order_zmount`)) OVER w, 2) AS `cumulative_final_paid_order_amount`, round(SUM(SUM(`p1`.`paid_order_zmount`)) OVER w / SUM(SUM(`p1`.`cost`)) OVER w, 2) AS `cumulative_roi`, `p3`.`second_day_paid_order_zmount` AS `second_day_paid_order_amount`, round(`p3`.`second_day_paid_order_zmount` / SUM(`p1`.`cost`), 2) AS `second_day_roi`, round(SUM(`p1`.`paid_order_zmount`) / SUM(`p1`.`cost`), 2) AS `final_roi` FROM `model_plangroup_15click` AS `p1` LEFT JOIN (SELECT `store`, `date`, `plan_group_name`, MAX(`upload_date`) AS `max_upload_date` FROM `model_plangroup_15click` WHERE `model_plangroup_15click`.`upload_date` IS NOT NULL GROUP BY `store`, `date`, `plan_group_name`) AS `p2` ON `p1`.`store` = `p2`.`store` AND `p1`.`date` = `p2`.`date` AND `p1`.`plan_group_name` = `p2`.`plan_group_name` AND `p1`.`upload_date` = `p2`.`max_upload_date` LEFT JOIN `model_store` AS `store` ON `store`.`id` = `p1`.`store` LEFT JOIN (SELECT `p`.`store`, `p`.`date`, round(SUM(ifnull(`paid_order_zmount`, 0)), 2) AS `second_day_paid_order_zmount` FROM `model_plangroup_15click` AS `p` WHERE DATEDIFF(`p`.`upload_date`, `p`.`date`) = 1 GROUP BY `p`.`store`, `p`.`date` ORDER BY `p`.`store` ASC, `p`.`date` DESC) AS `p3` ON `p1`.`store` = `p3`.`store` AND `p1`.`date` = `p3`.`date` WHERE `p2`.`max_upload_date` IS NOT NULL GROUP BY `p1`.`store`, `p1`.`date` WINDOW w AS (PARTITION BY `p1`.`store`, date_format(`p1`.`date`, '%Y%m') ORDER BY `p1`.`date` ASC ROWS UNBOUNDED PRECEDING) ORDER BY `p1`.`store` ASC, `p1`.`date` DESC"
        ]
      },
      {
        title: 'on clause with function and expr',
        sql: [
          `select * from pg_database a
          join pg_database b
          on upper(a.datctype) = upper(b.datctype) AND a.oid = b.oid`,
          "SELECT * FROM `pg_database` AS `a` INNER JOIN `pg_database` AS `b` ON upper(`a`.`datctype`) = upper(`b`.`datctype`) AND `a`.`oid` = `b`.`oid`"
        ]
      },
      {
        title: 'trim function',
        sql: [
          `SELECT TRIM('.' from "....test.....") AS TrimmedString;`,
          "SELECT TRIM('.' FROM '....test.....') AS `TrimmedString`"
        ]
      },
      {
        title: 'trim function with position',
        sql: [
          `SELECT TRIM(BOTH '.' from "....test.....") AS TrimmedString;`,
          "SELECT TRIM(BOTH '.' FROM '....test.....') AS `TrimmedString`"
        ]
      },
      {
        title: 'trim function with position',
        sql: [
          `SELECT TRIM(TRAILING  from " test ") AS TrimmedString;`,
          "SELECT TRIM(TRAILING FROM ' test ') AS `TrimmedString`"
        ]
      },
      {
        title: 'trim function without config',
        sql: [
          `SELECT TRIM(" test ") AS TrimmedString;`,
          "SELECT TRIM(' test ') AS `TrimmedString`"
        ]
      },
      {
        title: 'column with start',
        sql: [
          `SELECT abc, * from tableName`,
          "SELECT `abc`, * FROM `tableName`"
        ]
      },
      {
        title: 'timestamp diff',
        sql: [
          'SELECT TIMESTAMPDIFF(SECOND,"2003-05-01 12:05:55","2003-05-01 12:06:32")',
          "SELECT TIMESTAMPDIFF(SECOND, '2003-05-01 12:05:55', '2003-05-01 12:06:32')"
        ],
      },
      {
        title: 'timestamp add',
        sql: [
          'SELECT TIMESTAMPADD(MINUTE,1,"2003-01-02")',
          "SELECT TIMESTAMPADD(MINUTE, 1, '2003-01-02')"
        ],
      },
      {
        title: 'create on update current_timestamp',
        sql: [
          "CREATE TABLE `t1` (`id` int(11) unsigned NOT NULL AUTO_INCREMENT, `name` varchar(64) NOT NULL DEFAULT 'ttt', `zf` int(10) unsigned zerofill DEFAULT NULL, `created_at` timestamp NULL DEFAULT NULL, `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (`id`)) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4",
          "CREATE TABLE `t1` (`id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT, `name` VARCHAR(64) NOT NULL DEFAULT 'ttt', `zf` INT(10) UNSIGNED ZEROFILL DEFAULT NULL, `created_at` TIMESTAMP NULL DEFAULT NULL, `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (`id`)) ENGINE = INNODB AUTO_INCREMENT = 5 DEFAULT CHARSET = utf8mb4"
        ],
      },
      {
        title: 'insert ignore into',
        sql: [
          "INSERT IGNORE INTO t1 (c1, c2) VALUES (1,1)",
          "INSERT IGNORE INTO `t1` (`c1`, `c2`) VALUES (1,1)"
        ],
      },
      {
        title: 'insert ignore into without columns',
        sql: [
          "INSERT IGNORE INTO t1 VALUES (1, 'hi')",
          "INSERT IGNORE INTO `t1` VALUES (1,'hi')"
        ],
      },
      {
        title: 'select into',
        sql: [
          "select c1, c2 into t1 from t2",
          "SELECT `c1`, `c2` INTO `t1` FROM `t2`"
        ],
      },
      {
        title: 'in bracket',
        sql: [
          "SELECT * FROM `tableName` WHERE POSITION('\n' IN `largeText`) > 0;",
          "SELECT * FROM `tableName` WHERE POSITION('\n' IN `largeText`) > 0"
        ],
      },
      {
        title: 'in bracket in column',
        sql: [
          "SELECT POSITION('\n' IN `largeText`) AS `charPosition` FROM `tableName`;",
          "SELECT POSITION('\n' IN `largeText`) AS `charPosition` FROM `tableName`"
        ],
      },
      {
        title: 'triple single quote',
        sql: [
          "select '''1'''",
          "SELECT '''1'''"
        ]
      },
      {
        title: 'rlike column',
        sql: [
          "select c1 from t1 where 'abc' rlike c2",
          "SELECT `c1` FROM `t1` WHERE 'abc' RLIKE `c2`"
        ]
      },
      {
        title: 'column with bracket',
        sql: [
          'SELECT `T`.`ddd` FROM `TABLE` AS `T`',
          'SELECT `T`.`ddd` FROM `TABLE` AS `T`'
        ]
      },
      {
        title: 'limit clause support ? as placeholder',
        sql: [
          'SELECT t0.xid, t0.xname FROM ORG_DEFINTION t0 WHERE (t0.xname = ?) LIMIT ?',
          'SELECT `t0`.`xid`, `t0`.`xname` FROM `ORG_DEFINTION` AS `t0` WHERE (`t0`.`xname` = ?) LIMIT ?'
        ]
      },
      {
        title: 'count distinct without parentheses',
        sql: [
          'SELECT COUNT(DISTINCT IF(active = 1, dep_id, NULL)) AS active_deps FROM users',
          'SELECT COUNT(DISTINCT IF(`active` = 1, `dep_id`, NULL)) AS `active_deps` FROM `users`'
        ]
      },
      {
        title: 'drop table if exists',
        sql: [
          'DROP TABLE IF EXISTS event_log',
          'DROP TABLE IF EXISTS `event_log`'
        ]
      },
      {
        title: 'sql column name wrapped by bracket',
        sql: [
          'SELECT `sometable`.`id` FROM sometable',
          'SELECT `sometable`.`id` FROM `sometable`'
        ]
      },
      {
        title: 'assigning a value to a sql variable within a select query',
        sql: [
          "SELECT @id := cust_id FROM customers WHERE cust_id='customer name';",
          "SELECT @id := `cust_id` FROM `customers` WHERE `cust_id` = 'customer name'"
        ]
      },
      {
        title: 'support hexadecimal literals',
        sql: [
          "SELECT X'4D7953514C', 0x01AF, x'01afd' from t1 where id = 0x1ecc96ce15;",
          "SELECT X'4D7953514C', 0x01AF, X'01afd' FROM `t1` WHERE `id` = 0x1ecc96ce15"
        ]
      },
      {
        title: 'alter table set auto_increment',
        sql: [
          'ALTER TABLE myTable AUTO_INCREMENT = 1;',
          'ALTER TABLE `myTable` AUTO_INCREMENT = 1'
        ]
      },
      {
        title: 'show create view',
        sql: [
          'SHOW CREATE VIEW abc.test',
          'SHOW CREATE VIEW `abc`.`test`'
        ]
      },
      {
        title: 'with',
        sql: [
          'WITH cte AS (SELECT id, ROW_NUMBER() OVER (PARTITION BY id, uid ORDER BY time DESC) ranking FROM t) SELECT id FROM cte WHERE ranking = 1',
          'WITH `cte` AS (SELECT `id`, ROW_NUMBER() OVER (PARTITION BY `id`, `uid` ORDER BY `time` DESC) AS `ranking` FROM `t`) SELECT `id` FROM `cte` WHERE `ranking` = 1'
        ]
      },
      {
        title: 'parentheses in from clause',
        sql: [
          'SELECT * FROM (user), (`name`)',
          'SELECT * FROM (`user`), (`name`)'
        ]
      },
      {
        title: 'blob data type',
        sql: [
          'CREATE TABLE `undo_log` (`id` bigint(20) NOT NULL AUTO_INCREMENT, `branch_id` bigint(20) NOT NULL, `xid` varchar(100) NOT NULL, `context` varchar(128) NOT NULL, `rollback_info` longblob NOT NULL, `log_status` int(11) NOT NULL, `log_created` datetime NOT NULL, `log_modified` datetime NOT NULL, `ext` varchar(100) DEFAULT NULL,PRIMARY KEY (`id`) USING BTREE, UNIQUE KEY `ux_undo_log` (`xid`,`branch_id`) USING BTREE) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;',
          'CREATE TABLE `undo_log` (`id` BIGINT(20) NOT NULL AUTO_INCREMENT, `branch_id` BIGINT(20) NOT NULL, `xid` VARCHAR(100) NOT NULL, `context` VARCHAR(128) NOT NULL, `rollback_info` LONGBLOB NOT NULL, `log_status` INT(11) NOT NULL, `log_created` DATETIME NOT NULL, `log_modified` DATETIME NOT NULL, `ext` VARCHAR(100) DEFAULT NULL, PRIMARY KEY (`id`) USING BTREE, UNIQUE KEY `ux_undo_log` (`xid`, `branch_id`) USING BTREE) ENGINE = INNODB DEFAULT CHARSET = utf8 ROW_FORMAT = DYNAMIC',
        ]
      },
      {
        title: 'positive number by plus sign',
        sql: [
          'select +5; select -5',
          'SELECT 5 ; SELECT -5'
        ]
      },
      {
        title: 'support xor operator',
        sql: [
          'SELECT (true xor false)',
          'SELECT (TRUE XOR FALSE)'
        ]
      },
      {
        title: 'logical operator without parentheses',
        sql: [
          'SELECT true OR false AND true;',
          'SELECT TRUE OR FALSE AND TRUE'
        ]
      },
      {
        title: 'logical operator in expr',
        sql: [
          'SELECT x>3 || x<9 && x=3;',
          'SELECT `x` > 3 || `x` < 9 && `x` = 3'
        ]
      },
      {
        title: 'escape double quoted',
        sql: [
          'SELECT "foo""bar" AS col;',
          'SELECT \'foo""bar\' AS `col`'
        ]
      },
      {
        title: 'escape bracket quoted',
        sql: [
          'SELECT `foo``bar`',
          'SELECT `foo``bar`'
        ]
      },
      {
        title: 'insert set statement without into',
        sql: [
          'insert t1 set c1 = 1',
          'INSERT `t1` SET `c1` = 1'
        ]
      },
      {
        title: 'support $ in alias ident',
        sql: [
          'select 1 as stuff$id from dual',
          'SELECT 1 AS `stuff$id` FROM DUAL',
        ]
      },
      {
        title: 'group concat with separator',
        sql: [
          "select GROUP_CONCAT(DISTINCT abc order by abc separator ';') as abc from business_table",
          "SELECT GROUP_CONCAT(DISTINCT `abc` ORDER BY `abc` ASC SEPARATOR ';') AS `abc` FROM `business_table`"
        ]
      },
      {
        title: 'group concat',
        sql: [
          `select
          (SELECT group_concat(v SEPARATOR ', ' )
          FROM category_table WHERE category = 3)
          AS category
          FROM fssa_esg_issues
          group by id`,
          "SELECT (SELECT GROUP_CONCAT(`v` SEPARATOR ', ') FROM `category_table` WHERE `category` = 3) AS `category` FROM `fssa_esg_issues` GROUP BY `id`",
        ]
      },
      {
        title: 'natural charset strings',
        sql: [
          "SELECT N'hello'",
          "SELECT N'hello'",
        ]
      },
      {
        title: '_latin1 string',
        sql: [
          "SELECT _latin1 x'AAFF00';",
          "SELECT _LATIN1 X'AAFF00'"
        ]
      },
      {
        title: 'binary string without x',
        sql: [
          "SELECT _binary 'hello';",
          "SELECT _BINARY 'hello'"
        ]
      },
      {
        title: 'geometry type',
        sql: [
          `CREATE TABLE \`GeoCoordinateTable\` (
            \`geoCoordinate\` point NOT NULL
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,
          'CREATE TABLE `GeoCoordinateTable` (`geoCoordinate` POINT NOT NULL) ENGINE = INNODB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci'
        ]
      },
      {
        title: 'have clause with parentheses',
        sql: [
          `SELECT col1, col2
          FROM table1
          HAVING (col1 LIKE '%foo%' OR
                  col2 LIKE '%bar%')
             AND col1 <> 'test'`,
          "SELECT `col1`, `col2` FROM `table1` HAVING (`col1` LIKE '%foo%' OR `col2` LIKE '%bar%') AND `col1` <> 'test'"
        ]
      },
      {
        title: 'regexep right could be function call',
        sql: [
          `select
          (SELECT group_concat(v)
          FROM keyperson WHERE e.keyperson
          REGEXP concat('\b', k, '\b'))
          AS keyperson
          FROM abc e`,
          "SELECT (SELECT GROUP_CONCAT(`v`) FROM `keyperson` WHERE `e`.`keyperson` REGEXP concat('\b', `k`, '\b')) AS `keyperson` FROM `abc` AS `e`"
        ]
      },
      {
        title: 'set op INTERSECT',
        sql: [
          `SELECT * FROM (SELECT 1) intersect SELECT * FROM (SELECT 2)`,
          'SELECT * FROM (SELECT 1) INTERSECT SELECT * FROM (SELECT 2)'
        ]
      },
      {
        title: 'set op minus',
        sql: [
          `SELECT * FROM (SELECT 1) minus SELECT * FROM (SELECT 2)`,
          'SELECT * FROM (SELECT 1) MINUS SELECT * FROM (SELECT 2)'
        ]
      },
      {
        title: 'index column length',
        sql: [
          'CREATE TABLE `Translation` (`id` char(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,`en-GB` text,PRIMARY KEY (`id`),KEY `Translation_en-GB_btree_idx` (`en-GB`(768))) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci',
          'CREATE TABLE `Translation` (`id` CHAR(36) NOT NULL CHARACTER SET ASCII COLLATE ASCII_BIN, `en-GB` TEXT, PRIMARY KEY (`id`), KEY Translation_en-GB_btree_idx (`en-GB` (768))) ENGINE = INNODB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci',
        ]
      },
      {
        title: 'update after with clause',
        sql: [
          `with oops as (
            SELECT from_name,to_ccn, to_name
            from dolt_commit_diff_hospitals where from_commit = 'qtd6vb07pq7bfgt67m863anntm6fpu7n'
            and to_commit = 'p730obnbmihnlq54uvenck13h12f7831'
            and from_name <> to_name
            )
            update hospitals h
            join oops o
                on h.ccn = o.to_ccn
                and h.name <> o.from_name
            set h.name = o.from_name
          `,
          "WITH `oops` AS (SELECT `from_name`, `to_ccn`, `to_name` FROM `dolt_commit_diff_hospitals` WHERE `from_commit` = 'qtd6vb07pq7bfgt67m863anntm6fpu7n' AND `to_commit` = 'p730obnbmihnlq54uvenck13h12f7831' AND `from_name` <> `to_name`) UPDATE `hospitals` AS `h` INNER JOIN `oops` AS `o` ON `h`.`ccn` = `o`.`to_ccn` AND `h`.`name` <> `o`.`from_name` SET `h`.`name` = `o`.`from_name`"
        ]
      },
      {
        title: 'cross join',
        sql: [
          'select A.id,B.name from A CROSS JOIN B',
          'SELECT `A`.`id`, `B`.`name` FROM `A` CROSS JOIN `B`'
        ]
      },
      {
        title: 'case when list',
        sql: [
          `select A.id,B.name
          from A, B
          where
          CASE
              when A.id = 0 then B.name in ('aaa', 'bbb')
              when A.id = 1 then B.name in ('bbb', 'ccc')
              when A.id = 2 then B.name in ('ccc', 'ddd')
          end;`,
          "SELECT `A`.`id`, `B`.`name` FROM `A`, `B` WHERE CASE WHEN `A`.`id` = 0 THEN `B`.`name` IN ('aaa', 'bbb') WHEN `A`.`id` = 1 THEN `B`.`name` IN ('bbb', 'ccc') WHEN `A`.`id` = 2 THEN `B`.`name` IN ('ccc', 'ddd') END"
        ]
      },
      {
        title: 'drop database or schema stmt',
        sql: [
          'DROP DATABASE IF EXISTS dbName; drop schema abc',
          'DROP DATABASE IF EXISTS `dbName` ; DROP SCHEMA `abc`'
        ]
      },
      {
        title: 'create table with multiple data types',
        sql: [
          "CREATE TABLE `table_name` (`type_TINYINT` tinyint DEFAULT NULL, `type_SMALLINT` smallint DEFAULT NULL, `type_MEDIUMINT` mediumint DEFAULT NULL, `type_INT` int DEFAULT NULL, `type_BIGINT` bigint DEFAULT NULL, `type_FLOAT` float DEFAULT NULL, `type_DOUBLE` double DEFAULT NULL, `type_BIT` bit(1) DEFAULT NULL, `type_DATE` date DEFAULT NULL, `type_TIME` time DEFAULT NULL, `type_DATETIME` datetime DEFAULT NULL, `type_TIMESTAMP` timestamp NULL DEFAULT NULL, `type_YEAR` year DEFAULT NULL, `type_CHAR` char(10) DEFAULT NULL, `type_VARCHAR` varchar(255) DEFAULT NULL, `type_DECIMAL` decimal(10,2) DEFAULT NULL, `type_NUMERIC` decimal(10,2) DEFAULT NULL, `type_TINYTEXT` tinytext, `type_TEXT` text, `type_MEDIUMTEXT` mediumtext, `type_LONGTEXT` longtext, `type_ENUM` enum('A','B','C') DEFAULT NULL, `type_SET` set('A','B','C') DEFAULT NULL, `type_BINARY` binary(10) DEFAULT NULL, `type_VARBINARY` varbinary(255) DEFAULT NULL, `type_TINYBLOB` tinyblob, `type_BLOB` blob, `type_MEDIUMBLOB` mediumblob, `type_LONGBLOB` longblob) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci",
          "CREATE TABLE `table_name` (`type_TINYINT` TINYINT DEFAULT NULL, `type_SMALLINT` SMALLINT DEFAULT NULL, `type_MEDIUMINT` MEDIUMINT DEFAULT NULL, `type_INT` INT DEFAULT NULL, `type_BIGINT` BIGINT DEFAULT NULL, `type_FLOAT` FLOAT DEFAULT NULL, `type_DOUBLE` DOUBLE DEFAULT NULL, `type_BIT` BIT(1) DEFAULT NULL, `type_DATE` DATE DEFAULT NULL, `type_TIME` TIME DEFAULT NULL, `type_DATETIME` DATETIME DEFAULT NULL, `type_TIMESTAMP` TIMESTAMP NULL DEFAULT NULL, `type_YEAR` YEAR DEFAULT NULL, `type_CHAR` CHAR(10) DEFAULT NULL, `type_VARCHAR` VARCHAR(255) DEFAULT NULL, `type_DECIMAL` DECIMAL(10, 2) DEFAULT NULL, `type_NUMERIC` DECIMAL(10, 2) DEFAULT NULL, `type_TINYTEXT` TINYTEXT, `type_TEXT` TEXT, `type_MEDIUMTEXT` MEDIUMTEXT, `type_LONGTEXT` LONGTEXT, `type_ENUM` ENUM('A', 'B', 'C') DEFAULT NULL, `type_SET` set,('A', 'B', 'C') DEFAULT NULL, `type_BINARY` BINARY(10) DEFAULT NULL, `type_VARBINARY` VARBINARY(255) DEFAULT NULL, `type_TINYBLOB` TINYBLOB, `type_BLOB` BLOB, `type_MEDIUMBLOB` MEDIUMBLOB, `type_LONGBLOB` LONGBLOB) ENGINE = INNODB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci",
        ],
      },
      {
        title: 'remove type keyword',
        sql: [
          `ALTER TABLE test ADD
          type varchar(255) NOT NULL DEFAULT ('default');`,
          "ALTER TABLE `test` ADD `type` VARCHAR(255) NOT NULL DEFAULT ('default')"
        ]
      },
      {
        title: 'string concatenator in where clause',
        sql: [
          "SELECT * from tests where name = 'test' || 'abc';",
          "SELECT * FROM `tests` WHERE `name` = 'test' || 'abc'"
        ]
      },
      {
        title: 'show create table',
        sql: [
          'SHOW CREATE TABLE `debug`',
          'SHOW CREATE TABLE `debug`'
        ]
      },
    ]
    SQL_LIST.forEach(sqlInfo => {
      const { title, sql } = sqlInfo
      it(`should support ${title}`, () => {
        expect(getParsedSql(sql[0])).to.equal(sql[1])
      })
      it(`should support ${title} in mariadb`, () => {
        expect(getParsedSql(sql[0], mariadb)).to.equal(sql[1])
      })
    })

    it('should have spaces between keywords', () => {
      const sql = 'CREATE TABLE `foo` (`id` int UNIQUEKEYONUPDATECASCADE)'
      expect(parser.astify.bind(parser, sql)).to.throw('Expected "#", "--", "/*", or [ \\t\\n\\r] but "U" found.')
      expect(parser.astify.bind(parser, sql, mariadb)).to.throw('Expected "#", "--", "/*", or [ \\t\\n\\r] but "U" found.')
    })

    describe('column clause', () => {
      it('should support fulltext search', () => {
        const sqlList = [
          'SELECT MATCH (`label`) AGAINST (?) AS `score` FROM `TABLE` ORDER BY `score` DESC',
          'SELECT MATCH (`label`) AGAINST (?) AS `score`, MATCH (`id`, `name`) AGAINST (?) FROM `TABLE` ORDER BY `score` DESC',
          'SELECT `label` FROM `TABLE` WHERE MATCH (`label`) AGAINST (?) > 0 ORDER BY `label` DESC',
          'SELECT `label`, MATCH (`label`) AGAINST (?) AS `score` FROM `TABLE` ORDER BY `score` DESC',
          'SELECT MATCH (`label`) AGAINST (?) AS `score` FROM `TABLE` WHERE MATCH (`label`) AGAINST (?) > 0 ORDER BY `score` DESC',
          'SELECT `label`, MATCH (`label`) AGAINST (?) AS `score` FROM `TABLE` WHERE MATCH (`label`) AGAINST (?) > 0 ORDER BY `score` DESC',
          'SELECT `label` FROM `TABLE` ORDER BY MATCH (`label`) AGAINST (?) DESC',
          'SELECT MATCH (`label`) AGAINST (? IN BOOLEAN MODE) AS `score` FROM `TABLE` ORDER BY `score` DESC',
          'SELECT `label` FROM `TABLE` WHERE MATCH (`label`) AGAINST (? IN BOOLEAN MODE) > 0 ORDER BY `label` DESC',
          'SELECT `label`, MATCH (`label`) AGAINST (? IN BOOLEAN MODE) AS `score` FROM `TABLE` ORDER BY `score` DESC',
          'SELECT MATCH (`label`) AGAINST (? IN BOOLEAN MODE) AS `score` FROM `TABLE` WHERE MATCH (`label`) AGAINST (? IN BOOLEAN MODE) > 0 ORDER BY `score` DESC',
          'SELECT `label`, MATCH (`label`) AGAINST (? IN BOOLEAN MODE) AS `score` FROM `TABLE` WHERE MATCH (`label`) AGAINST (? IN BOOLEAN MODE) > 0 ORDER BY `score` DESC',
          'SELECT `label` FROM `TABLE` ORDER BY MATCH (`label`) AGAINST (? IN BOOLEAN MODE) DESC',
          'SELECT MATCH (`label`) AGAINST (? IN NATURAL LANGUAGE MODE) AS `score` FROM `TABLE` ORDER BY `score` DESC',
          'SELECT `label` FROM `TABLE` WHERE MATCH (`label`) AGAINST (? IN NATURAL LANGUAGE MODE) > 0 ORDER BY `label` DESC',
          'SELECT `label`, MATCH (`label`) AGAINST (? IN NATURAL LANGUAGE MODE) AS `score` FROM `TABLE` ORDER BY `score` DESC',
          'SELECT MATCH (`label`) AGAINST (? IN NATURAL LANGUAGE MODE) AS `score` FROM `TABLE` WHERE MATCH (`label`) AGAINST (? IN NATURAL LANGUAGE MODE) > 0 ORDER BY `score` DESC',
          'SELECT `label`, MATCH (`label`) AGAINST (? IN NATURAL LANGUAGE MODE) AS `score` FROM `TABLE` WHERE MATCH (`label`) AGAINST (? IN NATURAL LANGUAGE MODE) > 0 ORDER BY `score` DESC',
          'SELECT `label` FROM `TABLE` ORDER BY MATCH (`label`) AGAINST (? IN NATURAL LANGUAGE MODE) DESC',
          'SELECT MATCH (`label`) AGAINST (? IN NATURAL LANGUAGE MODE WITH QUERY EXPANSION) AS `score` FROM `TABLE` ORDER BY `score` DESC',
          'SELECT `label` FROM `TABLE` WHERE MATCH (`label`) AGAINST (? IN NATURAL LANGUAGE MODE WITH QUERY EXPANSION) > 0 ORDER BY `label` DESC',
          'SELECT `label`, MATCH (`label`) AGAINST (? IN NATURAL LANGUAGE MODE WITH QUERY EXPANSION) AS `score` FROM `TABLE` ORDER BY `score` DESC',
          'SELECT MATCH (`label`) AGAINST (? IN NATURAL LANGUAGE MODE WITH QUERY EXPANSION) AS `score` FROM `TABLE` WHERE MATCH (`label`) AGAINST (? IN NATURAL LANGUAGE MODE WITH QUERY EXPANSION) > 0 ORDER BY `score` DESC',
          'SELECT `label`, MATCH (`label`) AGAINST (? IN NATURAL LANGUAGE MODE WITH QUERY EXPANSION) AS `score` FROM `TABLE` WHERE MATCH (`label`) AGAINST (? IN NATURAL LANGUAGE MODE WITH QUERY EXPANSION) > 0 ORDER BY `score` DESC',
          'SELECT `label` FROM `TABLE` ORDER BY MATCH (`label`) AGAINST (? IN NATURAL LANGUAGE MODE WITH QUERY EXPANSION) DESC',
          'SELECT MATCH (`label`) AGAINST (? WITH QUERY EXPANSION) AS `score` FROM `TABLE` ORDER BY `score` DESC',
          'SELECT `label` FROM `TABLE` WHERE MATCH (`label`) AGAINST (? WITH QUERY EXPANSION) > 0 ORDER BY `label` DESC',
          'SELECT `label`, MATCH (`label`) AGAINST (? WITH QUERY EXPANSION) AS `score` FROM `TABLE` ORDER BY `score` DESC',
          'SELECT MATCH (`label`) AGAINST (? WITH QUERY EXPANSION) AS `score` FROM `TABLE` WHERE MATCH (`label`) AGAINST (? WITH QUERY EXPANSION) > 0 ORDER BY `score` DESC',
          'SELECT `label`, MATCH (`label`) AGAINST (? WITH QUERY EXPANSION) AS `score` FROM `TABLE` WHERE MATCH (`label`) AGAINST (? WITH QUERY EXPANSION) > 0 ORDER BY `score` DESC',
          'SELECT `label` FROM `TABLE` ORDER BY MATCH (`label`) AGAINST (? WITH QUERY EXPANSION) DESC',
        ]
        sqlList.forEach(sql => {
          expect(getParsedSql(sql)).to.equal(sql)
          expect(getParsedSql(sql, mariadb)).to.equal(sql)
        })
      })

      it('should support bit function and operators', () => {
        const sqlList = [
          'SELECT 127 | 128, 128 << 2, BIT_COUNT(15)',
          `SELECT '127' | '128', '128' << 2, BIT_COUNT('15')`,
          `SELECT X'7F' | X'80', X'80' << 2, BIT_COUNT(X'0F')`,
          `SELECT HEX(UUID_TO_BIN('6ccd780c-baba-1026-9564-5b8c656024db'))`,
          `SELECT HEX(INET6_ATON('fe80::219:d1ff:fe91:1a72'))`,
          `SELECT X'40' | X'01', b'11110001' & b'01001111'`,
          `SELECT _BINARY X'40' | X'01', b'11110001' & _BINARY b'01001111'`,
          `SELECT _BINARY X'4040404040404040' | X'0102030405060708'`,
          `SELECT 64 | 1, X'40' | X'01'`,
        ]
        sqlList.forEach(sql => {
          expect(getParsedSql(sql)).to.equal(sql)
          expect(getParsedSql(sql, mariadb)).to.equal(sql)
        })
      })
    })

    describe('into', () => {
      it('should support select into variables', () => {
        let sql = 'SELECT * INTO @myvar FROM t1;'
        let parsedSQL = 'SELECT * INTO @myvar FROM `t1`'
        expect(getParsedSql(sql)).to.equal(parsedSQL)
        expect(getParsedSql(sql, mariadb)).to.equal(parsedSQL)
        sql = 'SELECT * FROM t1 INTO @myvar FOR UPDATE;'
        parsedSQL = 'SELECT * FROM `t1` INTO @myvar FOR UPDATE'
        expect(getParsedSql(sql)).to.equal(parsedSQL)
        expect(getParsedSql(sql, mariadb)).to.equal(parsedSQL)
        sql = 'SELECT * FROM t1 FOR UPDATE INTO @myvar;'
        parsedSQL = 'SELECT * FROM `t1` FOR UPDATE INTO @myvar'
        expect(getParsedSql(sql)).to.equal(parsedSQL)
        expect(getParsedSql(sql, mariadb)).to.equal(parsedSQL)
        sql = 'SELECT id, data INTO @x, @y FROM test.t1 LIMIT 1;'
        parsedSQL = 'SELECT `id`, `data` INTO @x, @y FROM `test`.`t1` LIMIT 1'
        expect(getParsedSql(sql)).to.equal(parsedSQL)
        expect(getParsedSql(sql, mariadb)).to.equal(parsedSQL)
      })

      it('should support select into outfile', () => {
        const sql = `SELECT * FROM (VALUES ROW(1,2,3),ROW(4,5,6),ROW(7,8,9)) AS t
        INTO OUTFILE '/tmp/select-values.txt';`
        const parsedSQL = "SELECT * FROM (VALUES ROW(1,2,3), ROW(4,5,6), ROW(7,8,9)) AS `t` INTO OUTFILE '/tmp/select-values.txt'"
        expect(getParsedSql(sql)).to.equal(parsedSQL)
        expect(getParsedSql(sql, mariadb)).to.equal(parsedSQL)
      })

      it('should support select into dumpfile', () => {
        const sql = `SELECT * FROM (VALUES ROW(1,2,3),ROW(4,5,6),ROW(7,8,9)) AS t
        INTO DUMPFILE '/tmp/select-values.txt';`
        const parsedSQL = "SELECT * FROM (VALUES ROW(1,2,3), ROW(4,5,6), ROW(7,8,9)) AS `t` INTO DUMPFILE '/tmp/select-values.txt'"
        expect(getParsedSql(sql)).to.equal(parsedSQL)
        expect(getParsedSql(sql, mariadb)).to.equal(parsedSQL)
      })

      it('should return empty when into is null', () => {
        expect(selectIntoToSQL()).to.be.undefined
        expect(selectIntoToSQL({})).to.be.undefined
      })
    })
  })

})