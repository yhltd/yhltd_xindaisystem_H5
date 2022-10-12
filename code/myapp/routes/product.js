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
            res.render("product.html", {company: company, account: account, password: password})
        } else {
            res.render("product.html");
        }
    } else {
        res.render('product.html', {title: 'ExpressTitle'});
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
        res.redirect('/product/ass');
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
        product_name: ''
    }
    if (isSelect) {
        selectParams.product_name = req.body.product_name;
        //selectParams.uname = toLiteral(selectParams.uname)
        localStorage.setItem("selectParams", JSON.stringify(selectParams))
    } else {
        selectParams = JSON.parse(localStorage.getItem("selectParams"));
    }
    if (selectParams.product_name == undefined) {
        selectParams.product_name = "";
    }
    console.log("selectParams.product_name=>", selectParams.product_name)
    let whereSql = "where company = '" + company + "' and product_name like '%" + selectParams.product_name + "%'"
    let sql1 = "select count(*) as count from product " + whereSql;
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
                    product_name: selectParams.product_name
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
                let sql = "select * from product " + whereSql;
                sql += " limit " + (result.pagenum - 1) * result.pageSize + "," + result.pageSize;
                console.log("sql=>", sql)
                db.query(sql, function (err, rows) {
                    if (err) {
                        res.render('product.html', {title: 'Express', datas: []});
                    } else {
                        result.datas = rows
                        console.log("result=>", result)
                        res.render('product.html', {
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
/**
 * 新增页面跳转
 */

router.get('/add', function (req, res) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    // if (data.table["5"].add == 1) {
        res.render('product/productAdd.html');
    // } else {
    //     res.render('me.html', {title: 'ExpressTitle', msg: '无权限录入'});
    // }

});
router.post('/add', function (req, res) {
    if (req.body.checkForm) {
        let token = localStorage.getItem("token");
        let key = '123456789abcdefg';
        let iv = 'abcdefg123456789';
        let data = JSON.parse(decrypt(key, iv, token));
        let result = {
            type: "",
            product_name: "",
            unit:"" ,
            price: "",
            chengben: "",
            tingyong: "",
        };
        //let company = req.body.company;
        let type = req.body.type;
        result.type = type;
        type = toLiteral(type);
        let product_name = req.body.product_name;
        result.product_name = product_name;
        product_name = toLiteral(product_name);
        let unit = req.body.unit;
        result.unit = unit;
        unit = toLiteral(unit);
        let price = req.body.price;
        result.price = price;
        price = toLiteral(price);
        let chengben = req.body.chengben;
        result.chengben = chengben;
        chengben = toLiteral(chengben);
        let tingyong = req.body.tingyong;
        result.tingyong = tingyong;
        tingyong = toLiteral(tingyong);

        company = data.company
        //data = toLiteral(account)
        //let sql1 = "select account from users where account = " + account
        //console.log("xinzeng")

        let sql1 = "insert into product(company,type,product_name,unit,price,chengben,tingyong) " +
            "values('" + data.company + "','" + type + "','" + product_name + "','" + unit + "','" + price + "','" + chengben + "','" + tingyong + "')"
        console.log("sql1:" + sql1)
        db.query(sql1, function (err, rows) {
            try {
                if (err) {
                    res.end('新增失败：');
                } else {
                    res.redirect('/product/select');
                }
            } catch (e) {
                res.render("error.html", {error: '网络错误，请稍后再试'})
            }

        })

    }
});

/**
 * 删
 */
router.get('/del/:id', function (req, res) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    if (data.table["5"].del == 1) {
        let id = req.params.id;
        db.query("delete from product where id=" + id, function (err, rows) {
            try {
                if (err) {
                    res.end('删除失败：')
                } else {
                    res.redirect('/product/ass')
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
    let value = Object.values(data);
    console.log("value-->" + value)
    let result = {
        type: "",
        product_name: "",
        unit:"" ,
        price: "",
        chengben: "",
        tingyong: "",
    }
    // if (data.table["5"].upd == 1) {
        let id = req.params.id
        if (id == 0) {
            id = value[5];
        }
        db.query("select * from product where id= '" + id + "'", function (err, rows) {

            try {
                if (err) {
                    res.end('修改页面跳转失败：');
                } else {
                    console.log("rows:"+rows)
                    let values = JSON.stringify(rows);						//将rows转为字符串
                    values = JSON.parse(values);
                    result.type = values[0].type;
                    result.product_name = values[0].product_name;
                    result.unit = values[0].unit;
                    result.price = values[0].price;
                    result.chengben = values[0].chengben;
                    result.tingyong = values[0].tingyong;
                    res.render("product/productUpdate.html", {
                        datas:rows,
                        ...result
                    });       //直接跳转
                    console.log("result-->"+result)
                }
            } catch (e) {
                res.render("error.html", {error: '网络错误，请稍后再试'})
            }
        });

    // } else {
    //     res.render('me.html', {title: 'ExpressTitle', msg: '无权限修改'});
    // }
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

router.all('/update/:id', function (req, res) {
    if (req.body.checkForm) {
        let token = localStorage.getItem("token");
        let key = '123456789abcdefg';
        let iv = 'abcdefg123456789';
        let data = JSON.parse(decrypt(key, iv, token));
        //let id = req.body.id;
        let value = Object.values(data);
        console.log("value-->" + value)
        let id = req.params.id;
        console.log("id-->" + id);
        let result = {
            type: "",
            product_name: "",
            unit:"" ,
            price: "",
            chengben: "",
            tingyong: "",
        }
        // let company = req.body.company;
        // company = toLiteral(company)
        let type = req.body.type;
        result.type = type;
        type = toLiteral(type);
        let product_name = req.body.product_name;
        result.product_name = product_name;
        product_name = toLiteral(product_name);
        let unit = req.body.unit;
        result.unit = unit;
        unit = toLiteral(unit);
        let price = req.body.price;
        result.price = price;
        price = toLiteral(price);
        let chengben = req.body.chengben;
        result.chengben = chengben;
        chengben = toLiteral(chengben);
        let tingyong = req.body.tingyong;
        result.tingyong = tingyong;
        tingyong = toLiteral(tingyong);
        let company = data.company;
        company = toLiteral(company);

        let sql1 = "update product set type='" + type + "', product_name='" + product_name + "', unit='" + unit + "', price='" + price + "', chengben='" + chengben + "', tingyong='" + tingyong + "' where id=" + id;
        console.log("sql1->" + sql1)
        db.query(sql1, function (err, rows) {
            try {
                if (err) {
                    res.end('修改失败：');
                } else {
                    res.redirect('/product/ass');
                }
            } catch (e) {
                res.render("error.html", {error: '网络错误，请稍后再试'})
            }
        });


    }
});
router.all('/Excel', function (req, res, next) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    selectParams = JSON.parse(localStorage.getItem("selectParams"));
    let sql = "select * from product where company = '" + data.company + "'";
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
                    caption: '序号',
                    type: 'number'
                }, {
                    caption: '商品类别',
                    type: 'string'
                }, {
                    caption: '商品名称',
                    type: 'string'
                }, {
                    caption: '单位',
                    type: 'string'
                }, {
                    caption: '单价',
                    type: 'number'
                }, {
                    caption: '成本',
                    type: 'number'
                }, {
                    caption: '是否停用',
                    type: 'string'
                }
            ];
            conf.rows = []
            for (let i = 0; i < rows.length; i++) {
                let row = [];
                row.push(rows[i].id)
                row.push(rows[i].type)
                row.push(rows[i].product_name)
                row.push(rows[i].unit)
                row.push(rows[i].price)
                row.push(rows[i].chengben)
                row.push(rows[i].tingyong)
                conf.rows.push(row)
            }
            let result = nodeExcel.execute(conf);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats');
            res.setHeader("Content-Disposition", "attachment; filename=" + "product.xlsx");
            res.end(result, 'binary');
        } catch (e) {
            res.render("error.html", {error: '网络错误，请稍后再试'})
        }
    });


});
module.exports = router;
