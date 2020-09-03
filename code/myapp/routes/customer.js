var express = require('express');
var router = express.Router();
//引入数据库包
var db = require("./db.js");



router.get('/add', function (req, res) {
    res.render('add.html');
});
router.post('/add', function (req, res) {

    var recipient = req.body.recipient;
    var cardholder = req.body.cardholder;
    var drawee = req.body.drawee;
    var issuing_bank = req.body.issuing_bank;
    var bill_day = req.body.bill_day;
    var repayment_date = req.body.repayment_date;
    var total = req.body.total;
    var repayable = req.body.repayable;
    var balance = req.body.balance;
    var loan = req.body.loan;
    var service_charge = req.body.service_charge;
    var telephone = req.body.telephone;
    var password = req.body.password;
    var staff = req.body.staff;
    db.query("insert into customer(recipient,cardholder,drawee,issuing_bank,bill_day,repayment_date,total,repayable,balance,loan,service_charge,telephone,password,staff) values('" + recipient + "','"
        + cardholder + "','" + drawee + "','" + issuing_bank + "',"
        + bill_day + "," + repayment_date + ","
        + total + "," + repayable + "," + balance + ","
        + loan + "," + service_charge + ",'" + telephone + "','" + password + "','" + staff + "')", function (err, rows) {
        if (err) {
            res.end('新增失败：' + err);
        } else {
            res.redirect('/customer/ass');
        }
    })
});
router.get('/asd', function (req, res) {
    res.render('index.html');
});
/**
 * 删
 */
router.get('/del/:id', function (req, res) {
    var id = req.params.id;
    db.query("delete from customer where id=" + id, function (err, rows) {
        if (err) {
            res.end('删除失败：' + err)
        } else {
            res.redirect('/customer/ass')
        }
    });
});


/**
 * 查询列表页
 */

router.get('/ass', function (req, res, next) {
    db.query('select * from customer', function (err, rows) {
        console.log('==========');
        if (err) {
            res.render('customer.html', {title: 'Express', datas: []});  // this renders "views/users.html"
        } else {
            res.render('customer.html', {title: 'Express', datas: rows});
        }
    })
});
/**
 * 修改
 */
router.get('/toUpdate/:id', function (req, res) {
    var id = req.params.id;
    db.query("select * from customer where id=" + id, function (err, rows) {
        if (err) {
            res.end('修改页面跳转失败：' + err);
        } else {
            res.render("update.html", {datas: rows});       //直接跳转
        }
    });
});
/**
 * 修改用户信息
 */
router.post('/update', function (req, res) {
    var id = req.body.id;
    var recipient = req.body.recipient;
    var cardholder = req.body.cardholder;
    var drawee = req.body.drawee;
    var issuing_bank = req.body.issuing_bank;
    var bill_day = req.body.bill_day;
    var repayment_date = req.body.repayment_date;
    var total = req.body.total;
    var repayable = req.body.repayable;
    var balance = req.body.balance;
    var loan = req.body.loan;
    var service_charge = req.body.service_charge;
    var telephone = req.body.telephone;
    var password = req.body.password;
    var staff = req.body.staff;

    db.query("update customer set recipient='" + recipient + "',cardholder='" + cardholder + "',drawee='" + drawee + "',issuing_bank='" + issuing_bank + "',bill_day='" + bill_day + "',repayment_date='" + repayment_date + "',total='" + total + "',repayable='" + repayable + "',balance='" + balance + "',loan='" + loan + "',service_charge='" + service_charge + "',telephone='" + telephone + "',password='" + password + "',staff='" + staff + "' where id=" + id, function (err, rows) {
        if (err) {
            res.end('修改失败：' + err);
        } else {
            res.redirect('/customer/ass');
        }
    });
});



module.exports = router;
