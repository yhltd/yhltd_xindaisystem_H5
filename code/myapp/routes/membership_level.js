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
            res.render("membership_level.html", {company: company, account: account, password: password})
        } else {
            res.render("membership_level.html");
        }
    } else {
        res.render('membership_level.html', {title: 'ExpressTitle'});
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
    res.redirect('/membership_level/ass');
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
        jibie: ''
    }
    if (isSelect) {
        selectParams.jibie = req.body.jibie;
        //selectParams.uname = toLiteral(selectParams.uname)
        localStorage.setItem("selectParams", JSON.stringify(selectParams))
    } else {
        selectParams = JSON.parse(localStorage.getItem("selectParams"));
    }
    if (selectParams.jibie == undefined) {
        selectParams.jibie = "";
    }
    console.log("selectParams.jibie=>", selectParams.jibie)
    let whereSql = "where company = '" + company + "' and jibie like '%" + selectParams.jibie + "%'"
    let sql1 = "select count(*) as count from member_jibie " + whereSql;
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
                    jibie: selectParams.jibie
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
                let sql = "select * from member_jibie " + whereSql;
                sql += " limit " + (result.pagenum - 1) * result.pageSize + "," + result.pageSize;
                console.log("sql=>", sql)
                db.query(sql, function (err, rows) {
                    if (err) {
                        res.render('membership_level.html', {title: 'Express', datas: []});
                    } else {
                        result.datas = rows
                        console.log("result=>", result)
                        res.render('membership_level.html', {
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
    res.render('membership_level/membership_levelAdd.html');
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
            jibie: "",
            menkan: "",
            bili:"" ,

        };
        //let company = req.body.company;
        let jibie = req.body.jibie;
        result.jibie = jibie;
        jibie = toLiteral(jibie);
        let menkan = req.body.menkan;
        result.menkan = menkan;
        menkan = toLiteral(menkan);
        let bili = req.body.bili;
        result.bili = bili;
        bili = toLiteral(bili);


        company = data.company
        //data = toLiteral(account)
        //let sql1 = "select account from users where account = " + account
        //console.log("xinzeng")

        let sql1 = "insert into member_jibie(company,jibie,menkan,bili) " +
            "values('" + data.company + "','" + jibie + "','" + menkan + "','" + bili + "')"
        console.log("sql1:" + sql1)
        db.query(sql1, function (err, rows) {
            try {
                if (err) {
                    res.end('新增失败：');
                } else {
                    res.redirect('/membership_level/select');
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
        db.query("delete from member_jibie where id=" + id, function (err, rows) {
            try {
                if (err) {
                    res.end('删除失败：')
                } else {
                    res.redirect('/membership_level/ass');
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
        jibie: "",
        menkan: "",
        bili:"" ,

    }
    // if (data.table["5"].upd == 1) {
    let id = req.params.id
    if (id == 0) {
        id = value[5];
    }
    db.query("select * from member_jibie where id= '" + id + "'", function (err, rows) {

        try {
            if (err) {
                res.end('修改页面跳转失败：');
            } else {
                console.log("rows:"+rows)
                let values = JSON.stringify(rows);						//将rows转为字符串
                values = JSON.parse(values);
                result.jibie = values[0].jibie;
                result.menkan = values[0].menkan;
                result.bili = values[0].bili;

                res.render("membership_level/membership_levelUpdate.html", {
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
            jibie: "",
            menkan: "",
            bili:"" ,
        }
        // let company = req.body.company;
        // company = toLiteral(company)
        let jibie = req.body.jibie;
        result.jibie = jibie;
        jibie = toLiteral(jibie);
        let menkan = req.body.menkan;
        result.menkan = menkan;
        menkan = toLiteral(menkan);
        let bili = req.body.bili;
        result.bili = bili;
        bili = toLiteral(bili);
        let company = data.company;
        company = toLiteral(company);

        let sql1 = "update member_jibie set jibie='" + jibie + "', menkan='" + menkan + "', bili='" + bili + "' where id=" + id;
        console.log("sql1->" + sql1)
        db.query(sql1, function (err, rows) {
            try {
                if (err) {
                    res.end('修改失败：');
                } else {
                    res.redirect('/membership_level/ass');
                }
            } catch (e) {
                res.render("error.html", {error: '网络错误，请稍后再试'})
            }
        });


    }
});
router.all('/Excel', function (req, res, next) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    selectParams = JSON.parse(localStorage.getItem("selectParams"));
    let sql = "select * from membership_level where company = '" + data.company + "'";
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
                    caption: '级别名称',
                    type: 'string'
                }, {
                    caption: '消费额度门槛',
                    type: 'string'
                }, {
                    caption: '折扣比例',
                    type: 'string'
                }
            ];
            conf.rows = []
            for (let i = 0; i < rows.length; i++) {
                let row = [];
                row.push(rows[i].id)
                row.push(rows[i].jibie)
                row.push(rows[i].menkan)
                row.push(rows[i].bili)

                conf.rows.push(row)
            }
            let result = nodeExcel.execute(conf);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats');
            res.setHeader("Content-Disposition", "attachment; filename=" + "membership_level.xlsx");
            res.end(result, 'binary');
        } catch (e) {
            res.render("error.html", {error: '网络错误，请稍后再试'})
        }
    });


});
module.exports = router;
