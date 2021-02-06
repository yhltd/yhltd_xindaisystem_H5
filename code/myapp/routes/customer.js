let express = require('express');
let router = express.Router();
//引入数据库包
let db = require("./db.js");
let nodeExcel = require('excel-export');

if (typeof localStorage === "undefined" || localStorage === null) {
    let LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
}
let crypto = require("crypto");
function encrypt(key, iv, data) {
    let decipher = crypto.createCipheriv('aes-128-cbc', key, iv);
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
/**
 * 查询列表页
 */
router.get('/select', function (req, res, next) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    console.log("quanxian" + data.table["1"].sel)
    if (data.table["1"].sel == 1) {
        //res.render('customer_select.html', {title: 'ExpressTitle'});
        res.redirect('/customer/ass');
    } else {
        res.render('me.html', {title: 'ExpressTitle', msg: '无权限查看'});
    }
});

router.all('/ass', function (req, res, next) {
    let isSelect = req.query.pagenum == undefined;
    let token = localStorage.getItem("token")
    let key = '123456789abcdefg';
    //console.log('加密的key:', key);
    let iv = 'abcdefg123456789';
    //console.log('加密的iv:', iv);
    let data = JSON.parse(decrypt(key, iv, token));
    let value = Object.values(data);
    let company = value[0];
    let selectParams = {
        recipient: '',
        cardholder: '',
        drawee: ''
    }
    console.log('isSelect:', isSelect);
    if (isSelect) {
        selectParams.recipient = req.body.recipient;
        selectParams.cardholder = req.body.cardholder;
        selectParams.drawee = req.body.drawee;
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
    let whereSql = " where gongsi = '" + toLiteral(company) + "' and recipient like '%" + toLiteral(selectParams.recipient) + "%' and cardholder like '%" + toLiteral(selectParams.cardholder) + "%' and drawee like '%" + toLiteral(selectParams.drawee) + "%'"

    let sql1 = "select Count(*) as count from customer" + whereSql;
    //console.log(sql1)
    db.query(sql1, function (err, rows) {
        try {
            if (err) {
                console.log(err);
            } else {
                let value = rows;
                //console.log("value-->"+value)
                let result = {
                    datas: [],
                    rowcounts: 0,
                    pagecounts: 0,
                    pagenum: 0,
                    pageSize: 10,
                    msg:'',
                    recipient:selectParams.recipient,
                    cardholder:selectParams.cardholder,
                    drawee:selectParams.drawee
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
                if(result.rowcounts == 0){
                    result.msg = '没有查到相关信息'
                }
                let sql2 = "select * from customer " + whereSql + "limit " + (result.pagenum - 1) * result.pageSize + "," + result.pageSize;
                //console.log(sql2)
                db.query(sql2, function (err, rows) {
                    if (err) {
                        res.render('customer_select.html', {title: 'Express', ...result});  // this renders "views/users.html"
                    } else {
                        result.datas = rows
                        console.log("result=>", result)
                        res.render('customer_select.html', {
                            title: 'Express',
                            ...result
                        });
                    }
                })
                let sql3 = JSON.stringify(sql2);
                let sql4 = JSON.parse(sql3);
                console.log(sql4);
            }
        } catch (e) {
            res.render("error.html", {error: '网络错误，请稍后再试'})
        }
    });
});
router.get('/add', function (req, res) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    if (data.table["1"].add == 1) {
        res.render('add.html');
    } else {
        res.render('me.html', {title: 'ExpressTitle', msg: '无权限录入'});
    }
});
router.post('/add', function (req, res) {

    if (req.body.checkForm) {
        let token = localStorage.getItem("token")
        let key = '123456789abcdefg';
        //console.log('加密的key:', key);
        let iv = 'abcdefg123456789';
        //console.log('加密的iv:', iv);
        let data = JSON.parse(decrypt(key, iv, token));
        let value = Object.values(data);
        let company = value[0];
        //let company = req.cookies.company
        let recipient = req.body.recipient;
        recipient = toLiteral(recipient);
        let cardholder = req.body.cardholder;
        cardholder = toLiteral(cardholder);
        let drawee = req.body.drawee;
        drawee = toLiteral(drawee);
        let issuing_bank = req.body.issuing_bank;
        issuing_bank = toLiteral(issuing_bank);
        let bill_day = req.body.bill_day;
        let repayment_date = req.body.repayment_date;
        let total = req.body.total;
        let repayable = req.body.repayable;
        let balance = req.body.balance;
        let loan = req.body.loan;
        let service_charge = req.body.service_charge;
        let telephone = req.body.telephone;
        let password = req.body.password;
        password = toLiteral(password)
        let staff = req.body.staff;
        staff = toLiteral(staff)
        console.log("staff",staff)
        db.query("insert into customer(recipient,cardholder,drawee,issuing_bank,bill_day,repayment_date,total,repayable,balance,loan,service_charge,telephone,password,staff,gongsi) values('" + toLiteral(recipient) + "','"
            + cardholder + "','" + drawee+ "','" + issuing_bank + "','"
            + bill_day + "','" + repayment_date + "',"
            + total + "," + repayable + "," + balance + ","
            + loan + "," + service_charge + ",'" + telephone + "','" + password + "','" + staff + "','" + company + "')", function (err, rows) {
            try {
                if (err) {
                    res.end('新增失败：');
                } else {
                    res.redirect('/customer/ass');
                }
            } catch (e) {
                res.render("error.html", {error: '网络错误，请稍后再试'})
            }
        })


    }
});

router.get('/asd', function (req, res) {
    res.render('index.html');
});
/**
 * 删
 */
router.get('/del/:id', function (req, res) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    if (data.table["1"].del == 1) {
        let id = req.params.id;

        db.query("delete from customer where id=" + id, function (err, rows) {
            try {
                if (err) {
                    res.end('删除失败：')
                } else {
                    db.query("delete from day_trading where id =" +id,function (err,rows) {
                       if (err){
                           res.end('删除失败：')
                       } else{
                           res.redirect('/customer/ass')
                       }
                    })

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
    if (data.table["1"].upd == 1) {
        let id = req.params.id;

        db.query("select * from customer where id=" + id, function (err, rows) {
            try {
                if (err) {
                    res.end('修改页面跳转失败：' + err);
                } else {
                    res.render("update.html", {datas: rows});       //直接跳转
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
 * 修改用户信息
 */
router.post('/update', function (req, res) {
    let ck = req.body.checkForm

         console.log(ck)
    if (req.body.checkForm) {
        let token = localStorage.getItem("token")
        let key = '123456789abcdefg';
        //console.log('加密的key:', key);
        let iv = 'abcdefg123456789';
        //console.log('加密的iv:', iv);
        let data = JSON.parse(decrypt(key, iv, token));
        let value = Object.values(data);
        let company = value[0];
        //let company = req.cookies.company
        let id = req.body.id;
        let recipient = req.body.recipient;
        recipient = toLiteral(recipient);
        let cardholder = req.body.cardholder;
        cardholder = toLiteral(cardholder)
        let drawee = req.body.drawee;
        drawee = toLiteral(drawee)
        let issuing_bank = req.body.issuing_bank;
        issuing_bank = toLiteral(issuing_bank)
        let bill_day = req.body.bill_day;
        let repayment_date = req.body.repayment_date;
        let total = req.body.total;
        let repayable = req.body.repayable;
        let balance = req.body.balance;
        let loan = req.body.loan;
        let service_charge = req.body.service_charge;
        let telephone = req.body.telephone;
        let password = req.body.password;
        password = toLiteral(password)
        let staff = req.body.staff;
        staff = toLiteral(staff)
        let sql = "update customer set recipient='" + recipient + "',cardholder='" + cardholder + "',drawee='" + drawee + "',issuing_bank='" + issuing_bank + "',bill_day='" + bill_day + "',repayment_date='" + repayment_date + "',total='" + total + "',repayable='" + repayable + "',balance='" + balance + "',loan='" + loan + "',service_charge='" + service_charge + "',telephone='" + telephone + "',password='" + password + "',staff='" + staff + "',gongsi = '" + company + "' where id=" + id;
        console.log("sql:"+sql)
        db.query(sql, function (err, rows) {
            try {
                if (err) {
                    res.end('修改失败：' + err);
                } else {
                    res.redirect('/customer/ass');
                }
            } catch (e) {
                res.render("error.html", {error: '网络错误，请稍后再试'})
            }
        });

    }
});

const disableLayout = {layout: false};

// disable interface layout.hbs  user config layout: false
router.all('/Excel', function (req, res, next) {
    let selectParams = {
        recipient: '',
        cardholder: '',
        drawee: ''
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
    // console.log("selectParams.date1-->"+selectParams.date1)
    // console.log(typeof selectParams.date1)
    let whereSql = " where gongsi = '" + company + "' and recipient like '%" + selectParams.recipient + "%' and cardholder like '%" + selectParams.cardholder + "%' and drawee like '%" + selectParams.drawee + "%'"
    let sql = "select * from customer " + whereSql;

    db.query(sql, function (err, rows) {
        try {
            if (err) {
                console.log(err);
            } else {
                let values = rows
                console.log("value=>", values)
            }
            // let sql2 = JSON.stringify(sql);
            // let sql3 = JSON.parse(sql2);
            //console.log(sql3);
            let conf = {};
            conf.stylesXmlFile = "styles.xml";
            conf.name = "mysheet";
            conf.cols = [
                {
                    caption: '序号',
                    type: 'number'
                }, {
                    caption: '收卡人',
                    type: 'string'
                }, {
                    caption: '付款人',
                    type: 'string'
                }, {
                    caption: '持卡人',
                    type: 'string'
                }, {
                    caption: '发卡行',
                    type: 'string'
                }, {
                    caption: '账单日',
                    type: 'string'
                }, {
                    caption: '还款日',
                    type: 'string'
                }, {
                    caption: '总金额',
                    type: 'number'
                }, {
                    caption: '应还款',
                    type: 'number'
                }, {
                    caption: '剩余额',
                    type: 'number'
                }, {
                    caption: '借款额',
                    type: 'number'
                }, {
                    caption: '手续费',
                    type: 'number'
                }, {
                    caption: '电话号',
                    type: 'string'
                }, {
                    caption: '密码',
                    type: 'string'
                }, {
                    caption: '员工',
                    type: 'string'
                }
            ];
            conf.rows = []
            for (let i = 0; i < rows.length; i++) {
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
                row.push(rows[i].service_charge)
                row.push(rows[i].telephone)
                row.push(rows[i].password)
                row.push(rows[i].staff)
                conf.rows.push(row)
            }
            let result = nodeExcel.execute(conf);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats');
            res.setHeader("Content-Disposition", "attachment; filename=" + "customer.xlsx");
            res.end(result, 'binary');
        } catch (e) {
            res.render("error.html", {error: '网络错误，请稍后再试'})
        }
    });


});
module.exports = router;
