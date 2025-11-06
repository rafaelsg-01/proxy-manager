
/*
DROP TABLE IF EXISTS increment;
*/


create table increment
(
    increment_id                                      integer primary key autoincrement,

    host_increment                                    text unique,
    proxy_count_increment                             number
);

CREATE INDEX index_host_increment ON increment(host_increment);
