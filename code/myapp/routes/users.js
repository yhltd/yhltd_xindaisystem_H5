var express = require('express');
var router = express.Router();
//引入数据库包
var db = require("./db.js");

router.get('/', function(req, res, next) {
    res.render('users.html', { title: 'ExpressTitle' });
});
/**
 * 登录
 */
router.post('/search', function (req, res) {
    var company = req.body.company;
    var account = req.body.account;
    var password = req.body.password;
    console.log(company, account, password);


    var sql="select * from users where company='" + company+"'and account='" +account+ "'and password='"+password+"'" ;
    //var sqlvalue = [company,account,password]; //sql的内容
    db.query(sql, function(err, rows){
        var value = JSON.stringify(rows);						//将rows转为字符串
        var value = JSON.parse(value);							//再转换为为 JavaScript 对象
        console.log(value);
        if (err) {
            res.end('登录失败：' + err);
        }
        for(var i=0;i<value.length;i++){						//因为得到的value值是一个数据，所以需要将它循环
            if(company === value[i].company && account === value[i].account && password === value[i].password){	//判断输入的内容是否与数据库的内容相等。
                console.log('登陆成功');
                res.cookie('id', value[i].id, { maxAge: 1000*60*60*24 }) //生成一个cookie，并交给浏览器保存
                res.render("index.html", { datas: rows });
                return;
            }
        }
        console.log('公司名称或账户或密码错误');
        res.redirect("/users");
    });

    // var sql = "select * from users where account=" + account ;
    // db.query(sql, function (err, rows) {
    //     if (err) {
    //         res.end("登陆失败：", err)
    //     } else {
    //         if(rows.password === password && rows.company === company){
    //             res.render("index.html", { datas: rows });
    //         }
    //     }
    // });
});

/**
 * 查询列表页
 */

router.get('/ass', function (req, res, next) {
    //var id = req.params.id;
    const id = req.cookies.id
    db.query("select * from users where id =" +id , function (err, rows) {
        console.log('==========');
        if (err) {
            res.render('staff.html', {title: 'Express', datas: []});
        } else {
            res.render('staff.html', {title: 'Express', datas: rows});
        }
    })
});
/**
 * 新增页面跳转
 */

router.get('/uadd', function (req, res) {
    res.render('users1/uadd.html');
});
router.post('/uadd', function (req, res) {
    var company = req.body.company;
    var position = req.body.position;
    var uname = req.body.uname;
    var account = req.body.account;
    var password = req.body.password;
    db.query("insert into users(company,position,uname,account,password) " +
        "values('" + company + "','" + position + "','" + uname + "','" + account + "','" + password + "')", function (err, rows) {
        if (err) {
            res.end('新增失败：' + err);
        } else {
            res.redirect('/users/ass');
        }
    })
});

/**
 * 删
 */
router.get('/del/:id', function (req, res) {
    var id = req.params.id;
    db.query("delete from users where id=" + id, function (err, rows) {

        if (err) {
            res.end('删除失败：' + err)
        } else {
            res.redirect('/users/ass')
        }
    });
});
/**
 * 修改
 */
router.get('/toUpdate/:id', function (req, res) {
    var id = req.params.id;
    db.query("select * from users where id=" + id, function (err, rows) {
        if (err) {
            res.end('修改页面跳转失败：' + err);
        } else {
            res.render("users1/uupdate.html", {datas: rows});       //直接跳转
        }
    });
});
router.post('/update', function (req, res) {
    var id = req.body.id;
    var company = req.body.company;
    var position = req.body.position;
    var uname = req.body.uname;
    var account = req.body.account;
    var password = req.body.password;
    db.query("update users set company='" + company + "',position='" + position + "', uname='" + uname + "', account='" + account + "', password='" + password + "' where id=" + id, function (err, rows) {
        if (err) {
            res.end('修改失败：' + err);
        } else {
            res.redirect('/users/ass');
        }
    });
});



module.exports = router;
