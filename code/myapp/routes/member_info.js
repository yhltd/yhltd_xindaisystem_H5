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
        let account = value[1];
        let password = value[2];
        let isRem = value[4];
        if (isRem) {
            res.render("member_info.html", {company: company, account: account, password: password})
        } else {
            res.render("member_info.html");
        }
    } else {
        res.render('member_info.html', {title: 'ExpressTitle'});
    }
});

/**
 * 查询列表页
 */
router.get('/select', function (req, res, next) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    // console.log("读取权限: " + data)
    //
    // console.log("quanxian" + data.table["5"].sel)
    // if (data.table["5"].sel == 1) {
    res.redirect('/member_info/ass');
    // } else {
    //     res.render('me.html', {title: 'ExpressTitle', msg: '无权限查看'});
    // }
});
router.all('/ass', function (req, res, next) {
    console.log("yuangong")
    let isSelect = req.query.pagenum == undefined;
    let token = localStorage.getItem("token")
    let key = '123456789abcdefg';
    //console.log('加密的key:', key);
    let iv = 'abcdefg123456789';
    //console.log('加密的iv:', iv);
    let data = JSON.parse(decrypt(key, iv, token));
    let value = Object.values(data);
    let company = value[0];

    // if (data.table["5"].sel == 1) {
    //
    // } else {
    //     res.render('me.html', {title: 'ExpressTitle', msg: '无权限查看'});
    // }

    // let account = req.cookies.account
    // console.log(account);

    let selectParams = {
        name: ''
    }
    if (isSelect) {
        selectParams.name = req.body.name;
        localStorage.setItem("selectParams", JSON.stringify(selectParams))
    } else {
        selectParams = JSON.parse(localStorage.getItem("selectParams"));
    }
    if (selectParams.name == undefined) {
        selectParams.name = "";
    }
    console.log("selectParams.name=>", selectParams.name)
    let whereSql = "where company = '" + company + "' and name like '%" + selectParams.name + "%'"
    let sql1 = "select count(*) as count from member_info " + whereSql;
    db.query(sql1, function (err, rows) {
        try {
            if (err) {
                console.log(err);
            } else {
                let value = rows;
                let result = {
                    datas: [],
                    rowcounts: 0,
                    pagecounts: 0,
                    pagenum: 0,
                    pageSize: 10,
                    name: selectParams.name
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
                let sql = "select * from member_info " + whereSql;
                sql += " limit " + (result.pagenum - 1) * result.pageSize + "," + result.pageSize;
                console.log("sql=>", sql)
                db.query(sql, function (err, rows) {
                    if (err) {
                        res.render('member_info.html', {title: 'Express', datas: []});
                    } else {
                        result.datas = rows
                        console.log("result=>", result)
                        res.render('member_info.html', {
                            title: 'Express',
                            ...result
                        });
                    }
                });
            }
        } catch (e) {
            res.render("error.html", {error: '网络错误，请稍后再试！'})
        }
    });
});
/**
 * 新增页面跳转
 */

router.get('/add', function (req, res) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    // if (data.table["5"].add == 1) {
    res.render('member_info/member_infoAdd.html');
    // } else {
    //     res.render('me.html', {title: 'ExpressTitle', msg: '无权限录入'});
    // }

});
router.post('/add', function (req, res) {
    if (req.body.checkForm) {
        let token = localStorage.getItem("token");
        let key = '123456789abcdefg';
        let iv = 'abcdefg123456789';
        let data = JSON.parse(decrypt(key, iv, token));
        let result = {
            username: "",
            password: "",
            name:"" ,
            gender: "",
            state: "",
            phone: "",
            birthday: "",
        };
        //let company = req.body.company;
        let username = req.body.username;
        result.username = username;
        username = toLiteral(username);
        let password = req.body.password;
        result.password = password;
        password = toLiteral(password);
        let name = req.body.name;
        result.name = name;
        name = toLiteral(name);
        let gender = req.body.gender;
        result.gender = gender;
        gender = toLiteral(gender);
        let state = req.body.state;
        result.state = state;
        state = toLiteral(state);
        let phone = req.body.phone;
        result.phone = phone;
        phone = toLiteral(phone);
        let birthday = req.body.birthday;
        result.birthday = birthday;
        birthday = toLiteral(birthday);

        company = data.company
        //data = toLiteral(account)
        //let sql1 = "select account from users where account = " + account
        //console.log("xinzeng")

        db.query("select username from member_info where username = '" + username + "' and company = '" + data.company + "'", function (err, rows) {
            try {
                if (rows.length > 0) {
                    res.render('member_info/member_infoAdd.html', {title: 'ExpressTitle',
                        msg: '会员已存在',
                        ...result});
                } else {
                    let sql1 = "insert into member_info(company,username,password,name,gender,state,phone,birthday) " +
                        "values('" + data.company + "','" + username + "','" + password + "','" + name + "','" + gender + "','" + state + "','" + phone + "','" + birthday + "')"
                    console.log("sql1:" + sql1)
                    db.query(sql1, function (err, rows) {
                        try {
                            if (err) {
                                res.end('新增失败：');
                            } else {
                                res.redirect('/member_info/select');
                            }
                        } catch (e) {
                            res.render("error.html", {error: '网络错误，请稍后再试'})
                        }

                    })
                }
            } catch (e) {
                res.render("error.html", {error: '网络错误，请稍后再试'})
            }
        })




    }
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
        db.query("delete from member_info where id=" + id, function (err, rows) {
            try {
                if (err) {
                    res.end('删除失败：')
                } else {
                    res.redirect('/member_info/ass')
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
        username: "",
        password: "",
        name:"" ,
        gender: "",
        state: "",
        phone: "",
        birthday: "",
    }
    // if (data.table["5"].upd == 1) {
    let id = req.params.id
    if (id == 0) {
        id = value[5];
    }
    db.query("select * from member_info where id= '" + id + "'", function (err, rows) {

        try {
            if (err) {
                res.end('修改页面跳转失败：');
            } else {
                console.log("rows:"+rows)
                let values = JSON.stringify(rows);						//将rows转为字符串
                values = JSON.parse(values);
                result.username = values[0].username;
                result.password = values[0].password;
                result.name = values[0].name;
                result.gender = values[0].gender;
                result.state = values[0].state;
                result.phone = values[0].phone;
                result.birthday = values[0].birthday;
                res.render("member_info/member_infoUpdate.html", {
                    datas:rows,
                    ...result
                });       //直接跳转
                console.log("result-->"+result)
            }
        } catch (e) {
            res.render("error.html", {error: '网络错误，请稍后再试'})
        }
    });

    // } else {
    //     res.render('me.html', {title: 'ExpressTitle', msg: '无权限修改'});
    // }
});

/**
 * 获取权限
 */
router.post('/getTableMe', function (req, res) {
    let userId = req.body.userId;
    let tableId = req.body.tableId;

    db.query("select `Add`,Del,Sel,Upd from management where Uid = '" + userId + "' and `Table` = '" + tableId + "'", function (err, rows) {
        try {
            if (err) {
                res.end('获取失败：');
            } else {
                let result = JSON.stringify(rows)
                res.json(result);
            }
        } catch (e) {
            res.render("error.html", {error: '网络错误，请稍后再试'})
        }
    });
});

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
            username: "",
            password: "",
            name:"" ,
            gender: "",
            state: "",
            phone: "",
            birthday: "",
        }
        // let company = req.body.company;
        // company = toLiteral(company)
        let username = req.body.username;
        result.username = username;
        username = toLiteral(username);
        let password = req.body.password;
        result.password = password;
        password = toLiteral(password);
        let name = req.body.name;
        result.name = name;
        name = toLiteral(name);
        let gender = req.body.gender;
        result.gender = gender;
        gender = toLiteral(gender);
        let state = req.body.state;
        result.state = state;
        state = toLiteral(state);
        let phone = req.body.phone;
        result.phone = phone;
        phone = toLiteral(phone);
        let birthday = req.body.birthday;
        result.birthday = birthday;
        birthday = toLiteral(birthday);
        let company = data.company;
        company = toLiteral(company);


        db.query("select username from member_info where username = '" + username + "' and company = '" + data.company + "' and id != " + id, function (err, rows) {
            try {
                if (rows.length > 0) {
                    res.render('member_info/member_infoUpdate.html', {title: 'ExpressTitle',
                        msg: '会员已存在',
                        ...result});
                } else {
                    let sql1 = "update member_info set username='" + username + "', password='" + password + "', name='" + name + "', gender='" + gender + "', state='" + state + "', phone='" + phone + "', birthday='" + birthday + "' where id=" + id;
                    console.log("sql1->" + sql1)
                    db.query(sql1, function (err, rows) {
                        try {
                            if (err) {
                                res.end('修改失败：');
                            } else {
                                res.redirect('/member_info/ass');
                            }
                        } catch (e) {
                            res.render("error.html", {error: '网络错误，请稍后再试'})
                        }
                    });
                }
            } catch (e) {
                res.render("error.html", {error: '网络错误，请稍后再试'})
            }
        })





    }
});
router.all('/Excel', function (req, res, next) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    selectParams = JSON.parse(localStorage.getItem("selectParams"));
    let sql = "select * from member_info where company = '" + data.company + "'";
    db.query(sql, function (err, rows) {
        try {
            if (err) {
                console.log(err);
            } else {
                let values = rows
                //console.log("value=>",values)
            }
            let sql2 = JSON.stringify(sql);
            let sql3 = JSON.parse(sql2);
            //console.log(sql3);
            let conf = {};
            conf.stylesXmlFile = "styles.xml";
            conf.name = "mysheet";
            conf.cols = [
                {
                    caption: '序号',
                    type: 'number'
                }, {
                    caption: '账号',
                    type: 'string'
                }, {
                    caption: '密码',
                    type: 'string'
                }, {
                    caption: '姓名',
                    type: 'string'
                }, {
                    caption: '性别',
                    type: 'string'
                }, {
                    caption: '账号状态',
                    type: 'string'
                }, {
                    caption: '电话号',
                    type: 'string'
                }, {
                    caption: '生日',
                    type: 'string'
                }
            ];
            conf.rows = []
            for (let i = 0; i < rows.length; i++) {
                let row = [];
                row.push(rows[i].id)
                row.push(rows[i].username)
                row.push(rows[i].password)
                row.push(rows[i].name)
                row.push(rows[i].gender)
                row.push(rows[i].state)
                row.push(rows[i].phone)
                row.push(rows[i].birthday)
                conf.rows.push(row)
            }
            let result = nodeExcel.execute(conf);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats');
            res.setHeader("Content-Disposition", "attachment; filename=" + "member_info.xlsx");
            res.end(result, 'binary');
        } catch (e) {
            res.render("error.html", {error: '网络错误，请稍后再试'})
        }
    });


});
module.exports = router;
