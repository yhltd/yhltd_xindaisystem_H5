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
router.get('/del/:id', function (req, res) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    let id = req.params.id;
    console.log("id==>"+id)
    let did = req.query.did;
    console.log("did==>"+did)
    db.query("delete from orders_details where id=" + id, function (err, rows) {
        try {
            if (err) {
                res.end('删除失败：' + err)
            } else {
                res.redirect('/orders_details/orders_details/' + did);
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
        let cplx = req.body.cplx;
        let cpmc = req.body.cpmc;
        let dw = req.body.dw;
        let dj = req.body.dj;
        let dzbl = req.body.dzbl;
        let zhdj = req.body.zhdj;
        let zhje = req.body.zhje;
        let id = req.body.id;
        let did = req.query.id;
        console.log("id-->"+id)
        console.log("did-->"+did)

        db.query("update orders_details set cplx='" + cplx + "',cpmc='" + cpmc + "',dw='" + dw + "',dj='" + dj + "',dzbl='" + dzbl + "',zhdj='" + zhdj + "',zhje='" + zhje + "',company = '" + company + "' where id='" + id + "'", function (err, rows) {
            try {
                if (err) {
                    res.end('修改失败：' + err);
                } else {
                    console.log(did)
                    res.redirect('/orders_details/orders_details/' + did);
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
router.get('/toUpdate/:id', function (req, res) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    let did = req.query.did;
    let id = req.params.id;
    console.log("id--》"+id)
    console.log("did--》"+did)

    db.query("select * from orders_details where id=" + id, function (err, rows) {
        try {
            if (err) {
                res.end('修改页面跳转失败：' + err);
            } else {
                res.render("../views/orders/orders_details_update.html", {datas: rows, did: did});       //直接跳转
            }
        } catch (e) {
            res.render("error.html", {error: '网络错误，请稍后再试'})
        }
    });
});


router.get('/insert/:id', function (req, res) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    let id = req.params.id;

    db.query("select * from orders where id=" + id, function (err, rows) {
        try {
            if (err) {
                res.end('修改页面跳转失败：' + err);
            } else {
                res.render("orders/orders_details_add.html", {datas: rows});       //直接跳转
            }
        } catch (e) {
            res.render("error.html", {error: '网络错误，请稍后再试'})
        }
    });

});

router.get('/add', function (req, res) {
    res.render('orders/orders_details_add.html');
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
        let ddid = req.body.ddid;
        ddid = toLiteral(ddid);
        let cplx = req.body.cplx;
        cplx = toLiteral(cplx);
        // let product_bianhao = req.body.product_bianhao;
        // product_bianhao = toLiteral(product_bianhao);
        let cpmc = req.body.cpmc;
        cpmc = toLiteral(cpmc);
        let dw = req.body.dw;
        dw = toLiteral(dw);
        let dj = req.body.dj;
        dj = toLiteral(dj);
        let dzbl = req.body.dzbl;
        dzbl = toLiteral(dzbl);
        let zhdj = req.body.zhdj;
        zhdj = toLiteral(zhdj);
        let zhje = req.body.zhje;
        zhje = toLiteral(zhje);
        let gs = req.body.gs;
        gs = toLiteral(gs);


        db.query("insert into orders_details(ddid,cplx,cpmc,dw,dj,dzbl,zhdj,zhje,company,gs) values('" + ddid + "','"
            + cplx + "','" + cpmc + "','" + dw + "','" + dj + "','"+ dzbl + "','" + zhdj + "','" + zhje + "','" + company + "','" + gs + "')", function (err, rows) {
            try {
                if (err) {
                    res.end('新增失败：');
                } else if(zhdj=null){
                    zhdj=0;
                }else if(zhje=null){
                    zhje=0;
                }else{
                    res.redirect('orders_details/ass' + id);
                }
            } catch (e) {
                res.render("error.html", {error: '网络错误，请稍后再试'})
            }
        });


    }
});


router.get('/ass/:id', function (req, res, next) {
    let id = req.params.id;

    db.query("select * from orders_details where id=" + id + "", function (err, rows) {
        try {
            console.log('==========');
            if (err) {
                res.render('orders/orders_details.html', {title: 'Express', datas: []});  // this renders "views/users.html"
            } else {
                res.render('orders/orders_details.html', {title: 'Express', datas: rows});
            }
        } catch (e) {
            res.render("error.html", {error: '网络错误，请稍后再试'})
        }
    })

});
router.all('/orders_details/:id', function (req, res, next) {
    console.log("开始")
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));

    let id = req.params.id;
    let isSelect = req.query.pagenum == undefined;

     let sql1 = "select Count(*) as count from orders_details where ddid='" + id + "' and company = '" + data.company + "'";
    //console.log(sql1);

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
                    pageSize: 3,
                }

                // let sql = "select * from orders_details right join orders on orders.id = orders_details.ddid where orders.id=" + id;
                let sql = "select id,riqi,ddh,hyzh,hyxm,yhfa,heji.xfje,heji.ssje,heji.yhje,syy,ord.company from orders as ord left join(select ddid,company,sum(convert(dj,float) * convert(gs,float)) as xfje,sum(convert(zhdj,float) * convert(gs,float)) as ssje,round(sum(convert(dj,float) * convert(gs,float)) - sum(convert(zhdj,float) * convert(gs,float)),2) as yhje from orders_details group by ddid) as heji on ord.ddh = heji.ddid and ord.company = heji.company where ddh='" + id + "' and ord.company = '" + data.company + "' ";
                console.log(sql)
                // sql += " limit " + (result.pagenum - 1) * result.pageSize + "," + result.pageSize;
                db.query(sql, function (err, rows) {
                    if (err) {
                        res.render('orders/orders_details.html', {title: 'Express', ...result});
                    } else {

                        // console.log("isSelect=>",isSelect)
                        if (isSelect) {
                            result.rowcounts = value[0].count
                            result.pagecounts = Math.ceil(result.rowcounts / result.pageSize)
                            result.pagenum = 1
                        } else {

                            result.rowcounts = value[0].count
                            result.pagecounts = Math.ceil(result.rowcounts / result.pageSize)
                            result.pagenum = parseInt(req.query.pagenum <= 0 ? 1 : req.query.pagenum >= result.pagecounts ? result.pagecounts : req.query.pagenum);

                        }

                        result.datas = rows
                        let sql1 = "select * from orders_details  where ddid='" + id + "' and company ='" + data.company + "'";
                        //let sql1 = "select od.id,od.ddid,od.cplx,od.cpmc,od.dw,od.dj,od.dzbl,od.zhdj,od.zhje,od.gs,o.riqi,o.ddh,o.hyzh,o.hyxm,o.yhfa,od.xfje,od.ssje,od.yhje,o.syy,o.company from (select id,sum(dj*gs) as xfje,sum(zhdj*gs) as ssje,sum(dj*gs)-sum(zhdj*gs) as yhje,ddid,cplx,cpmc,dw,dj,dzbl,zhdj,zhje,gs,company from orders_details group by ddid) as od  right join orders as o on o.id = od.ddid where o.id=" + id;
                        sql1 += " limit " + (result.pagenum - 1) * result.pageSize + "," + result.pageSize;
                        db.query(sql1, function (err, rows) {
                            if (err) {
                                res.render('orders/orders_details.html', {title: 'Express', ...result});
                            } else {
                                result.datass = rows
                                console.log("result=>",result)
                                res.render('orders/orders_details.html', {
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





router.get('/select_ass', function (req, res, next) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    if (data.table["2"].sel == 1) {
        //res.render('/orders/orders_details.html');
        res.redirect('/orders_details/select');
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
                        res.render('orders/orders_details.html', {title: 'Express', ...result});
                    } else {
                        result.datas = rows
                        console.log("result=>", result)
                        res.render('orders/orders_details.html', {
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