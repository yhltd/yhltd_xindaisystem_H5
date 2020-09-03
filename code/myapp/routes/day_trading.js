var express = require('express');
var router = express.Router();
//引入数据库包
var db = require("./db.js");


/**
 * 删
 */
router.get('/del/:did', function (req, res) {
    var did = req.params.did;
    db.query("delete from day_trading where did=" + did, function (err, rows) {
        if (err) {
            res.end('删除失败：' + err)
        } else {
            res.redirect('/customer/ass');
        }
    });
});




/**
 * 修改用户信息
 */
router.post('/update', function (req, res) {
    var did = req.body.did;
    var repayment = req.body.repayment;
    var commercial = req.body.commercial;
    var swipe = req.body.swipe;
    var rate = req.body.rate;
    var arrival_amount = req.body.arrival_amount;
    var basics_service_charge = req.body.basics_service_charge;
    var other_service_charge = req.body.other_service_charge;

    db.query("update day_trading set repayment='" + repayment + "',commercial_tenant='" + commercial + "',swipe='" + swipe + "',rate='" + rate + "',arrival_amount='" + arrival_amount + "',basics_service_charge='" + basics_service_charge + "',other_service_charge='" + other_service_charge + "' where did='" + did + "'", function (err, rows) {
        if (err) {
            res.end('修改失败：' + err);
        } else {
            res.redirect('/customer/ass');
        }
    });
});

/**
 * 修改
 */
router.get('/toUpdate/:did', function (req, res) {
    var did = req.params.did;
    db.query("select * from day_trading where did=" + did, function (err, rows) {
        if (err) {
            res.end('修改页面跳转失败：' + err);
        } else {
            res.render("../views/day_trading/day_trading_update.html", {datas: rows});       //直接跳转
        }
    });
});


router.get('/insert/:id', function (req, res) {
    var id = req.params.id;
    db.query("select * from customer where id=" + id, function (err, rows) {
        if (err) {
            res.end('修改页面跳转失败：' + err);
        } else {
            res.render("../views/day_trading/day_trading_add.html", {datas: rows});       //直接跳转
        }
    });
});

router.get('/add', function (req, res) {
    res.render('../views/day_trading/day_trading_add.html');
});
router.post('/add', function (req, res) {

    var id = req.body.id;

    var myDate = new Date();
    var n=myDate.getFullYear();
    var y=myDate.getMonth()
    var r=myDate.getDate();
    var x=myDate.getHours();
    var f=myDate.getMinutes();
    var date_time = n+"-"+y+"-"+r+" "+x+":"+f;

    var repayment = req.body.repayment;
    var commercial = req.body.commercial;
    var swipe = req.body.swipe;
    var rate = req.body.rate;
    var arrival_amount = req.body.arrival_amount;
    var basics_service_charge = req.body.basics_service_charge;
    var other_service_charge = req.body.other_service_charge;

    db.query("insert into day_trading(id,date_time,repayment,commercial_tenant,swipe,rate,arrival_amount,basics_service_charge,other_service_charge) values('" + id + "','"
        + date_time + "',"
        + repayment + "," + commercial + "," + swipe + ","
        + rate + "," + arrival_amount + ",'" + basics_service_charge + "','" + other_service_charge + "')", function (err, rows) {
        if (err) {
            res.end('新增失败：' + err);
        } else {
            res.redirect('/customer/ass');
            /*res.redirect('/customer/ass');*/
        }
    })
});


router.get('/ass/:id', function (req, res, next) {
    var id = req.params.id;
    db.query("select * from day_trading where id=" + id+ "" , function (err, rows) {
        console.log('==========');
        if (err) {
            res.render('../views/day_trading/day_trading.html', {title: 'Express', datas: []});  // this renders "views/users.html"
        } else {
            res.render('../views/day_trading/day_trading.html', {title: 'Express', datas: rows});
        }
    })
});

router.get('/select_day/:id', function (req, res, next) {
    var id = req.params.id;
    db.query("select * from day_trading right join customer on customer.id = day_trading.id where customer.id=" + id+ "" , function (err, rows) {
        console.log('==========');
        if (err) {
            res.render('../views/day_trading/day_trading.html', {title: 'Express', datas: []});  // this renders "views/users.html"
        } else {
            res.render('../views/day_trading/day_trading.html', {title: 'Express', datas: rows});
        }
    })
});
module.exports = router;