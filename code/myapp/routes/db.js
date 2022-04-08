// MySQL数据库联接配置
var mysql = require('mysql');

var pool = mysql.createPool({
    host: 'yhocn.com',
    user: 'root',
    password: 'Lyh07910',
    database: 'testdb',
    dateString: true
});

function query(sql, callback) {
    pool.getConnection(function (err, connection) {
        if(connection == undefined){
            callback();
        }
        connection.query(sql, function (err, rows) {
            callback(err, rows);
            connection.release();//释放链接
        });
    });
}

exports.query = query;