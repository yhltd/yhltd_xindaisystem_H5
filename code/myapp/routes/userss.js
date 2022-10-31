let express = require('express');
let router = express.Router();
//引入数据库包
let db = require("./db.js");
let nodeExcel = require('excel-export');
//const fs = require("fs");
const crypto = require("crypto");
//const path = require("path")password_update
//LocalStorage = require('node-localstorage')
function encrypt(key, iv, data) {
    let decipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    // decipher.setAutoPadding(true);
    return decipher.update(data, 'utf8', 'base64') + decipher.final('base64');
}

function decrypt(key, iv, crypted) {
    if (crypted == undefined || crypted == '') {
        throw new Error("身份验证过期，请重新登录")
    }
    // crypted = new Buffer.from(crypted, 'base64').toString('binary');
    let decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    return decipher.update(crypted, 'base64', 'utf8') + decipher.final('utf8');
}

function toLiteral(str) {
    let dict = {'\b': 'b', '\t': 't', '\n': 'n', '\v': 'v', '\f': 'f', '\r': 'r'};
    return str.replace(/([\\'"\b\t\n\v\f\r])/g, function ($0, $1) {
        return '\\' + (dict[$1] || $1);
    });
}
if (typeof localStorage === "undefined" || localStorage === null) {
    let LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
}
router.get('/', function (req, res, next) {
    //localStorage.removeItem("token")
    let datas = localStorage.getItem("token");
    //console.log(datas)
    if (datas != null) {
        console.log("datas-->" + datas)
        let key = '123456789abcdefg';
        //console.log('加密的key:', key);
        let iv = 'abcdefg123456789';
        //console.log('加密的iv:', iv);
        let data = JSON.parse(decrypt(key, iv, datas));
        console.log(data + "11");
        //console.log("数据解密后:", data);
        //console.log(typeof data)
        let value = Object.values(data);
        console.log(value + "11");
        let company = value[0];
        let username = value[1];
        let password = value[2];
        let isRem = value[4];
        if (isRem) {
            res.render("userss.html", {company: company, username: username, password: password})
        } else {
            res.render("userss.html");
        }
    } else {
        res.render('userss.html', {title: 'ExpressTitle'});
    }
});
/**
 * 登录
 */
router.post('/search', function (req, res) {
    let dl = "用户"
    localStorage.removeItem("token")
    let company = req.body.company;
    company = toLiteral(company)
    console.log(company)
    let username = req.body.username;
    username = toLiteral(username)
    let password = req.body.password;
    password = toLiteral(password)
    let isRem = req.body.isRem;
    let sql = "select * from member_info where username = '" + username + "' and password = '" + password + "' and company = '" + company + "'";

    db.query(sql, function (err, rows) {
        try {
            let value = JSON.stringify(rows);						//将rows转为字符串
            value = JSON.parse(value);                          //再转换为为 JavaScript 对象
            if (err) {
                res.end('登录失败：');
            }
            if (rows.length > 0) {

                if (company === value[0].company && username === value[0].username && password === value[0].password) {	//判断输入的内容是否与数据库的内容相等。
                    console.log('登陆成功')
                    let key = '123456789abcdefg';
                    let iv = 'abcdefg123456789';

                    let datas = {
                        company: value[0].company,
                        account: value[0].username,
                        password: value[0].password,
                        table: [],
                        isRem: isRem,
                        id: value[0].id,
                        type: '客户',
                        uname: value[0].name
                    };
                    console.log(datas)
                    datas = encrypt(key, iv, JSON.stringify(datas));
                    localStorage.setItem("token", datas);
                    res.render("index1.html", {datas: rows});
                }else {
                    res.render('userss.html', {title: 'ExpressTitle', msg: '用户名密码错误'});
                }
            } else {
                res.render('userss.html', {title: 'ExpressTitle', msg: '用户名密码错误'});
            }
        } catch (e) {
            res.render("error.html", {error: '网络错误，请稍后再试'})
        }
    });
});


/**
 * 删
 */
router.get('/del/:id', function (req, res) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    if (data.table["5"].del == 1) {
        let id = req.params.id;
        db.query("delete from users where id=" + id, function (err, rows) {
            try {
                if (err) {
                    res.end('删除失败：')
                } else {
                    db.query("delete from management where uid=" + id, function (err, rows) {
                        if (err) {
                            res.end('权限删除失败：')
                        }
                    })
                    res.redirect('/userss/ass')
                }
            } catch (e) {
                res.render("error.html", {error: '网络错误，请稍后再试'})
            }
        });
    } else {
        res.render('me.html', {title: 'ExpressTitle', msg: '无权限删除'});
    }
});
/**
 * 修改
 */
router.get('/toUpdate/:id', function (req, res) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    let value = Object.values(data);
    console.log("value-->" + value)
    let result = {
        position: "",
        uname: "",
        account:"" ,
        password: ""
    }
    if (data.table["5"].upd == 1) {
        let id = req.params.id
        if (id == 0) {
            id = value[5];
        }
        db.query("select * from users where id= '" + id + "'", function (err, rows) {

            try {
                if (err) {
                    res.end('修改页面跳转失败：');
                } else {
                    console.log("rows:"+rows)
                    let values = JSON.stringify(rows);						//将rows转为字符串
                    values = JSON.parse(values);
                    result.position = values[0].position;
                    result.uname = values[0].uname;
                    result.account = values[0].account;
                    result.password = values[0].password;
                    console.log("result.uname-->"+result.uname)
                    res.render("users1/uupdate.html", {
                        datas:rows,
                        ...result
                    });       //直接跳转
                    console.log("result-->"+result)
                }
            } catch (e) {
                res.render("error.html", {error: '网络错误，请稍后再试'})
            }
        });

    } else {
        res.render('me.html', {title: 'ExpressTitle', msg: '无权限修改'});
    }
});

/**
 * 获取权限
 */
// router.post('/getTableMe', function (req, res) {
//     let userId = req.body.userId;
//     let tableId = req.body.tableId;
//
//     db.query("select `Add`,Del,Sel,Upd from management where Uid = '" + userId + "' and `Table` = '" + tableId + "'", function (err, rows) {
//         try {
//             if (err) {
//                 res.end('获取失败：');
//             } else {
//                 let result = JSON.stringify(rows)
//                 res.json(result);
//             }
//         } catch (e) {
//             res.render("error.html", {error: '网络错误，请稍后再试'})
//         }
//     });
// });

/**
 * 修改权限
 */
// router.post('/setTableMe', function (req, res) {
//     let result = {
//         code: '',
//         msg: '',
//         data: []
//     }
//     let me = JSON.parse(req.body.me);
//     let tableId = req.body.tableId;
//     let userId = req.body.userId;
//     db.query("select count(*) as count from management where Sel = 1 and `Table` = 5", function (err, rows) {
//         try {
//             if (err) {
//                 result.code = 500;
//                 result.msg = "修改失败，请稍后再试。";
//                 res.json(JSON.stringify(result));
//                 res.end('获取失败：');
//             } else {
//                 //console.log("rows->",rows)
//                 let count = rows[0].count;
//                 if ((count == 1 && tableId == 5) && (me.sel == 0 || (me.upd == 0 && me.sel == 1))) {
//                     result.code = 402;
//                     result.msg = "必须存在一个可以修改和查看员工信息表的管理员";
//                     res.json(JSON.stringify(result));
//                 } else {
//                     db.query("update management set `Add` = '" + me.add + "',Del = '" + me.del + "',Sel = '" + me.sel + "',Upd = '" + me.upd + "' where Uid = '" + userId + "' and `Table` = '" + tableId + "'", function (err, rows) {
//                         if (err) {
//                             res.end('获取失败：');
//                         } else {
//                             if (rows.affectedRows > 0) {
//                                 let token = localStorage.getItem("token");
//                                 let key = '123456789abcdefg';
//                                 let iv = 'abcdefg123456789';
//                                 let data = JSON.parse(decrypt(key, iv, token));
//                                 data.table[tableId].add = me.add
//                                 data.table[tableId].del = me.del
//                                 data.table[tableId].sel = me.sel
//                                 data.table[tableId].upd = me.upd
//                                 let newToken = encrypt(key, iv, JSON.stringify(data))
//                                 localStorage.setItem("token", newToken);
//
//                                 result.code = 200;
//                                 result.msg = "修改成功"
//                             } else {
//                                 result.code = 500;
//                                 result.msg = "未修改"
//                             }
//                             res.json(JSON.stringify(result));
//                         }
//                     });
//                 }
//             }
//         } catch (e) {
//             res.render("error.html", {error: '网络错误，请稍后再试'})
//         }
//     })
// });
router.all('/update/:id', function (req, res) {
    if (req.body.checkForm) {
        let token = localStorage.getItem("token");
        let key = '123456789abcdefg';
        let iv = 'abcdefg123456789';
        let data = JSON.parse(decrypt(key, iv, token));
        //let id = req.body.id;
        let value = Object.values(data);
        console.log("value-->" + value)
        let id = req.params.id;
        console.log("id-->" + id);
        let result = {
            position: "",
            uname: "",
            account:"" ,
            password: ""
        }
        // let company = req.body.company;
        // company = toLiteral(company)
        let position = req.body.position;
        result.position = position;
        position = toLiteral(position);
        let uname = req.body.uname;
        result.uname = uname;
        uname = toLiteral(uname);
        let account = req.body.account;
        result.account = account;
        account = toLiteral(account);
        let password = req.body.password;
        result.password = password;
        password = toLiteral(password);
        let company = data.company;
        company = toLiteral(company);
        let sql = "select id,account from users where account = '" + account + "' and company = '" + company + "' and id != " + id;
        console.log("sql-->" + sql)
        db.query(sql, function (err, rows) {
            try {
                if (rows.length > 0) {
                    res.render('users1/uupdate.html',
                        {title: 'ExpressTitle',
                            msg: '账户已存在',
                            ...result
                        });
                } else {
                    let sql1 = "update users set position='" + position + "', uname='" + uname + "', account='" + account + "', password='" + password + "' where id=" + id;
                    console.log("sql1->" + sql1)
                    db.query(sql1, function (err, rows) {
                        if (err) {
                            res.end('修改失败：');
                        } else {
                            res.redirect('/userss/ass');
                        }
                    });
                }
            } catch (e) {
                res.render("error.html", {error: '网络错误，请稍后再试'})
            }
        })
    }
});
router.get('/password_toUpdate', function (req, res) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    let value = Object.values(data);
    console.log("value-->" + value)
    let id = value[4];
    db.query("select * from member_info where id= '" + id + "'", function (err, rows) {
        try {
            if (err) {
                res.end('修改页面跳转失败：');
            } else {
                console.log("成功")
                console.log("测试")
                res.render("userss/userss_update.html", {datas: rows});       //直接跳转
            }
        } catch (e) {
            res.render("error.html", {error: '网络错误，请稍后再试'})
        }
    });
});
router.all('/password_update', function (req, res) {
    if (req.body.checkForm) {
        let id = req.body.id;
        console.log("id-->" + id);
        let name = req.body.name;
        name = toLiteral(name);
        let password = req.body.password;
        password = toLiteral(password);
        let sql1 = "update member_info set name='" + name + "',  password='" + password + "' where id=" + id;
        console.log("sql1->" + sql1)
        db.query(sql1, function (err, rows) {
            try {
                if (err) {
                    res.end('修改失败：');
                } else {
                    res.redirect('/welcome');
                    //res.render("index.html" , {datas: rows});
                }
            } catch (e) {
                res.render("error.html", {error: '网络错误，请稍后再试'})
            }
        });
    }
});
// router.all('/Excel', function (req, res, next) {
//     let token = localStorage.getItem("token");
//     let key = '123456789abcdefg';
//     let iv = 'abcdefg123456789';
//     let data = JSON.parse(decrypt(key, iv, token));
//     selectParams = JSON.parse(localStorage.getItem("selectParams"));
//     let sql = "select * from users where company = '" + data.company + "'";
//     db.query(sql, function (err, rows) {
//         try {
//             if (err) {
//                 console.log(err);
//             } else {
//                 let values = rows
//                 //console.log("value=>",values)
//             }
//             let sql2 = JSON.stringify(sql);
//             let sql3 = JSON.parse(sql2);
//             //console.log(sql3);
//             let conf = {};
//             conf.stylesXmlFile = "styles.xml";
//             conf.name = "mysheet";
//             conf.cols = [
//                 {
//                     caption: '序号',
//                     type: 'number'
//                 }, {
//                     caption: '公司名称',
//                     type: 'string'
//                 }, {
//                     caption: '职位',
//                     type: 'string'
//                 }, {
//                     caption: '员工',
//                     type: 'string'
//                 }, {
//                     caption: '账号',
//                     type: 'string'
//                 }, {
//                     caption: '密码',
//                     type: 'string'
//                 }
//             ];
//             conf.rows = []
//             for (let i = 0; i < rows.length; i++) {
//                 let row = [];
//                 row.push(rows[i].id)
//                 row.push(rows[i].company)
//                 row.push(rows[i].position)
//                 row.push(rows[i].uname)
//                 row.push(rows[i].account)
//                 row.push(rows[i].password)
//                 conf.rows.push(row)
//             }
//             let result = nodeExcel.execute(conf);
//             res.setHeader('Content-Type', 'application/vnd.openxmlformats');
//             res.setHeader("Content-Disposition", "attachment; filename=" + "users.xlsx");
//             res.end(result, 'binary');
//         } catch (e) {
//             res.render("error.html", {error: '网络错误，请稍后再试'})
//         }
//     });
//
//
// });
module.exports = router;
