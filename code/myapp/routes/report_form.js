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
            res.render("report_form.html", {company: company, account: account, password: password})
        } else {
            res.render("report_form.html");
        }
    } else {
        res.render('report_form.html', {title: 'ExpressTitle'});
    }
});

/**
 * 查询列表页
 */
router.get('/select', function (req, res, next) {
    console.log(req.query)
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    // console.log("读取权限: " + data)
    //
    // console.log("quanxian" + data.table["5"].sel)
    // if (data.table["5"].sel == 1) {
    res.redirect('/report_form/ass');
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
        product_name: ''
    }
    if (isSelect) {
        selectParams.product_name = req.body.product_name;
        //selectParams.uname = toLiteral(selectParams.uname)
        localStorage.setItem("selectParams", JSON.stringify(selectParams))
    } else {
        selectParams = JSON.parse(localStorage.getItem("selectParams"));
    }
    if (selectParams.product_name == undefined) {
        selectParams.product_name = "";
    }
    console.log("selectParams.product_name=>", selectParams.product_name)
    let whereSql = "where company = '" + company + "' and product_name like '%" + selectParams.product_name + "%'"
    let sql1 = "select count(*) as count from product " + whereSql;
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
                    product_name: selectParams.product_name
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
                let sql = "select * from product " + whereSql;
                sql += " limit " + (result.pagenum - 1) * result.pageSize + "," + result.pageSize;
                console.log("sql=>", sql)
                db.query(sql, function (err, rows) {
                    if (err) {
                        res.render('report_form.html', {title: 'Express', datas: []});
                    } else {
                        result.datas = rows
                        console.log("result=>", result)
                        res.render('report_form.html', {
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


router.post('/getList', function (req, res) {
    let token = localStorage.getItem("token")
    let key = '123456789abcdefg';
    //console.log('加密的key:', key);
    let iv = 'abcdefg123456789';

    let start_date = req.body.start_date;
    let stop_date = req.body.stop_date;
    let data = JSON.parse(decrypt(key, iv, token));
    let value = Object.values(data);
    let company = value[0];
    var sql = "select round(sum(ifnull(heji.xfje,0)),2) as xfje,round(sum(ifnull(heji.ssje,0)),2) as ssje,round(sum(ifnull(heji.yhje,0)),2) as yhje from orders as ord left join(select ddid,company,sum(convert(dj,float) * convert(gs,float)) as xfje,sum(convert(zhdj,float) * convert(gs,float)) as ssje,round(sum(convert(dj,float) * convert(gs,float)) - sum(convert(zhdj,float) * convert(gs,float)),2) as yhje from orders_details group by ddid) as heji on ord.ddh = heji.ddid and ord.company = heji.company where ord.company = '" + toLiteral(company) + "' and riqi >='" + start_date + "' and riqi <= '" + stop_date + "'"

    db.query(sql, function (err, rows) {
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


router.post('/getList2', function (req, res) {
    let token = localStorage.getItem("token")
    let key = '123456789abcdefg';
    //console.log('加密的key:', key);
    let iv = 'abcdefg123456789';

    let start_date = req.body.start_date;
    let stop_date = req.body.stop_date;
    let data = JSON.parse(decrypt(key, iv, token));
    let value = Object.values(data);
    let company = value[0];
    var sql = "select count(*) as huiyuan_sum from member_info where company = '"+ toLiteral(company) +"' union all select count(*) as xiadan_sum from(select hyzh from orders where company = '"+ toLiteral(company) +"' and hyzh != '' and riqi >='" + start_date + "' and riqi <= '" + stop_date + "' group by hyzh) as xdhy union all select count(*) as dingdan_sum from orders where company = '"+ toLiteral(company) +"' and riqi >='" + start_date + "' and riqi <= '" + stop_date + "'"
    db.query(sql, function (err, rows) {
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


module.exports = router;
