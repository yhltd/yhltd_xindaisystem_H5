const sql = require('mssql');
//连接方式："mssql://用户名:密码@ip地址:1433(默认端口号)/数据库名称"
sql.connect("mssql://sa:Lyh07910_001@yhocn.cn:1433/wenliuxian").then(function() {
    // Query
    new sql.Request().query('select * from wenliuxianpuyang').then(function(recordset) {
        console.log(1123);
        console.log(recordset[1]);
        // document.getElementById('res').innerText=recordset
    }).catch(function(err) {
        console.log(err);
    });
    // Stored Procedure
}).catch(function(err) {
    console.log(err);
})