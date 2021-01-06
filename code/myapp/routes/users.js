var express = require('express');
var router = express.Router();
//引入数据库包
var db = require("./db.js");
//const fs = require("fs");
const crypto = require("crypto");
//const path = require("path")
 //LocalStorage = require('node-localstorage')
function encrypt (key, iv, data) {
    let decipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    // decipher.setAutoPadding(true);
    return decipher.update(data, 'binary', 'base64') + decipher.final('base64');
}

function decrypt (key, iv, crypted) {
    crypted = new Buffer(crypted, 'base64').toString('binary');
    let decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    return decipher.update(crypted, 'binary', 'utf8') + decipher.final('utf8');
}
if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
}
router.get('/', function(req, res, next) {
    var datas = localStorage.getItem("token");
    //console.log(datas)
    if(datas != null){
        console.log("datas")
        let key = '123456789abcdefg';
        //console.log('加密的key:', key);
        let iv = 'abcdefg123456789';
        //console.log('加密的iv:', iv);
        let data = JSON.parse(decrypt(key, iv, datas));

        //console.log("数据解密后:", data);
        //console.log(typeof data)
        var value = Object.values(data);
        //console.log(value+"11");
        var company = value[0];
        var account = value[1];
        var password = value[2];
        res.render("users.html",{company:company,account:account,password:password})

    }else{
        res.render("users.html");
    }
//     // res.render('users.html', { title: 'ExpressTitle' });
});
/**
 * 登录
 */
router.post('/search', function (req, res) {
    var company = req.body.company;
    var account = req.body.account;
    var password = req.body.password;
    var isRem = req.body.isRem;
    //console.log(company, account, password,isRem);
    var sql="select * from users where company='" + company+"'and account='" +account+ "'and password='"+password+"'" ;
    db.query(sql, function(err, rows){
        var value = JSON.stringify(rows);						//将rows转为字符串
        var value = JSON.parse(value);                          //再转换为为 JavaScript 对象

        console.log(value);
        if (err) {
            res.end('登录失败：' + err);
        }
        for(var i=0;i<value.length;i++){						//因为得到的value值是一个数据，所以需要将它循环
            if(company === value[i].company && account === value[i].account && password === value[i].password){	//判断输入的内容是否与数据库的内容相等。
                console.log('登陆成功')//登陆成功后将用户和密码写入Cookie，maxAge为cookie过期时间

                res.cookie('account', value[i].account, { maxAge: 1000*60*60*24 }) //生成一个cookie，并交给浏览器保存
                res.cookie('company',value[i].company,{ maxAge: 1000*60*60*24 })
                if (isRem){
                    let key = '123456789abcdefg';
                    //console.log('加密的key:', key);
                    let iv = 'abcdefg123456789';
                    //console.log('加密的iv:', iv);

                    var datas = {
                        company: value[i].company,
                        account: value[i].account,
                        password: value[i].password
                    };
                    //console.log(typeof datas)
                    datas = encrypt(key, iv, JSON.stringify(datas));
                    //console.log("数据加密后:", datas);
                   localStorage.setItem("token", datas);
                }
                if (isRem == undefined){
                    localStorage.removeItem("token")
                }
                res.render("index.html", { datas: rows });
                return;
            }
        }
        console.log('公司名称或账户或密码错误');
        res.redirect("/users");
    });


});

/**
 * 查询列表页
 */

router.get('/ass', function (req, res, next) {
    //var id = req.params.id;
    var account = req.cookies.account
    console.log(account);
    var sql = 'select * from users';
    if(account == '000001'){
         sql = sql;
    }else{
         sql += ' where account = "' +account+'"';
    }
    db.query(sql , function (err, rows) {
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
