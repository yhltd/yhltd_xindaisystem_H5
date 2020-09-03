var express = require('express');
var router = express.Router();
//引入数据库包
var db = require("./db.js");


/**
 * 查询列表页
 */

router.get('/ass', function (req, res, next) {
    db.query('select b.*,sum(a.repayment) as repayment,sum(a.swipe) as swipe,' +
        'sum(a.repayment)-sum(a.swipe) as balance_of_credit_card,' +
        'sum(a.basics_service_charge)+sum(a.other_service_charge) as the_total_fee,' +
        'sum(a.swipe)*(b.service_charge)+sum(a.repayment)-sum(a.swipe) as collected_amount,' +
        'sum(a.swipe)*(b.service_charge)-sum(a.basics_service_charge)+sum(a.other_service_charge) as profit ' +
        'from day_trading as a,customer as b ' +
        'where a.id=b.id ' +
        'group by b.id', function (err, rows) {
        console.log('==========');
        if (err) {
            res.render('../views/month_trading/month_trading.html', {title: 'Express', datas: []});  // this renders "views/users.html"
        } else {
            res.render('../views/month_trading/month_trading.html', {title: 'Express', datas: rows});
        }
    })
});

module.exports = router;