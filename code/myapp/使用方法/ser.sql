create database testdb;
use testdb;
create table userinfo(
 id                                        int not null auto_increment,
 name                                  varchar(20) not null,
age                                      int not null,
primary key (id)          
)