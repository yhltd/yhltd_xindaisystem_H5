var express = require('express');
var router = express.Router();
//引入数据库包
var db = require("./db.js");
var nodeExcel = require('excel-export');

/**
 * 删
 */
router.get('/del/:did', function (req, res) {
    var did = req.params.did;
    db.query("delete from day_trading where did=" + did, function (err, rows) {
        if (err) {
            res.end('删除失败：' + err)
        } else {
            res.redirect('select_day/'+ id);
        }
    });
});




/**
 * 修改用户信息
 */
router.post('/update', function (req, res) {
    if(req.body.checkForm) {
        let company = req.cookies.company
        var did = req.body.did;
        var repayment = req.body.repayment;
        var commercial = req.body.commercial;
        var swipe = req.body.swipe;
        var rate = req.body.rate;
        var arrival_amount = req.body.arrival_amount;
        var basics_service_charge = req.body.basics_service_charge;
        var other_service_charge = req.body.other_service_charge;

        db.query("update day_trading set repayment='" + repayment + "',commercial_tenant='" + commercial + "',swipe='" + swipe + "',rate='" + rate + "',arrival_amount='" + arrival_amount + "',basics_service_charge='" + basics_service_charge + "',other_service_charge='" + other_service_charge + "',gongsi = '" + company + "' where did='" + did + "'", function (err, rows) {
            if (err) {
                res.end('修改失败：' + err);
            } else {
                res.redirect('select_day/'+ id);
            }
        });
    }
});

/**
 * 修改
 */
router.get('/toUpdate/:did', function (req, res) {
    var did = req.params.did;
    db.query("select * from day_trading where did=" + did, function (err, rows) {
        if (err) {
            res.end('修改页面跳转失败：' + err);
        } else {
            res.render("../views/day_trading/day_trading_update.html", {datas: rows});       //直接跳转
        }
    });
});


router.get('/insert/:id', function (req, res) {
    var id = req.params.id;
    db.query("select * from customer where id=" + id, function (err, rows) {
        if (err) {
            res.end('修改页面跳转失败：' + err);
        } else {
            res.render("../views/day_trading/day_trading_add.html", {datas: rows});       //直接跳转
        }
    });
});

router.get('/add', function (req, res) {
    res.render('../views/day_trading/day_trading_add.html');
});
router.post('/add', function (req, res) {
    var ck = req.body.checkForm
    let company = req.cookies.company
    console.log("ck=>"+ck)
    if(req.body.checkForm) {
        var id = req.body.id;

        var myDate = new Date();
        console.log("mydate"+myDate)
        var n = myDate.getFullYear();
        var y = myDate.getMonth()+1
        console.log("y=>"+y)
        var r = myDate.getDate();
        var x = myDate.getHours();
        var f = myDate.getMinutes();
        var date_time = n + "-" + y + "-" + r//+" "+x+":"+f;

        var repayment = req.body.repayment;
        console.log(repayment)
        var commercial = req.body.commercial;
        console.log(commercial)
        var swipe = req.body.swipe;
        var rate = req.body.rate;
        var arrival_amount = req.body.arrival_amount;
        var basics_service_charge = req.body.basics_service_charge;
        var other_service_charge = req.body.other_service_charge;

        db.query("insert into day_trading(id,date_time,repayment,commercial_tenant,swipe,rate,arrival_amount,basics_service_charge,other_service_charge,gongsi) values('" + id + "','"
            + date_time + "',"
            + repayment + "," + commercial + "," + swipe + ","
            + rate + "," + arrival_amount + ",'" + basics_service_charge + "','" + other_service_charge + "','" + company + "')", function (err, rows) {
            if (err) {
                res.end('新增失败：' + err);
            } else {
                res.redirect('select_day/'+ id);
                /*res.redirect('/customer/ass');*/
            }
        })
    }
});


router.get('/ass/:id', function (req, res, next) {
    var id = req.params.id;
    db.query("select * from day_trading where id=" + id+ "" , function (err, rows) {
        console.log('==========');
        if (err) {
            res.render('../views/day_trading/day_trading.html', {title: 'Express', datas: []});  // this renders "views/users.html"
        } else {
            res.render('../views/day_trading/day_trading.html', {title: 'Express', datas: rows});
        }
    })
});

// router.get('/select_day/:id', function (req, res, next) {
//     var id = req.params.id;
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
    var id = req.params.id;
    let isSelect = req.query.pagenum == undefined;
    let sql1 = "select Count(*) as count from day_trading right join customer on customer.id = day_trading.id where customer.id=" + id;
    console.log(sql1);
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
            console.log("isSelect=>",isSelect)
            if(isSelect){
                result.rowcounts = value[0].count
                result.pagecounts = Math.ceil(result.rowcounts/result.pageSize)
                result.pagenum = 1
                console.log("value[0].count =>",value[0].count)
            }else{
                result.rowcounts = value[0].count
                console.log("value[0].count =>",value[0].count)
                result.pagecounts = Math.ceil(result.rowcounts/result.pageSize)
                result.pagenum = req.query.pagenum <= 0 ? 1 : req.query.pagenum >= result.pagecounts ? result.pagecounts : req.query.pagenum;
            }
            let sql = "select * from day_trading right join customer on customer.id = day_trading.id where customer.id=" + id;
            sql += " limit " + (result.pagenum-1)*result.pageSize + "," + result.pageSize;
            db.query(sql, function (err, rows) {
                if (err) {
                    res.render('../views/day_trading/day_trading.html', {title: 'Express', ...result});
                } else {
                    result.datas = rows
                    console.log("result=>",result)
                    res.render('../views/day_trading/day_trading.html', {
                        title: 'Express',

                        ...result
                    });
                }
            })
            let sql2 = JSON.stringify(sql);
            let sql3 = JSON.parse(sql2);
            console.log(sql3);
        }
    });
});
router.all('/Excel', function(req, res, next) {
    // let selectParams = {
    //     date1 : ''
    // }
    // let company = req.cookies.company
    // selectParams = JSON.parse(localStorage.getItem("selectParams"));
    var id = req.query.id;
    //console.log("selectParams.date1-->"+selectParams.date1)
    //console.log(typeof selectParams.date1)
    console.log("id-->"+id);
    let sql = "select * from day_trading right join customer on customer.id = day_trading.id where customer.id=" + id;
    console.log("sql-->"+sql);
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
                caption:'编号',
                type:'number'
            },{
                caption:'日期',
                type:'string'
            },{
                caption:'已还款',
                type:'number'
            },{
                caption:'商户',
                type:'string'
            },{
                caption:'刷卡额',
                type:'number'
            },{
                caption:'费率',
                type:'number'
            },{
                caption:'到账金额',
                type:'number'
            },{
                caption:'基础手续费',
                type:'number'
            },{
                caption:'其他手续费',
                type:'number'
            }
        ];
        conf.rows = []
        for(let i=0;i<rows.length;i++){
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
        var result = nodeExcel.execute(conf);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader("Content-Disposition", "attachment; filename=" + "Report.xlsx");
        res.end(result, 'binary');
    });
});
module.exports = router;