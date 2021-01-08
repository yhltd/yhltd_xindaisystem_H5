var express = require('express');
var router = express.Router();
//引入数据库包
var db = require("./db.js");
var moment = require('moment');
var nodeExcel = require('excel-export');

/**
 * 查询列表页
 */
router.get('/select', function(req, res, next) {
    res.render('../views/statistics/statistics_select.html');
});
router.all('/ass', function (req, res, next) {

    console.log("pagenum=>",req.query.pagenum)
    let company = req.cookies.company
    let isSelect = req.query.pagenum == undefined;
    console.log("isSelect-->"+isSelect)
    let selectParams = {
        date1 : ''
    }
    if(isSelect){
        selectParams.date1 = req.body.date1
        localStorage.setItem("selectParams",JSON.stringify(selectParams))
    }else{
        selectParams = JSON.parse(localStorage.getItem("selectParams"));
    }

    console.log("selectParams=>",selectParams);
    console.log(typeof selectParams.date1)

    let whereSql = "where a.id=b.id and a.gongsi = '" + company + "' and a.date_time like '%" + selectParams.date1 +"%'"


    let sql1 = "select Count(c.date_time) as count from(select a.date_time from day_trading as a,customer as b  " + whereSql +" group by a.date_time ) as c";

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
                result.pagenum = parseInt(req.query.pagenum <= 0 ? 1 : req.query.pagenum >= result.pagecounts ? result.pagecounts : req.query.pagenum);
            }

            let sql = "select a.date_time,sum(a.repayment) as repayment,sum(a.swipe) as swipe,(sum(a.basics_service_charge)+sum(a.other_service_charge)) as the_total_fee,sum(a.swipe)*(b.service_charge)-sum(a.basics_service_charge)+sum(a.other_service_charge) as profit from day_trading as a,customer as b " + whereSql;


            sql += " group by a.date_time ";
            sql += "limit " + (result.pagenum-1)*result.pageSize + "," + result.pageSize;

            db.query(sql, function (err, rows) {


                if (err) {
                    res.render('../views/statistics/statistics_select.html', {title: 'Express', ...result});
                } else {
                    result.datas = rows
                    console.log("result=>",result)
                    res.render('../views/statistics/statistics_select.html', {
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
const disableLayout ={layout: false};

// disable interface layout.hbs  user config layout: false
router.all('/Excel', function(req, res, next) {
    let selectParams = {
        date1 : ''
    }
    let company = req.cookies.company
    selectParams = JSON.parse(localStorage.getItem("selectParams"));
    //console.log("selectParams.date1-->"+selectParams.date1)
    //console.log(typeof selectParams.date1)
    let whereSql = "where a.id=b.id and a.gongsi = '" + company + "' and a.date_time like '%" + selectParams.date1 +"%'"
    let sql = "select a.date_time,sum(a.repayment) as repayment,sum(a.swipe) as swipe,(sum(a.basics_service_charge)+sum(a.other_service_charge)) as the_total_fee,sum(a.swipe)*(b.service_charge)-sum(a.basics_service_charge)+sum(a.other_service_charge) as profit from day_trading as a,customer as b " + whereSql;
    sql += " group by a.date_time ";
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
                caption:'日期',
                type:'date'
            },{
                caption:'交易额',
                type:'number'
            },{
                caption:'已刷额',
                type:'number'
            },{
                caption:'手续费',
                type:'number'
            },{
                caption:'利润',
                type:'number'
            }
        ];
        conf.rows = []
        for(let i=0;i<rows.length;i++){
            let row = [];
            row.push(rows[i].date_time)
            row.push(rows[i].repayment)
            row.push(rows[i].swipe)
            row.push(rows[i].the_total_fee)
            row.push(rows[i].profit)
            conf.rows.push(row)
        }
        var result = nodeExcel.execute(conf);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader("Content-Disposition", "attachment; filename=" + "Report.xlsx");
        res.end(result, 'binary');
    });
});
module.exports = router;
