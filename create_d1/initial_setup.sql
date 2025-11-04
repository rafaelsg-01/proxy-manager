
/*
DROP TABLE IF EXISTS increment;
*/


create table increment
(
    increment_id                                      integer primary key autoincrement,

    origin_increment                                  text unique,
    proxy_count_increment                             number
);

CREATE INDEX index_origin_increment ON increment(origin_increment);
