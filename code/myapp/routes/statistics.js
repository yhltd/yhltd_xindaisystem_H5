let express = require('express');
let router = express.Router();
//引入数据库包
let db = require("./db.js");
let moment = require('moment');
let nodeExcel = require('excel-export');

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

if (typeof localStorage === "undefined" || localStorage === null) {
    let LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
}
/**
 * 查询列表页
 */
router.get('/select', function (req, res, next) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    if (data.table["4"].sel == 1) {
        //res.render('../views/statistics/statistics_select.html');
        res.redirect('/statistics/ass');
    } else {
        res.render('me.html', {title: 'ExpressTitle', msg: '无权限查看'});
    }
});
router.all('/ass', function (req, res, next) {

    //console.log("pagenum=>",req.query.pagenum)
    let token = localStorage.getItem("token")
    let key = '123456789abcdefg';
    //console.log('加密的key:', key);
    let iv = 'abcdefg123456789';
    //console.log('加密的iv:', iv);
    let data = JSON.parse(decrypt(key, iv, token));
    let value = Object.values(data);
    let company = value[0];
    //let company = req.cookies.company
    let isSelect = req.query.pagenum == undefined;
    //console.log("isSelect-->"+isSelect)
    let selectParams = {
        date1: '',
        d1: false,
        date2:'',
        d2: false
    }
    if (isSelect) {
        selectParams.date1 = req.body.date1
        selectParams.date2 = req.body.date2
    } else {
        selectParams = JSON.parse(localStorage.getItem("selectParams"));
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
        let date2 = n + "-" + (y < 10 ? '0' + y : y) + "-" + (r < 10 ? '0' + r : r);
        selectParams.d2 = true;
        selectParams.date2 = date2;
        console.log("selectParams.date2=>",selectParams.date2);
    }

    localStorage.setItem('selectParams', JSON.stringify(selectParams));

    // console.log("selectParams=>",selectParams);
    // console.log(typeof selectParams.date1)

    let whereSql = "where a.id=b.id and a.gongsi = '" + company + "' and a.date_time between '" + selectParams.date1 + "' and '" + selectParams.date2 + "'";


    let sql1 = "select Count(c.date_time) as count from(select a.date_time from day_trading as a,customer as b  " + whereSql + " group by a.date_time ) as c";

    console.log(sql1);

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
                    msg:''
                    // date1:selectParams.date1,
                    // date2:selectParams.date2
                }
                //console.log("isSelect=>",isSelect)
                if (isSelect) {
                    result.rowcounts = value[0].count
                    result.pagecounts = Math.ceil(result.rowcounts / result.pageSize)
                    result.pagenum = 1
                    //console.log("value[0].count =>",value[0].count)
                } else {
                    result.rowcounts = value[0].count
                    //console.log("value[0].count =>",value[0].count)
                    result.pagecounts = Math.ceil(result.rowcounts / result.pageSize)
                    result.pagenum = parseInt(req.query.pagenum <= 0 ? 1 : req.query.pagenum >= result.pagecounts ? result.pagecounts : req.query.pagenum);
                }
                if(result.rowcounts == 0){
                    result.msg = '没有查到相关信息'
                }
                let sql = "select a.date_time,sum(a.repayment) as repayment,sum(a.swipe) as swipe,(sum(a.basics_service_charge)+sum(a.other_service_charge)) as the_total_fee,sum(a.swipe)*sum(b.service_charge)-sum(a.basics_service_charge)+sum(a.other_service_charge) as profit from day_trading as a,customer as b " + whereSql;


                sql += " group by a.date_time ";
                sql += "limit " + (result.pagenum - 1) * result.pageSize + "," + result.pageSize;

                db.query(sql, function (err, rows) {


                    if (err) {
                        res.render('../views/statistics/statistics_select.html', {title: 'Express', ...result});
                    } else {
                        result.datas = rows
                        //console.log("result=>",result)
                        res.render('../views/statistics/statistics_select.html', {
                            title: 'Express',
                            date1: selectParams.d1 ? '' : selectParams.date1,
                            date2: selectParams.d2 ? '' : selectParams.date2,
                            ...result
                        });
                    }
                })
                let sql2 = JSON.stringify(sql);
                let sql3 = JSON.parse(sql2);
                console.log(sql3);
            }
        } catch (e) {
            res.render("error.html", {error: '网络错误，请稍后再试'})
        }
    });


});
const disableLayout = {layout: false};

// disable interface layout.hbs  user config layout: false
router.all('/Excel', function (req, res, next) {
    let selectParams = {
        date1: ''
    }
    let token = localStorage.getItem("token")
    let key = '123456789abcdefg';
    //console.log('加密的key:', key);
    let iv = 'abcdefg123456789';
    //console.log('加密的iv:', iv);
    let data = JSON.parse(decrypt(key, iv, token));
    let value = Object.values(data);
    let company = value[0];
    //let company = req.cookies.company
    selectParams = JSON.parse(localStorage.getItem("selectParams"));
    //console.log("selectParams.date1-->"+selectParams.date1)
    //console.log(typeof selectParams.date1)
    let whereSql = "where a.id=b.id and a.gongsi = '" + company + "' and a.date_time between '" + selectParams.date1 + "' and '" + selectParams.date2 + "'"
    let sql = "select a.date_time,sum(a.repayment) as repayment,sum(a.swipe) as swipe,(sum(a.basics_service_charge)+sum(a.other_service_charge)) as the_total_fee,sum(a.swipe)*(b.service_charge)-sum(a.basics_service_charge)+sum(a.other_service_charge) as profit from day_trading as a,customer as b " + whereSql;
    sql += " group by a.date_time ";
    console.log(sql)

    db.query(sql, function (err, rows) {
        try {
            if (err) {
                console.log(err);
            } else {
                let values = rows
                console.log("value=>",values)
            }
            // let sql2 = JSON.stringify(sql);
            // let sql3 = JSON.parse(sql2);
            //console.log(sql3);
            let conf = {};
            conf.stylesXmlFile = "styles.xml";
            conf.name = "mysheet";
            conf.cols = [
                {
                    caption: '日期',
                    type: 'string'
                }, {
                    caption: '交易额',
                    type: 'number'
                }, {
                    caption: '已刷额',
                    type: 'number'
                }, {
                    caption: '手续费',
                    type: 'number'
                }, {
                    caption: '利润',
                    type: 'number'
                }
            ];
            conf.rows = []
            for (let i = 0; i < rows.length; i++) {
                let row = [];
                row.push(rows[i].date_time)
                row.push(rows[i].repayment)
                row.push(rows[i].swipe)
                row.push(rows[i].the_total_fee)
                row.push(rows[i].profit)
                conf.rows.push(row)
            }
            let result = nodeExcel.execute(conf);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats');
            res.setHeader("Content-Disposition", "attachment; filename=" + "statistics.xlsx");
            res.end(result, 'binary');
        } catch (e) {
            res.render("error.html", {error: '网络错误，请稍后再试'})
        }
    });


});
module.exports = router;
