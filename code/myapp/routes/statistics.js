var express = require('express');
var router = express.Router();
//引入数据库包
var db = require("./db.js");


/**
 * 查询列表页
 */

router.get('/ass', function (req, res, next) {
    db.query('select date_format(a.date_time, \'%Y-%m-%d\') as date1,sum(a.repayment) as repayment,sum(a.swipe) as swipe,(sum(a.basics_service_charge)+sum(a.other_service_charge)) as the_total_fee,sum(a.swipe)*(b.service_charge)-sum(a.basics_service_charge)+sum(a.other_service_charge) as profit from day_trading as a,customer as b where a.id=b.id group by date1', function (err, rows) {
        console.log('==========');

        if (err) {
            res.render('../views/statistics/statistics.html', {title: 'Express', datas: []});  // this renders "views/users.html"
        } else {
            res.render('../views/statistics/statistics.html', {title: 'Express', datas: rows});
        }
    })
});


module.exports = router;
