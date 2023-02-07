let express = require('express');
let router = express.Router();
//引入数据库包
let db = require("./db.js");
let nodeExcel = require('excel-export');
let moment = require('moment')

const crypto = require("crypto");
//const path = require("path")
//LocalStorage = require('node-localstorage')
function encrypt(key, iv, data) {
    let decipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    // decipher.setAutoPadding(true);
    return decipher.update(data, 'binary', 'base64') + decipher.final('base64');
}

function decrypt(key, iv, crypted) {
    if (crypted == undefined || crypted == '') {
        throw new Error("身份验证过期，请重新登录")
    }
    crypted = new Buffer.from(crypted, 'base64').toString('binary');
    let decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    return decipher.update(crypted, 'binary', 'utf8') + decipher.final('utf8');
}
function toLiteral(str) {
    let dict = { '\b': 'b', '\t': 't', '\n': 'n', '\v': 'v', '\f': 'f', '\r': 'r' };
    return str.replace(/([\\'"\b\t\n\v\f\r])/g, function($0, $1) {
        return '\\' + (dict[$1] || $1);
    });
}

if (typeof localStorage === "undefined" || localStorage === null) {
    let LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
}

router.all('/orders_details/:id', function (req, res, next) {
    //console.log("开始")
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    console.log(data)
    let id = req.params.id;
    let isSelect = req.query.pagenum == undefined;

    let sql1 = "select Count(*) as count from orders_details where ddid='" + id + "' and company = '" + data.company + "'";

    db.query(sql1, function (err, rows) {
        try {
            if (err) {
                console.log(err);
            } else {
                let value = rows;

                let result = {
                    datas: [],
                    datass:[],
                    rowcounts: 0,
                    pagecounts: 0,
                    pagenum: 0,
                    pageSize: 6
                }
                //console.log("isSelect=>",isSelect)
                if (isSelect) {
                    result.rowcounts = value[0].count
                    result.pagecounts = Math.ceil(result.rowcounts / result.pageSize)
                    result.pagenum = 1
                } else {
                    result.rowcounts = value[0].count
                    result.pagecounts = Math.ceil(result.rowcounts / result.pageSize)
                    result.pagenum = parseInt(req.query.pagenum <= 0 ? 1 : req.query.pagenum >= result.pagecounts ? result.pagecounts : req.query.pagenum);
                }
                //let sql = "select * from orders_details right join orders on orders.id = orders_details.ddid where orders.id=" + id;
                let sql = "select id,riqi,ddh,hyzh,hyxm,hyjf,yhfa,heji.xfje,heji.ssje,heji.yhje,syy,ord.company from orders as ord left join(select ddid,company,sum(convert(dj,float) * convert(gs,float)) as xfje,sum(convert(zhdj,float) * convert(gs,float)) as ssje,round(sum(convert(dj,float) * convert(gs,float)) - sum(convert(zhdj,float) * convert(gs,float)),2) as yhje from orders_details group by ddid) as heji on ord.ddh = heji.ddid and ord.company = heji.company where ddh='" + id + "' and ord.company = '" + data.company + "' ";
                db.query(sql, function (err, rows) {
                    if (err) {
                        res.render('orders/orders_details_member.html', {title: 'Express', ...result});
                    } else {
                        result.datas = rows
                        let sql1 = "select * from orders_details  where ddid='" + id + "' and company ='" + data.company + "'";
                        sql1 += " limit " + (result.pagenum - 1) * result.pageSize + "," + result.pageSize;
                        console.log(sql1)
                        db.query(sql1, function (err, rows) {
                            if (err) {
                                res.render('orders/orders_details_member.html', {title: 'Express', ...result});
                            } else {
                                result.datass = rows
                                console.log("result=>",result)
                                res.render('orders/orders_details_member.html', {
                                    title: 'Express',
                                    ...result
                                });
                            }
                        })
                    }
                })

            }
        } catch (e) {
            res.render("error.html", {error: '网络错误，请稍后再试'})
        }
    });


});

router.all('/select', function (req, res, next) {


    let token = localStorage.getItem("token")
    let key = '123456789abcdefg';
    //console.log('加密的key:', key);
    let iv = 'abcdefg123456789';
    //console.log('加密的iv:', iv);
    let data = JSON.parse(decrypt(key, iv, token));
    let value = Object.values(data);
    let company = value[0];
    company = toLiteral(company);
    //let company = req.cookies.company
    let isSelect = req.query.pagenum == undefined;
    let selectParams = {
        recipient: '',
        cardholder: '',
        drawee: '',
        date1: '',
        d1:false,
        date2: '',
        d2:false
    }
    if (isSelect) {
        selectParams.recipient = req.body.recipient;
        selectParams.cardholder = req.body.cardholder;
        selectParams.drawee = req.body.drawee;
        selectParams.date1 = req.body.date1;
        selectParams.date2 = req.body.date2;

        localStorage.setItem("selectParams", JSON.stringify(selectParams))
    } else {
        selectParams = JSON.parse(localStorage.getItem("selectParams"));
    }
    if (selectParams.recipient == undefined){
        selectParams.recipient ="";
    }
    if (selectParams.cardholder == undefined){
        selectParams.cardholder ="";
    }
    if (selectParams.drawee == undefined){
        selectParams.drawee ="";
    }
    if(selectParams.date1 == undefined || selectParams.date1 == ""){
        selectParams.d1 = true;
        selectParams.date1 ="1900-01-01";
    }
    if(selectParams.date2 == undefined || selectParams.date2 == ""){
        let myDate = new Date();
        console.log("mydate" + myDate)
        let n = myDate.getFullYear();
        let y = myDate.getMonth() + 1
        console.log("y=>" + y)
        let r = myDate.getDate();
        let x = myDate.getHours();
        let f = myDate.getMinutes();
        selectParams.d2 = true
        let date2 = n + "-" + (y < 10 ? '0' + y : y) + "-" + (r < 10 ? '0' + r : r);
        selectParams.date2 = date2;
        console.log("selectParams.date2=>",selectParams.date2);
    }
    //console.log("selectParams=>",selectParams);
    selectParams.recipient = toLiteral(selectParams.recipient);
    selectParams.cardholder = toLiteral(selectParams.cardholder);
    selectParams.drawee = toLiteral(selectParams.drawee);
    let whereSql = " where a.id=b.id and a.gongsi = '" + company + "' and recipient like '%" + selectParams.recipient + "%' and cardholder like '%" + selectParams.cardholder + "%' and drawee like '%" + selectParams.drawee + "%' and a.date_time between '" + selectParams.date1 + "' and '" + selectParams.date2 + "'"
    let sql1 = " select a.id " +
        "from day_trading as a,customer as b " + whereSql;
    sql1 += "group by a.did";
    let sql2 = "select Count(c.id) as count from ( " + sql1 + ") as c"
    //console.log("sql1=>",sql2)
    let date1 = moment(selectParams.date1).format('YYYY-MM-DD')
    db.query(sql2, function (err, rows) {
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
                    msg:'',
                    recipient:selectParams.recipient,
                    cardholder:selectParams.cardholder,
                    drawee:selectParams.drawee,
                    // date1:date1,
                    // date2:date2
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
                if(result.rowcounts == 0){
                    result.msg = '没有查到相关信息'
                }
                let sql = "select b.*,a.* from day_trading as a,customer as b" + whereSql;

                sql += " group by a.did ";
                sql += "limit " + (result.pagenum - 1) * result.pageSize + "," + result.pageSize;

                db.query(sql, function (err, rows) {
                    if (err) {
                        res.render('orders/orders_details_member.html', {title: 'Express', ...result});
                    } else {
                        result.datas = rows
                        console.log("result=>", result)
                        res.render('orders/orders_details_member.html', {
                            title: 'Express',
                            date1: selectParams.d1 ? '' : selectParams.date1,
                            date2: selectParams.d2 ? '' : selectParams.date2,
                            ...result
                        });
                    }
                    let sql3 = JSON.stringify(sql);
                    let sql4 = JSON.parse(sql3);
                    console.log("sql4-->" + sql4);
                })

            }
        } catch (e) {
            res.render("error.html", {error: '网络错误，请稍后再试'})
        }
    });


});
module.exports = router;