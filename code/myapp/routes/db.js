// MySQL数据库联接配置
var mysql = require('mysql');

var pool = mysql.createPool({
    host: 'yhocn.cn',
    user: 'root',
    password: 'Lyh07910',
    database: 'testdb',
    dateString: true,
    connectionLimit: 50,      // 增加连接数到50
    acquireTimeout: 30000,    // 获取连接超时30秒
    connectTimeout: 15000,    // 连接超时15秒
    timeout: 60000,          // 查询超时60秒
    waitForConnections: true
});

//
// function query(sql, callback) {
//     pool.getConnection(function (err, connection) {
//         if(connection == undefined){
//             callback();
//         }
//         connection.query(sql, function (err, rows) {
//             callback(err, rows);
//             connection.release();//释放链接
//         });
//     });
// }
function query(sql, params, callback) {
    // 如果只有两个参数，params可能是callback
    if (arguments.length === 2) {
        callback = params;
        params = [];
    }

    // 检查callback是否为函数
    if (typeof callback !== 'function') {
        console.error("❌ callback不是函数！");
        console.error("SQL:", sql);
        console.error("params:", params);
        return;
    }

    pool.getConnection(function (err, connection) {
        if (err) {
            console.error("获取连接失败:", err);
            return callback(err, null);
        }

        if (!connection) {
            console.error("连接为undefined");
            return callback(new Error("数据库连接失败"), null);
        }

        // 执行查询（支持参数）
        connection.query(sql, params, function (err, rows) {
            // 错误处理
            if (err) {
                console.error("SQL执行错误:", err);
                console.error("SQL语句:", sql);
                console.error("参数:", params);
            }

            // 释放连接
            try {
                connection.release();
            } catch (e) {
                console.error("释放连接失败:", e);
            }

            // 回调
            callback(err, rows);
        });
    });
}

exports.query = query;