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
            res.render("order_panel.html", {company: company, account: account, password: password})
        } else {
            res.render("order_panel.html");
        }
    } else {
        res.render('order_panel.html', {title: 'ExpressTitle'});
    }
});

/**
 * 查询列表页
 */
router.get('/select', function (req, res, next) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    // console.log("读取权限: " + data)
    //
    // console.log("quanxian" + data.table["5"].sel)
    // if (data.table["5"].sel == 1) {
    res.redirect('/order_panel/ass');
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
        name: ''
    }
    if (isSelect) {
        selectParams.name = req.body.name;
        localStorage.setItem("selectParams", JSON.stringify(selectParams))
    } else {
        selectParams = JSON.parse(localStorage.getItem("selectParams"));
    }
    if (selectParams.name == undefined) {
        selectParams.name = "";
    }
    console.log("selectParams.name=>", selectParams.name)
    let whereSql = "where company = '" + company + "'"
    let type = req.params.type
    console.log(req.params)
    console.log(req.query)
    let sql1 = "select distinct type from product " + whereSql;
    console.log(sql1)
    db.query(sql1, function (err, rows) {
        try {
            if (err) {
                console.log(err);
            } else {
                console.log(rows)
                let result = {
                    datas: [],
                    types:[],
                }
                result.types = rows
                console.log("isSelect=>", isSelect)
                let sql = "select * from product " + whereSql;
                console.log("sql=>", sql)
                db.query(sql, function (err, rows) {
                    if (err) {
                        res.render('member_info.html', {title: 'Express', datas: []});
                    } else {
                        result.datas = rows
                        result.datas2 = JSON.stringify(rows)
                        console.log("result=>", result)
                        res.render('order_panel.html', {
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


router.post('/select', function (req, res, next) {
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
    console.log(value)
    let users = {
        name:value[6],
        username:value[1],
        password:value[2],
        company:value[0],
        usertype:value[5],
    }
    console.log(users)
    // if (data.table["5"].sel == 1) {
    //
    // } else {
    //     res.render('me.html', {title: 'ExpressTitle', msg: '无权限查看'});
    // }

    // let account = req.cookies.account
    // console.log(account);

    let selectParams = {
        name: ''
    }
    if (isSelect) {
        selectParams.name = req.body.name;
        localStorage.setItem("selectParams", JSON.stringify(selectParams))
    } else {
        selectParams = JSON.parse(localStorage.getItem("selectParams"));
    }
    if (selectParams.name == undefined) {
        selectParams.name = "";
    }
    console.log("selectParams.name=>", selectParams.name)
    let whereSql = "where company = '" + company + "'"
    let type = req.params.type
    console.log(req.params)
    console.log(req.query)
    let sql1 = "select distinct type from product " + whereSql;
    console.log(sql1)
    db.query(sql1, function (err, rows) {
        try {
            if (err) {
                console.log(err);
            } else {
                console.log(rows)
                let result = {
                    datas: [],
                    types:[],
                    users:users,
                }
                result.types = rows
                console.log("isSelect=>", isSelect)
                let sql = "select * from product " + whereSql;
                console.log("sql=>", sql)
                db.query(sql, function (err, rows) {
                    if (err) {
                        console.log(err);
                    } else {
                        result.datas = rows
                        console.log("result=>", result)
                        res.json(JSON.stringify(result));
                    }
                });
            }
        } catch (e) {
            res.render("error.html", {error: '网络错误，请稍后再试！'})
        }
    });
});

router.post('/select_discount', function (req, res, next) {
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
    console.log(value)
    let users = {
        name:value[6],
        username:value[1],
        password:value[2],
        company:value[0],
        usertype:value[5],
    }
    console.log(users)
    // if (data.table["5"].sel == 1) {
    //
    // } else {
    //     res.render('me.html', {title: 'ExpressTitle', msg: '无权限查看'});
    // }

    // let account = req.cookies.account
    // console.log(account);

    let selectParams = {
        name: ''
    }
    if (isSelect) {
        selectParams.name = req.body.name;
        localStorage.setItem("selectParams", JSON.stringify(selectParams))
    } else {
        selectParams = JSON.parse(localStorage.getItem("selectParams"));
    }
    if (selectParams.name == undefined) {
        selectParams.name = "";
    }
    console.log("selectParams.name=>", selectParams.name)
    let whereSql = "where company = '" + company + "' "
    let type = req.params.type
    console.log(req.params)
    console.log(req.query)
    let sql1 = "select sum(ifnull(od.zhje,0)) as xiaoji from orders as o left join orders_details as od on o.ddh = od.ddid where o.company = '" + users.company + "' and o.hyzh ='" + users.username + "'"
    console.log(sql1)
    db.query(sql1, function (err, rows) {
        try {
            if (err) {
                console.log(err);
            } else {
                console.log(rows)
                let result = {
                    xiaoji_sum: rows[0].xiaoji,
                    dengji:[],
                }
                let sql = "select convert(menkan,float) as menkan,ifnull(bili,1) as bili from member_jibie " + whereSql + " order by menkan"
                console.log("sql=>", sql)
                db.query(sql, function (err, rows) {
                    if (err) {
                        console.log(err);
                    } else {
                        result.dengji = rows
                        console.log("result=>", result)
                        res.json(JSON.stringify(result));
                    }
                });
            }
        } catch (e) {
            res.render("error.html", {error: '网络错误，请稍后再试！'})
        }
    });
});


/**
 * 新增按钮
 */
router.post('/add', function (req, res) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    console.log(data)

    let pro_list = JSON.parse(req.body.pro_list);
    let pro_num = req.body.pro_num;
    let youhui = req.body.youhui;

    let result = {
        code: '',
        msg: '',
        data: []
    }

    company = data.company
    uname = data.uname
    type = data.type
    account = data.account

    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();

    month = (month > 9) ? month : ("0" + month);
    day = (day < 10) ? ("0" + day) : day;
    var today = year + "-" + month + "-" + day;

    var sql = "select * from orders where ddh = '" + pro_num + "' and company ='" + company + "'"

    db.query(sql, function (err, rows) {
        try {
            if (err) {
                result.code = 500;
                result.msg = "单号查询失败";
                res.json(JSON.stringify(result));
                res.end('获取失败：');
            }else{
                if(rows.length > 0){
                    result.code = 402;
                    result.msg = "订单号重复";
                    res.json(JSON.stringify(result));
                }else{
                    var sql = ""
                    if(type == '商家'){
                        sql = "insert into orders(riqi,ddh,yhfa,syy,company) values('" + today + "','" + pro_num + "','" + youhui + "','" + uname + "','" + company + "')"
                    }else{
                        sql = "insert into orders(riqi,ddh,hyzh,hyxm,yhfa,company) values('" + today + "','" + pro_num  + "','" + account  + "','" + uname + "','" + youhui + "','" + company + "')"
                    }

                    db.query(sql, function (err, rows) {
                        if (err) {
                            console.log(err)
                            result.code = 500;
                            result.msg = "插入订单信息失败";
                            res.json(JSON.stringify(result));
                            res.end('获取失败：');
                        }else{
                            var sql1 = "insert into orders_details(ddid,cplx,cpmc,dw,dj,dzbl,zhdj,zhje,gs,company) values "
                            var sql2 = ""
                            for(var i=0; i<pro_list.length; i++){
                                if(sql2 == ""){
                                    sql2 = "('" + pro_num + "','" + pro_list[i].cplx + "','" + pro_list[i].cpmc + "','" + pro_list[i].dw + "','" + pro_list[i].dj + "','" + youhui + "','" + pro_list[i].zhdj + "','" + pro_list[i].zhje + "','" + pro_list[i].gs + "','" + company  + "')"
                                }else{
                                    sql2 = sql2 + ",('" + pro_num + "','" + pro_list[i].cplx + "','" + pro_list[i].cpmc + "','" + pro_list[i].dw + "','" + pro_list[i].dj + "','" + youhui + "','" + pro_list[i].zhdj + "','" + pro_list[i].zhje + "','" + pro_list[i].gs + "','" + company  + "')"
                                }
                            }
                            var sql = sql1 + sql2
                            db.query(sql, function (err, rows) {
                                if (err) {
                                    console.log(err)
                                    result.code = 500;
                                    result.msg = "插入订单产品信息失败";
                                    res.json(JSON.stringify(result));
                                    res.end('获取失败：');
                                }else{
                                    result.code = 200;
                                    result.msg = "添加成功"
                                    res.json(JSON.stringify(result));
                                }
                            })
                        }
                    })
                }

            }
        } catch (e) {
            res.render("error.html", {error: '网络错误，请稍后再试'})
        }
    })

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
module.exports = router;
