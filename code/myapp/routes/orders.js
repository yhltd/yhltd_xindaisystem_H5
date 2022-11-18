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
    res.redirect('/orders/ass');
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
        date1: '',
        date2: '',
        ddh: '',
        syy: '',
        hyxm: ''
    }
    console.log('isSelect:', isSelect);
    if (isSelect) {
        selectParams.date1 = req.body.date1;
        selectParams.date2 = req.body.date2;
        selectParams.ddh = req.body.ddh;
        selectParams.syy = req.body.syy;
        selectParams.hyxm = req.body.hyxm;
        localStorage.setItem("selectParams", JSON.stringify(selectParams))
    } else {
        selectParams = JSON.parse(localStorage.getItem("selectParams"));
    }
    if (selectParams.ddh == undefined){
        selectParams.ddh ="";
    }
    if (selectParams.syy == undefined){
        selectParams.syy ="";
    }
    if (selectParams.hyxm == undefined){
        selectParams.hyxm ="";
    }
    if (selectParams.date1 == undefined || selectParams.date1 == ''){
        selectParams.date1 ="1999-01-01";
    }
    if (selectParams.date2 == undefined || selectParams.date2 == ''){
        selectParams.date2 ="2122-01-01";
    }
    let whereSql = "  and ddh like '%" + toLiteral(selectParams.ddh) + "%' and ifnull(syy,'') like '%" + toLiteral(selectParams.syy) + "%' and ifnull(hyxm,'') like '%" + toLiteral(selectParams.hyxm) + "%' and riqi>='" + toLiteral(selectParams.date1) + "' and riqi<='" + toLiteral(selectParams.date2) + "'"

    let sql1 = "select Count(*) as count from orders where company = '" + toLiteral(company) + "'" + whereSql;

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
                    riqi:selectParams.riqi,
                    ddh:selectParams.ddh,
                    syy:selectParams.syy,
                    hyxm:selectParams.hyxm
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
                // let sql2 = "select * from orders where company = '" + toLiteral(company) + "'" + whereSql + "limit " + (result.pagenum - 1) * result.pageSize + "," + result.pageSize;
                let sql2 = "select id,riqi,ddh,hyzh,hyxm,yhfa,heji.xfje,heji.ssje,heji.yhje,syy,ord.company from orders as ord left join(select ddid,company,sum(convert(dj,float) * convert(gs,float)) as xfje,sum(convert(zhdj,float) * convert(gs,float)) as ssje,round(sum(convert(dj,float) * convert(gs,float)) - sum(convert(zhdj,float) * convert(gs,float)),2) as yhje from orders_details group by ddid) as heji on ord.ddh = heji.ddid and ord.company = heji.company where ord.company = '" + toLiteral(company) + "'" + whereSql + "limit " + (result.pagenum - 1) * result.pageSize + "," + result.pageSize;
                //console.log(sql2)
                db.query(sql2, function (err, rows) {
                    if (err) {
                        res.render('orders.html', {title: 'Express', ...result});  // this renders "views/users.html"
                    } else {
                        result.datas = rows
                        console.log("result=>", result)
                        res.render('orders.html', {
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
        res.render('orders/orders_add.html');
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
        let riqi = req.body.riqi;
        riqi = toLiteral(riqi);
        let ddh = req.body.ddh;
        ddh = toLiteral(ddh);
        let hyzh = req.body.hyzh;
        hyzh = toLiteral(hyzh);
        let hyxm = req.body.hyxm;
        hyxm = toLiteral(hyxm);
        let yhfa = req.body.yhfa;
        yhfa = toLiteral(yhfa);
        let xfje = req.body.xfje;
        xfje = toLiteral(xfje);
        let ssje = req.body.ssje;
        ssje = toLiteral(ssje);
        let yhje = req.body.yhje;
        yhje = toLiteral(yhje);
        let syy = req.body.syy;
        syy = toLiteral(syy);
        db.query("insert into orders(riqi,ddh,hyzh,hyxm,yhfa,xfje,ssje,yhje,syy,company) values('" + riqi + "','"
            + ddh + "','" + hyzh+ "','" + hyxm + "','"+ yhfa + "','" + xfje + "','"+ ssje + "','" + yhje + "','" + syy + "','"
            + company +  "')", function (err, rows) {
            try {
                if (err) {
                    res.end('新增失败：');
                } else {
                    res.redirect('/orders/ass');
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

        db.query("delete from orders where id=" + id, function (err, rows) {
            try {
                if (err) {
                    res.end('删除失败：')
                } else {
                    db.query("delete from orders where id =" +id,function (err,rows) {
                        if (err){
                            res.end('删除失败：')
                        } else{
                            res.redirect('/orders/ass')
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
    let id = req.params.id;
    console.log(id)
    db.query("select * from orders where id=" + id, function (err, rows) {
        try {
            if (err) {
                res.end('修改页面跳转失败：' + err);
            } else {
                console.log(rows)
                res.render("ordersUpdate.html", {datas: rows});       //直接跳转
            }
        } catch (e) {
            res.render("error.html", {error: '网络错误，请稍后再试'})
        }
    });

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
        let old_id = req.body.old_id;
        let riqi = req.body.riqi;
        let ddh = req.body.ddh;
        let hyzh = req.body.hyzh;
        let hyxm = req.body.hyxm;
        let yhfa = req.body.yhfa;
        let syy = req.body.syy;
        console.log(old_id)
        let sql = "update orders set riqi='" + riqi + "',ddh='" + ddh + "',hyzh='" + hyzh + "',hyxm='" + hyxm + "',yhfa='" + yhfa + "',syy='" + syy + "' where id=" + id;
        console.log("sql:"+sql)
        db.query(sql, function (err, rows) {
            try {
                if (err) {
                    res.end('订单信息修改失败：' + err);
                } else {
                    let sql = "update orders_details set ddid='" + ddh + "' where ddid=" + old_id;
                    console.log("sql:"+sql)
                    db.query(sql, function (err, rows) {
                        if (err) {
                            res.end('产品信息修改失败：' + err);
                        } else {
                            res.redirect('/orders/ass');
                        }
                    });
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
    console.log(selectParams)
    let panduan = {}
    let whereSql = " where company = '" + company + "'"
    let sql = "select * from orders " + whereSql;
    console.log(sql)
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
                    type: 'string'
                },
                {
                    caption: '日期',
                    type: 'string'
                }, {
                    caption: '订单号',
                    type: 'string'
                }, {
                    caption: '会员账号',
                    type: 'string'
                }, {
                    caption: '会员姓名',
                    type: 'string'
                }, {
                    caption: '优惠方案',
                    type: 'string'
                }, {
                    caption: '消费金额',
                    type: 'string'
                }, {
                    caption: '实收金额',
                    type: 'string'
                }, {
                    caption: '优惠金额',
                    type: 'string'
                }, {
                    caption: '收银员',
                    type: 'string'
                }
            ];
            conf.rows = []
            for (let i = 0; i < rows.length; i++) {
                let row = [];
                row.push(rows[i].id)
                row.push(rows[i].riqi)
                row.push(rows[i].ddh)
                row.push(rows[i].hyzh)
                row.push(rows[i].hyxm)
                row.push(rows[i].yhfa)
                row.push(rows[i].xfje)
                row.push(rows[i].ssje)
                row.push(rows[i].yhje)
                row.push(rows[i].syy)

                conf.rows.push(row)
            }
            console.log(conf)
            let result = nodeExcel.execute(conf);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats');
            res.setHeader("Content-Disposition", "attachment; filename=" + "orders.xlsx");
            res.end(result, 'binary');
        } catch (e) {
            res.render("error.html", {error: '网络错误，请稍后再试'})
        }
    });


});
module.exports = router;
