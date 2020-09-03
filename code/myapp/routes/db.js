// MySQL数据库联接配置
var mysql = require('mysql');
var pool = mysql.createPool({
    host: 'yhocn.cn',
    user: 'root',
    password: 'Lyh07910',
    database: 'testdb',
    dateString:true
});

function query(sql, callback) {
    pool.getConnection(function (err, connection) {
        // Use the connection
        connection.query(sql, function (err, rows) {
            callback(err, rows);
            connection.release();//释放链接
        });
    });
}


// var mysql      = require('mysql');
// var connection = mysql.createConnection({
//   host     : 'localhost',
//   user     : 'root',
//   password : '123456',
//   database : 'testdb'
// });

// connection.connect();

// connection.query(sql, function (error, results, fields) {
//   if (error) throw error;
//   console.log('The solution is: ', results[0].solution);
// });

// connection.end();

exports.query = query;