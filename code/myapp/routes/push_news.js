
let express = require('express');
let router = express.Router();
//引入数据库包
let db = require("./db_sql");

// router.get('/getnews', function (req, res) {
//     console.log('📢 getnews接口被调用');
//
//     // var sql = `SELECT * FROM product_pushnews WHERE gsname = '云合未来' AND xtname = '云合智慧门店收银系统'`;
//     var sql = `SELECT * FROM product_pushnews WHERE gsname = '合肥康飞金融有限公司' AND xtname = '云合智慧门店收银系统'AND (qidate IS NULL OR GETUTCDATE() >= CONVERT(DATETIME, LEFT(qidate, 10), 120))AND (zhidate IS NULL OR GETUTCDATE() <= CONVERT(DATETIME, LEFT(zhidate, 10), 120))`;
//
//     db.sql(sql, function(err, results) {
//         if (err) {
//             console.error('数据库错误:', err);
//             return res.status(500).json({
//                 success: false,
//                 message: '数据库查询失败',
//                 error: err.message
//             });
//         }
router.get('/getnews', function (req, res) {
    console.log('📢 getnews接口被调用');

    // 从查询参数中获取公司名称
    var companyName = req.query.company || '合肥康飞金融有限公司';
    console.log('使用的公司名称:', companyName);

    // 使用动态的公司名称
    var sql = `SELECT * FROM product_pushnews WHERE gsname = '${companyName}' AND xtname = '云合智慧门店收银系统' AND (qidate IS NULL OR GETUTCDATE() >= CONVERT(DATETIME, LEFT(qidate, 10), 120)) AND (zhidate IS NULL OR GETUTCDATE() <= CONVERT(DATETIME, LEFT(zhidate, 10), 120))`;

    db.sql(sql, function(err, results) {
        if (err) {
            console.error('数据库错误:', err);
            return res.status(500).json({
                success: false,
                message: '数据库查询失败',
                error: err.message
            });
        }
        // 添加调试信息
        console.log('数据库返回结果数量:', results.length);
        console.log('具体数据:', JSON.stringify(results, null, 2));

        res.json({
            success: true,
            data: results,
            message: '获取新闻列表成功'
        });
    });
});
module.exports = router;