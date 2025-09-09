
///引入依赖
const mssql = require('mssql');

//方法对象
const units1 = {
    sql: function (sql, callback) {
        ///连接池
        new mssql.ConnectionPool(units1.config())
            .connect()
            .then(pool => {
                let ps = new mssql.PreparedStatement(pool);
                ps.prepare(sql, err => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    ps.execute('', (err, result) => {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        ps.unprepare(err => {
                            if (err) {
                                console.log(err);
                                callback(err, null);
                                return;
                            }
                            callback(err, result);
                        });
                    });
                });
            }).catch(err => {
            console.log("Database Connection Failed! Bad Config:", err);
        });
    },
    /*
   * 默认config对象
   * @type {{user: string, password: string, server: string, database: string, pool: {min: number, idleTimeoutMillis: number}}}
   */
    config: function () {
        return {
            user: 'sa',  //用户名
            password: 'Lyh07910_001',  //密码
            server: 'yhocn.cn',  //服务器地址
            database: 'yh_notice',   //要操作的数据库名字
            port: 1433,                       //端口号，默认为1433
            pool: {
                min: 0,                         //连接池最小连接数，默认0
                max: 10,                        //连接池最大连接数，默认10
                idleTimeoutMillis: 3000         //设置关闭未使用连接的时间，单位ms默认30000
            },
        }
    }
}

module.exports = units1;


