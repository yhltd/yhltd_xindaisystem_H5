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

/**
 * 删
 */
router.get('/del/:did', function (req, res) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    if (data.table["2"].del == 1) {
        let did = req.params.did;
        let id = req.query.id;
        console.log("id==>"+id)

        db.query("delete from day_trading where did=" + did, function (err, rows) {
            try {
                if (err) {
                    res.end('删除失败：' + err)
                } else {
                    res.redirect('/day_trading/select_day/' + id);
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
 * 修改用户信息
 */
router.post('/update', function (req, res) {
    if (req.body.checkForm) {
        // let company = req.cookies.company
        let token = localStorage.getItem("token")
        let key = '123456789abcdefg';
        //console.log('加密的key:', key);
        let iv = 'abcdefg123456789';
        //console.log('加密的iv:', iv);
        let data = JSON.parse(decrypt(key, iv, token));
        let value = Object.values(data);
        let company = value[0];
        company = toLiteral(company);
        let did = req.body.did;
        let repayment = req.body.repayment;
        let commercial = req.body.commercial;
        commercial = toLiteral(commercial);
        let swipe = req.body.swipe;
        let rate = req.body.rate;
        let arrival_amount = req.body.arrival_amount;
        let basics_service_charge = req.body.basics_service_charge;
        let other_service_charge = req.body.other_service_charge;
        let id = req.query.id;
        //console.log("id-->"+id)

        db.query("update day_trading set repayment='" + repayment + "',commercial_tenant='" + commercial + "',swipe='" + swipe + "',rate='" + rate + "',arrival_amount='" + arrival_amount + "',basics_service_charge='" + basics_service_charge + "',other_service_charge='" + other_service_charge + "',gongsi = '" + company + "' where did='" + did + "'", function (err, rows) {
            try {
                if (err) {
                    res.end('修改失败：' + err);
                } else {
                    res.redirect('select_day/' + id);
                }
            } catch (e) {
                res.render("error.html", {error: '网络错误，请稍后再试'})
            }
        });

    }
});

/**
 * 修改
 */
router.get('/toUpdate/:did', function (req, res) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    if (data.table["2"].upd == 1) {
        let did = req.params.did;
        let id = req.query.id;
        //console.log("id--》"+id)

        db.query("select * from day_trading where did=" + did, function (err, rows) {
            try {
                if (err) {
                    res.end('修改页面跳转失败：' + err);
                } else {
                    res.render("../views/day_trading/day_trading_update.html", {datas: rows, id: id});       //直接跳转
                }
            } catch (e) {
                res.render("error.html", {error: '网络错误，请稍后再试'})
            }
        });

    } else {
        res.render('me.html', {title: 'ExpressTitle', msg: '无权限修改'});
    }
});


router.get('/insert/:id', function (req, res) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    if (data.table["2"].add == 1) {
        let id = req.params.id;

        db.query("select * from customer where id=" + id, function (err, rows) {
            try {
                if (err) {
                    res.end('修改页面跳转失败：' + err);
                } else {
                    res.render("../views/day_trading/day_trading_add.html", {datas: rows});       //直接跳转
                }
            } catch (e) {
                res.render("error.html", {error: '网络错误，请稍后再试'})
            }
        });

    } else {
        res.render('me.html', {title: 'ExpressTitle', msg: '无权限录入'});
    }

});

router.get('/add', function (req, res) {
    res.render('../views/day_trading/day_trading_add.html');
});
router.post('/add', function (req, res) {
    let ck = req.body.checkForm
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
    console.log("ck=>" + ck)
    if (req.body.checkForm) {
        let id = req.body.id;
        let myDate = new Date();
        console.log("mydate" + myDate)
        let n = myDate.getFullYear();
        let y = myDate.getMonth() + 1
        console.log("y=>" + y)
        let r = myDate.getDate();
        let x = myDate.getHours();
        let f = myDate.getMinutes();
        //let date_time = n + "-" + y  + "-" + r//+" "+x+":"+f;
        let date_time = n + "-" + (y < 10 ? '0' + y : y) + "-" + (r < 10 ? '0' + r : r);

        //let date_time = myDate.getFullYear() + "-" + (myDate.getMonth() < 10 ? '0' + (myDate.getMonth()+1) : (myDate.getMonth()+1)) + "-" + (myDate.getDate() < 10 ? '0' + myDate.getDate() : myDate.getDate()) ;
        //console.log("date_time=>"+date_time)
        let repayment = req.body.repayment;
        //console.log(repayment)
        let commercial = req.body.commercial;
        commercial = toLiteral(commercial);
        //console.log(commercial)
        let swipe = req.body.swipe;
        let rate = req.body.rate;
        let arrival_amount = req.body.arrival_amount;
        let basics_service_charge = req.body.basics_service_charge;
        let other_service_charge = req.body.other_service_charge;


        db.query("insert into day_trading(id,date_time,repayment,commercial_tenant,swipe,rate,arrival_amount,basics_service_charge,other_service_charge,gongsi) values('" + id + "','"
            + date_time + "',"
            + repayment + ",'" + commercial + "'," + swipe + ","
            + rate + "," + arrival_amount + ",'" + basics_service_charge + "','" + other_service_charge + "','" + company + "')", function (err, rows) {
            try {
                if (err) {
                    res.end('新增失败：');
                } else {
                    res.redirect('select_day/' + id);
                    /*res.redirect('/customer/ass');*/
                }
            } catch (e) {
                res.render("error.html", {error: '网络错误，请稍后再试'})
            }
        });


    }
});


router.get('/ass/:id', function (req, res, next) {
    let id = req.params.id;

    db.query("select * from day_trading where id=" + id + "", function (err, rows) {
        try {
            console.log('==========');
            if (err) {
                res.render('../views/day_trading/day_trading.html', {title: 'Express', datas: []});  // this renders "views/users.html"
            } else {
                res.render('../views/day_trading/day_trading.html', {title: 'Express', datas: rows});
            }
        } catch (e) {
            res.render("error.html", {error: '网络错误，请稍后再试'})
        }
    })

});

// router.get('/select_day/:id', function (req, res, next) {
//     let id = req.params.id;
//     db.query("select * from day_trading right join customer on customer.id = day_trading.id where customer.id=" + id+ "" , function (err, rows) {
//         console.log('==========');
//         if (err) {
//             res.render('../views/day_trading/day_trading.html', {title: 'Express', datas: []});  // this renders "views/users.html"
//         } else {
//             res.render('../views/day_trading/day_trading.html', {title: 'Express', datas: rows});
//         }
//     })
// });



router.all('/select_day/:id', function (req, res, next) {
    //console.log("开始")
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    if (data.table["2"].sel != 1) {
        res.render('me.html', {title: 'ExpressTitle', msg: '无权限查看'});
        return;
    }

    let id = req.params.id;
    let isSelect = req.query.pagenum == undefined;

    let sql1 = "select Count(*) as count from day_trading right join customer on customer.id = day_trading.id where customer.id=" + id;
    //console.log(sql1);

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
                    pageSize: 6,
                    msg:''
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
                let sql = "select * from day_trading right join customer on customer.id = day_trading.id where customer.id=" + id;
                sql += " limit " + (result.pagenum - 1) * result.pageSize + "," + result.pageSize;
                db.query(sql, function (err, rows) {
                    if (err) {
                        res.render('../views/day_trading/day_trading.html', {title: 'Express', ...result});
                    } else {
                        result.datas = rows
                        //console.log("result=>",result)
                        res.render('../views/day_trading/day_trading.html', {
                            title: 'Express',
                            ...result
                        });
                    }
                })
            }
        } catch (e) {
            res.render("error.html", {error: '网络错误，请稍后再试'})
        }
    });
});


router.all('/Excel', function (req, res, next) {

    // let selectParams = {
    //     date1 : ''
    // }
    // let company = req.cookies.company
    // selectParams = JSON.parse(localStorage.getItem("selectParams"));
    let id = req.query.id;
    //console.log("selectParams.date1-->"+selectParams.date1)
    //console.log(typeof selectParams.date1)
    //console.log("id-->"+id);
    let sql = "select * from day_trading right join customer on customer.id = day_trading.id where customer.id=" + id;
    //console.log("sql-->"+sql);

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
                    caption: '编号',
                    type: 'number'
                }, {
                    caption: '日期',
                    type: 'string'
                }, {
                    caption: '已还款',
                    type: 'number'
                }, {
                    caption: '商户',
                    type: 'string'
                }, {
                    caption: '刷卡额',
                    type: 'number'
                }, {
                    caption: '费率',
                    type: 'number'
                }, {
                    caption: '到账金额',
                    type: 'number'
                }, {
                    caption: '基础手续费',
                    type: 'number'
                }, {
                    caption: '其他手续费',
                    type: 'number'
                }
            ];
            conf.rows = []
            for (let i = 0; i < rows.length; i++) {
                let row = [];
                row.push(rows[i].did)
                row.push(rows[i].date_time)
                row.push(rows[i].repayment)
                row.push(rows[i].commercial_tenant)
                row.push(rows[i].swipe)
                row.push(rows[i].rate)
                row.push(rows[i].arrival_amount)
                row.push(rows[i].basics_service_charge)
                row.push(rows[i].other_service_charge)
                conf.rows.push(row)
            }
            let result = nodeExcel.execute(conf);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats');
            res.setHeader("Content-Disposition", "attachment; filename=" + "day_trading.xlsx");
            res.end(result, 'binary');
        } catch (e) {
            res.render("error.html", {error: '网络错误，请稍后再试'})
        }
    });


});

router.all('/Excel2', function (req, res, next) {


    // let selectParams = {
    //     date1 : ''
    // }
    // let company = req.cookies.company
    // selectParams = JSON.parse(localStorage.getItem("selectParams"));
    let id = req.query.id;
    // console.log("selectParams.date1-->"+selectParams.date1)
    // console.log(selectParams)
    //console.log(typeof selectParams.date1)
    //console.log("id-->"+id);
    let recipient = req.query.recipient
    let cardholder = req.query.cardholder
    let drawee = req.query.drawee
    let date1 = req.query.date1
    let date2 = req.query.date2
    console.log("date1:" + date1)
    let sql = "select * from day_trading right join customer on customer.id = day_trading.id where customer.gongsi='" + id + "' and customer.recipient like '%"+ recipient +"%' and customer.cardholder like '%"+ cardholder +"%' and customer.drawee like '%" + drawee + "%' ";
    if(date1 != ''){
        sql = sql + "and day_trading.date_time >='" + date1 + "' "
    }
    if(date2 != ''){
        sql = sql + "and day_trading.date_time <='" + date2 + "'"
    }

    //console.log("sql-->"+sql);

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
                    caption: '编号',
                    type: 'number'
                }, {
                    caption: '日期',
                    type: 'string'
                }, {
                    caption: '已还款',
                    type: 'number'
                }, {
                    caption: '商户',
                    type: 'string'
                }, {
                    caption: '刷卡额',
                    type: 'number'
                }, {
                    caption: '费率',
                    type: 'number'
                }, {
                    caption: '到账金额',
                    type: 'number'
                }, {
                    caption: '基础手续费',
                    type: 'number'
                }, {
                    caption: '其他手续费',
                    type: 'number'
                }
            ];
            conf.rows = []
            for (let i = 0; i < rows.length; i++) {
                let row = [];
                row.push(rows[i].did)
                row.push(rows[i].date_time)
                row.push(rows[i].repayment)
                row.push(rows[i].commercial_tenant)
                row.push(rows[i].swipe)
                row.push(rows[i].rate)
                row.push(rows[i].arrival_amount)
                row.push(rows[i].basics_service_charge)
                row.push(rows[i].other_service_charge)
                conf.rows.push(row)
            }
            let result = nodeExcel.execute(conf);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats');
            res.setHeader("Content-Disposition", "attachment; filename=" + "day_trading.xlsx");
            res.end(result, 'binary');
        } catch (e) {
            res.render("error.html", {error: '网络错误，请稍后再试'})
        }
    });


});
router.get('/select_ass', function (req, res, next) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    if (data.table["2"].sel == 1) {
        //res.render('../views/day_trading/day_trading_select.html');
        res.redirect('/day_trading/select');
    } else {
        res.render('me.html', {title: 'ExpressTitle', msg: '无权限查看'});
    }
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
        recipient: '11',
        cardholder: '',
        drawee: '',
        date1: '2023/01/06',
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
        // selectParams.d1 = true;
        // selectParams.date1 ="1900-01-01";
        let myDate = new Date();
        console.log("mydate" + myDate)
        let n = myDate.getFullYear();
        let y = myDate.getMonth() + 1
        console.log("y=>" + y)
        let r = myDate.getDate();
        let x = myDate.getHours();
        let f = myDate.getMinutes();
        selectParams.d1 = true
        let date1 = n + "-" + (y < 10 ? '0' + y : y) + "-" + (r < 10 ? '0' + r : r);
        selectParams.date1 = date1;
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
                        res.render('../views/day_trading/day_trading_select.html', {title: 'Express', ...result});
                    } else {
                        result.datas = rows
                        console.log("result=>", result)
                        res.render('../views/day_trading/day_trading_select.html', {
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