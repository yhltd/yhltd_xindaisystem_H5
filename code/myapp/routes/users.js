var express = require('express');
var router = express.Router();
//引入数据库包
var db = require("./db.js");
var nodeExcel = require('excel-export');
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
    //localStorage.removeItem("token")
    var datas = localStorage.getItem("token");
    //console.log(datas)
    if(datas != null) {
        console.log("datas-->" + datas)
        let key = '123456789abcdefg';
        //console.log('加密的key:', key);
        let iv = 'abcdefg123456789';
        //console.log('加密的iv:', iv);
        let data = JSON.parse(decrypt(key, iv, datas));
        console.log(data + "11");
        //console.log("数据解密后:", data);
        //console.log(typeof data)
        var value = Object.values(data);
        console.log(value + "11");
        var company = value[0];
        var account = value[1];
        var password = value[2];
        var isRem = value[4];
        if (isRem) {
            res.render("users.html", {company: company, account: account, password: password})
        } else {
            res.render("users.html");
        }
    }else{
        res.render('users.html', { title: 'ExpressTitle' });
    }
});
/**
 * 登录
 */
router.post('/search', function (req, res) {
    localStorage.removeItem("token")
    let company = req.body.company;
    let account = req.body.account;
    let password = req.body.password;
    let isRem = req.body.isRem;
    let sql="select u.*,m.`Add`,m.`Del`,m.`Upd`,m.`Sel`,m.`Table` from users as u left join management as m on u.id = m.Uid where u.company = '"+company+"' and u.account='"+account+"' and u.`password` = '"+password+"'" ;
    db.query(sql, function(err, rows){
        let value = JSON.stringify(rows);						//将rows转为字符串
        value = JSON.parse(value);                          //再转换为为 JavaScript 对象
        if (err) {
            res.end('登录失败：' + err);
        }
        if(rows.length>0){
            if(company === value[0].company && account === value[0].account && password === value[0].password){	//判断输入的内容是否与数据库的内容相等。
                console.log('登陆成功')
                //登陆成功后将用户和密码写入Cookie，maxAge为cookie过期时间
                //res.cookie('account', value[0].account, { maxAge: 1000*60*60*24 }) //生成一个cookie，并交给浏览器保存
                //res.cookie('company',value[0].company,{ maxAge: 1000*60*60*24 })
                let key = '123456789abcdefg';
                let iv = 'abcdefg123456789';
                let findTable = function(id,value){
                    for(let index=0;index<value.length;index++){
                        if(value[index].Table==id){
                            return {
                                add: value[index].Add,
                                del: value[index].Del,
                                upd: value[index].Upd,
                                sel: value[index].Sel
                            }
                        }
                    }
                }
                let table = {
                    1: findTable(1,value),
                    2: findTable(2,value),
                    3: findTable(3,value),
                    4: findTable(4,value),
                    5: findTable(5,value)
                }

                let datas = {
                    company: value[0].company,
                    account: value[0].account,
                    password: value[0].password,
                    table : table,
                    isRem:isRem
                };
                console.log(datas)
                datas = encrypt(key, iv, JSON.stringify(datas));
                localStorage.setItem("token", datas);
                // if (isRem){
                //
                // }
                // if (isRem == undefined){
                //     localStorage.removeItem("token")
                // }
                res.render("index.html", { datas: rows });
            }
        }else{
            res.redirect('/users')
        }
    });


});

/**
 * 查询列表页
 */

router.get('/ass', function (req, res, next) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key,iv,token));

    if(data.table["5"].sel == 1){
    }else{
        res.render('me.html', { title: 'ExpressTitle',msg: '无权限查看' });
    }

        // var account = req.cookies.account
        // console.log(account);
        let isSelect = req.query.pagenum == undefined;
        let sql1 = 'select count(*) as count from users';
        db.query(sql1,function (err,rows) {
            if(err){
                console.log(err);
            }else {
                let value = rows;
                let result = {
                    datas: [],
                    rowcounts: 0,
                    pagecounts: 0,
                    pagenum: 0,
                    pageSize: 6
                }
                console.log("isSelect=>", isSelect)
                if (isSelect) {
                    result.rowcounts = value[0].count
                    result.pagecounts = Math.ceil(result.rowcounts / result.pageSize)
                    result.pagenum = 1
                } else {
                    result.rowcounts = value[0].count
                    result.pagecounts = Math.ceil(result.rowcounts / result.pageSize)
                    result.pagenum = parseInt(req.query.pagenum <= 0 ? 1 : req.query.pagenum >= result.pagecounts ? result.pagecounts : req.query.pagenum);
                }
                //console.log("result-->"+result)
                let sql = "select * from users where company = '" + data.company +"'";
                sql += " limit " + (result.pagenum - 1) * result.pageSize + "," + result.pageSize;
                db.query(sql, function (err, rows) {
                    if (err) {
                        res.render('staff.html', {title: 'Express', datas: []});
                    } else {
                        result.datas = rows
                        console.log("result=>",result)
                        res.render('staff.html', {
                            title: 'Express',
                            ...result
                        });
                    }
                });
            }
        });
});
/**
 * 新增页面跳转
 */

router.get('/uadd', function (req, res) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key,iv,token));
    if(data.table["5"].add == 1){
        res.render('users1/uadd.html');
    }else{
        res.render('me.html', { title: 'ExpressTitle',msg: '无权限录入' });
    }

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
            db.query("select max(id) as uid from users",function (err,rows){
                let value = rows;
                console.log("value-->"+value)
                let uid = value[0].uid
                for(var i=1;i<=5;i++){
                    let sql = "insert into management(Uid,`Add`,Del,Upd,Sel,`Table`) " +
                        "values("+ uid + ",'0','0','0','0','" + i + "')";
                    //"values("+ uid + ",'"+ 0 +"','"+0+"','"+0+"','"+0+"','" + i + "')";
                    console.log(sql)
                    db.query(sql,function (err, rows) {
                        if(err){
                            res.end('新增失败：' + err);
                        }else{
                            //console.log(sql)
                        }
                    });
                }
            });
            res.redirect('/users/ass');
        }
    })
});

/**
 * 删
 */
router.get('/del/:id', function (req, res) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key,iv,token));
    if(data.table["5"].del == 1){
        var id = req.params.id;
        db.query("delete from users where id=" + id, function (err, rows) {
            
            if (err) {
                res.end('删除失败：' + err)
            } else {
                db.query("delete from management where uid=" + id,function (err,rows) {
                    if(err){
                        res.end('权限删除失败：' + err)
                    }
                })
                res.redirect('/users/ass')
            }
        });
    }else{
        res.render('me.html', { title: 'ExpressTitle',msg: '无权限删除' });
    }

});
/**
 * 修改
 */
router.get('/toUpdate/:id', function (req, res) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key,iv,token));
    if(data.table["5"].upd == 1){
        var id = req.params.id;
        db.query("select * from users where id= '"+id+"'", function (err, rows) {
            if (err) {
                res.end('修改页面跳转失败：' + err);
            } else {
                res.render("users1/uupdate.html", {datas: rows});       //直接跳转
            }
        });
    }else{
        res.render('me.html', { title: 'ExpressTitle',msg: '无权限修改' });
    }
});

/**
 * 获取权限
 */
router.post('/getTableMe', function (req, res) {
    let userId = req.body.userId;
    let tableId = req.body.tableId;
    db.query("select `Add`,Del,Sel,Upd from management where Uid = '"+userId+"' and `Table` = '"+tableId+"'", function (err, rows) {
        if (err) {
            res.end('获取失败：' + err);
        } else {
            let result = JSON.stringify(rows)
            res.json(result);
        }
    });
});

/**
 * 修改权限
 */
router.post('/setTableMe', function (req, res) {
    let result = {
        code: '',
        msg: '',
        data: []
    }
    let me = JSON.parse(req.body.me);
    let tableId = req.body.tableId;
    let userId = req.body.userId;
    db.query("select count(*) as count from management where Sel = 1 and `Table` = 5", function (err, rows) {
        if(err){
            result.code = 500;
            result.msg = "修改失败，请稍后再试。";
            res.json(JSON.stringify(result));
            res.end('获取失败：' + err);
        }else{
            console.log("rows->",rows)
            let count = rows[0].count;
            if((count == 1 && tableId == 5) && (me.sel == 0 || (me.upd == 0 && me.sel == 1))){
                result.code = 402;
                result.msg = "必须存在一个可以修改和查看员工信息表的管理员";
                res.json(JSON.stringify(result));
            }else{
                db.query("update management set `Add` = '"+me.add+"',Del = '"+me.del+"',Sel = '"+me.sel+"',Upd = '"+me.upd+"' where Uid = '"+userId+"' and `Table` = '"+tableId+"'", function (err, rows) {
                    if (err) {
                        res.end('获取失败：' + err);
                    } else {
                        if(rows.affectedRows > 0){
                            let token = localStorage.getItem("token");
                            let key = '123456789abcdefg';
                            let iv = 'abcdefg123456789';
                            let data = JSON.parse(decrypt(key,iv,token));
                            data.table[tableId].add = me.add
                            data.table[tableId].del = me.del
                            data.table[tableId].sel = me.sel
                            data.table[tableId].upd = me.upd
                            let newToken = encrypt(key,iv,JSON.stringify(data))
                            localStorage.setItem("token",newToken);

                            result.code = 200;
                            result.msg = "修改成功"
                        }else{
                            result.code = 500;
                            result.msg = "未修改"
                        }
                        res.json(JSON.stringify(result));
                    }
                });
            }
        }
    })
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


router.all('/Excel', function(req, res, next) {

    selectParams = JSON.parse(localStorage.getItem("selectParams"));

    let sql = "select * from users" ;
    db.query(sql, function (err, rows) {
        if (err) {
            console.log(err);
        } else {
            let values = rows
            console.log("value=>",values)
        }
        let sql2 = JSON.stringify(sql);
        let sql3 = JSON.parse(sql2);
        console.log(sql3);
        var conf ={};
        conf.stylesXmlFile = "styles.xml";
        conf.name = "mysheet";
        conf.cols = [
            {
                caption:'序号',
                type:'number'
            },{
                caption:'公司名称',
                type:'string'
            },{
                caption:'职位',
                type:'string'
            },{
                caption:'员工',
                type:'string'
            },{
                caption:'账号',
                type:'string'
            },{
                caption:'密码',
                type:'string'
            }
        ];
        conf.rows = []
        for(let i=0;i<rows.length;i++){
            let row = [];
            row.push(rows[i].id)
            row.push(rows[i].company)
            row.push(rows[i].position)
            row.push(rows[i].uname)
            row.push(rows[i].account)
            row.push(rows[i].password)
            conf.rows.push(row)
        }
        var result = nodeExcel.execute(conf);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader("Content-Disposition", "attachment; filename=" + "Report.xlsx");
        res.end(result, 'binary');
    });
});
module.exports = router;
