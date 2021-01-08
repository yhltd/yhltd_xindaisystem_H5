var express = require('express');
var router = express.Router();
//引入数据库包
var db = require("./db.js");
var nodeExcel = require('excel-export');

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
/**
 * 查询列表页
 */
router.get('/select', function(req, res, next) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key,iv,token));
    if(data.table["3"].sel == 1){
        res.render('../views/month_trading/month_trading_select.html');
    }else{
        res.render('me.html', { title: 'ExpressTitle',msg: '无权限查看' });
    }
});

router.all('/ass', function (req, res, next) {
    let company = req.cookies.company
    let isSelect = req.query.pagenum == undefined;
    let selectParams = {
        recipient : '',
        cardholder: '',
        drawee: ''
    }
    if(isSelect){
        selectParams.recipient = req.body.recipient;
        selectParams.cardholder= req.body.cardholder;
        selectParams.drawee= req.body.drawee;
        localStorage.setItem("selectParams",JSON.stringify(selectParams))
    }else{
        selectParams = JSON.parse(localStorage.getItem("selectParams"));
    }

    console.log("selectParams=>",selectParams);

    let whereSql = " where a.id=b.id and a.gongsi = '" + company + "' and recipient like '%" + selectParams.recipient + "%' and cardholder like '%"+selectParams.cardholder+"%' and drawee like '%"+selectParams.drawee+"%'"


    let sql1 = " select a.id " +
        "from day_trading as a,customer as b " + whereSql;
    sql1 += "group by b.id";
    let sql2 = "select Count(c.id) as count from ( " + sql1 + ") as c"

    console.log("sql1=>",sql2)
    db.query(sql2,function (err,rows) {
        if(err){
            console.log(err);
        }else{
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
            }else{
                result.rowcounts = value[0].count
                result.pagecounts = Math.ceil(result.rowcounts/result.pageSize)
                result.pagenum = req.query.pagenum <= 0 ? 1 : req.query.pagenum >= result.pagecounts ? result.pagecounts : req.query.pagenum;
            }
            let sql = "select b.*,sum(a.repayment) as repayment,sum(a.swipe) as swipe," +
                "sum(a.repayment)-sum(a.swipe) as balance_of_credit_card," +
                "sum(a.basics_service_charge)+sum(a.other_service_charge) as the_total_fee," +
                "sum(a.swipe)*(b.service_charge)+sum(a.repayment)-sum(a.swipe) as collected_amount," +
                "sum(a.swipe)*(b.service_charge)-sum(a.basics_service_charge)+sum(a.other_service_charge) as profit "+
                "from day_trading as a,customer as b " + whereSql;

            sql += " group by b.id ";
            sql += "limit " + (result.pagenum-1)*result.pageSize + "," + result.pageSize;

            db.query(sql, function (err, rows) {
                if (err) {
                    res.render('../views/month_trading/month_trading_select.html', {title: 'Express', ...result});
                } else {
                    result.datas = rows
                    console.log("result=>",result)
                    res.render('../views/month_trading/month_trading_select.html', {
                        title: 'Express',
                        ...result
                    });
                }
            })
            let sql3 = JSON.stringify(sql);
            let sql4 = JSON.parse(sql3);
            console.log("sql4-->"+sql4);
        }
    });
});
const disableLayout ={layout: false};

// disable interface layout.hbs  user config layout: false
router.all('/Excel', function(req, res, next) {
    let selectParams = {
        recipient : '',
        cardholder: '',
        drawee: ''
    }
    let company = req.cookies.company
    selectParams = JSON.parse(localStorage.getItem("selectParams"));
    // console.log("selectParams.date1-->"+selectParams.date1)
    // console.log(typeof selectParams.date1)
    let whereSql = " where a.id=b.id and a.gongsi = '" + company + "' and recipient like '%" + selectParams.recipient + "%' and cardholder like '%"+selectParams.cardholder+"%' and drawee like '%"+selectParams.drawee+"%'"
    let sql = "select b.*,sum(a.repayment) as repayment,sum(a.swipe) as swipe," +
        "sum(a.repayment)-sum(a.swipe) as balance_of_credit_card," +
        "sum(a.basics_service_charge)+sum(a.other_service_charge) as the_total_fee," +
        "sum(a.swipe)*(b.service_charge)+sum(a.repayment)-sum(a.swipe) as collected_amount," +
        "sum(a.swipe)*(b.service_charge)-sum(a.basics_service_charge)+sum(a.other_service_charge) as profit "+
        "from day_trading as a,customer as b " + whereSql;
    sql += " group by b.id " ;
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
                caption:'收卡人',
                type:'string'
            },{
                caption:'付款人',
                type:'string'
            },{
                caption:'持卡人',
                type:'string'
            },{
                caption:'发卡行',
                type:'string'
            },{
                caption:'账单日',
                type:'date'
            },{
                caption:'还款日',
                type:'date'
            },{
                caption:'总金额',
                type:'number'
            },{
                caption:'应还款',
                type:'number'
            },{
                caption:'剩余额',
                type:'number'
            },{
                caption:'借款额',
                type:'number'
            },{
                caption:'已还款',
                type:'number'
            },{
                caption:'已刷额',
                type:'number'
            },{
                caption:'未刷金额',
                type:'number'
            },{
                caption:'总手续费',
                type:'number'
            },{
                caption:'应收金额',
                type:'number'
            },{
                caption:'利润',
                type:'number'
            }
        ];
        conf.rows = []
        for(let i=0;i<rows.length;i++){
            let row = [];
            row.push(rows[i].id)
            row.push(rows[i].recipient)
            row.push(rows[i].cardholder)
            row.push(rows[i].drawee)
            row.push(rows[i].issuing_bank)
            row.push(rows[i].bill_day)
            row.push(rows[i].repayment_date)
            row.push(rows[i].total)
            row.push(rows[i].repayable)
            row.push(rows[i].balance)
            row.push(rows[i].loan)
            //row.push(rows[i].service_charge)
            row.push(rows[i].repayment)
            row.push(rows[i].swipe)
            row.push(rows[i].balance_of_credit_card)
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