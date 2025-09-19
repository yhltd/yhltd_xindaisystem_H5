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
                        res.render('order_table.html', {
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

// 查询桌位
router.post('/select', function (req, res) {

    var sql = `SELECT * FROM order_table`;

    db.query(sql, function (err, rows) {
        if (err) {
            console.error('数据库错误:', err);
            return res.status(500).json({
                success: false,
                message: '数据库查询失败',
                error: err.message
            });
        }

        console.log('数据库返回结果数量:', rows.length);

        res.json({
            success: true,
            data: rows,
            message: '获取桌位列表成功'
        });
    });
});

// 查询状态桌位
router.post('/selectnum', function (req, res) {

    let zt = req.body.zt;
    if (zt == ""){
        var sql = `SELECT * FROM order_table`;
    }else{
        var sql = `SELECT * FROM order_table WHERE zt = '${zt}'`;
    }


    db.query(sql, function (err, rows) {
        if (err) {
            console.error('数据库错误:', err);
            return res.status(500).json({
                success: false,
                message: '数据库查询失败',
                error: err.message
            });
        }

        console.log('数据库返回结果数量:', rows.length);

        res.json({
            success: true,
            data: rows,
            message: '获取桌位列表成功'
        });
    });
});

router.post('/selectsea', function (req, res) {

    let zh = req.body.zh;
    var sql = `SELECT * FROM order_table WHERE zh LIKE '%${zh}%'`;

    db.query(sql, function (err, rows) {
        if (err) {
            console.error('数据库错误:', err);
            return res.status(500).json({
                success: false,
                message: '数据库查询失败',
                error: err.message
            });
        }

        console.log('数据库返回结果数量:', rows.length);

        res.json({
            success: true,
            data: rows,
            message: '获取桌位列表成功'
        });
    });
});


router.post('/selectdanhao', function (req, res) {

    let ddid = req.body.ddid;
    var sql = `SELECT od.*,p.id as product_id, p.price as current_price FROM orders_details od INNER JOIN product p ON od.cpmc = p.product_name WHERE od.ddid LIKE '%${ddid}%'`;

    db.query(sql, function (err, rows) {
        if (err) {
            console.error('数据库错误:', err);
            return res.status(500).json({
                success: false,
                message: '数据库查询失败',
                error: err.message
            });
        }

        console.log('数据库返回结果数量:', rows.length);

        res.json({
            success: true,
            data: rows,
            message: '获取桌位列表成功'
        });
    });
});

router.post('/updatetale', function (req, res) {
    let zh = req.body.zh;

    // 参数验证
    if (!zh) {
        return res.status(400).json({
            success: false,
            message: '桌位编号(zh)不能为空'
        });
    }

    // 更新桌位状态的SQL语句
    var sql = `UPDATE order_table SET zt = 3,sj = NULL WHERE zh LIKE '%${zh}%'`;

    // 执行更新操作
    db.query(sql, function (err, result) {
        if (err) {
            console.error('数据库错误:', err);
            return res.status(500).json({
                success: false,
                message: '更新桌位状态失败',
                error: err.message
            });
        }

        // 检查是否有行被更新
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: '未找到匹配的桌位记录'
            });
        }

        console.log('成功更新记录数:', result.affectedRows);

        res.json({
            success: true,
            message: '桌位状态更新成功',
            affectedRows: result.affectedRows
        });
    });
});

router.post('/updatetale1', function (req, res) {
    let zh = req.body.zh;

    // 参数验证
    if (!zh) {
        return res.status(400).json({
            success: false,
            message: '桌位编号(zh)不能为空'
        });
    }

    // 更新桌位状态的SQL语句
    var sql = `UPDATE order_table SET zt = 1,sj = NULL,bm = NULL WHERE zh LIKE '%${zh}%'`;

    // 执行更新操作
    db.query(sql, function (err, result) {
        if (err) {
            console.error('数据库错误:', err);
            return res.status(500).json({
                success: false,
                message: '更新桌位状态失败',
                error: err.message
            });
        }

        // 检查是否有行被更新
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: '未找到匹配的桌位记录'
            });
        }

        console.log('成功更新记录数:', result.affectedRows);

        res.json({
            success: true,
            message: '桌位状态更新成功',
            affectedRows: result.affectedRows
        });
    });
});

router.post('/updatetaleall1', function (req, res) {
    // 直接更新所有记录的zt值为1
    var sql = `UPDATE order_table SET zt = 1,sj = NULL,bm = NULL`;

    // 执行更新操作
    db.query(sql, function (err, result) {
        if (err) {
            console.error('数据库错误:', err);
            return res.status(500).json({
                success: false,
                message: '更新桌位状态失败',
                error: err.message
            });
        }

        console.log('成功更新记录数:', result.affectedRows);

        res.json({
            success: true,
            message: '所有桌位状态已更新为1',
            affectedRows: result.affectedRows
        });
    });
});

router.post('/updatetale2', function (req, res) {
    let zh = req.body.zh;
    let sj = req.body.sj;

    // 参数验证
    if (!zh) {
        return res.status(400).json({
            success: false,
            message: '桌位编号(zh)不能为空'
        });
    }

    // 更新桌位状态的SQL语句
    var sql = `UPDATE order_table SET zt = 2, sj = '${sj}' WHERE zh LIKE '%${zh}%'`;

    // 执行更新操作
    db.query(sql, function (err, result) {
        if (err) {
            console.error('数据库错误:', err);
            return res.status(500).json({
                success: false,
                message: '更新桌位状态失败',
                error: err.message
            });
        }

        // 检查是否有行被更新
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: '未找到匹配的桌位记录'
            });
        }

        console.log('成功更新记录数:', result.affectedRows);

        res.json({
            success: true,
            message: '桌位状态更新成功',
            affectedRows: result.affectedRows
        });
    });
});

router.post('/uptabletables', function (req, res) {
    let dh = req.body.dh;
    let zh = req.body.zh;

    // 参数验证
    if (!zh) {
        return res.status(400).json({
            success: false,
            message: '桌位编号(zh)不能为空'
        });
    }

    // 更新桌位状态的SQL语句
    var sql = `UPDATE order_table SET zt = 3, bm = '${dh}' WHERE zh LIKE '%${zh}%'`;

    // 执行更新操作
    db.query(sql, function (err, result) {
        if (err) {
            console.error('数据库错误:', err);
            return res.status(500).json({
                success: false,
                message: '更新桌位状态失败',
                error: err.message
            });
        }

        // 检查是否有行被更新
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: '未找到匹配的桌位记录'
            });
        }

        console.log('成功更新记录数:', result.affectedRows);

        res.json({
            success: true,
            message: '桌位状态更新成功',
            affectedRows: result.affectedRows
        });
    });
});

// router.post('/uptabletables', function (req, res) {
//     let dh = req.body.dh;
//     let zh = req.body.zh;
//
//     // 参数验证
//     if (!zh) {
//         return res.status(400).json({
//             success: false,
//             message: '桌位编号(zh)不能为空'
//         });
//     }
//
//     // 更新桌位状态的SQL语句
//     var sql = `UPDATE order_table SET zt = 3, bm = '${dh}' WHERE zh LIKE '%${zh}%'`;
//
//     // 执行更新操作
//     db.query(sql, function (err, result) {
//         if (err) {
//             console.error('数据库错误:', err);
//             return res.status(500).json({
//                 success: false,
//                 message: '更新桌位状态失败',
//                 error: err.message
//             });
//         }
//
//         // 检查是否有行被更新
//         if (result.affectedRows === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: '未找到匹配的桌位记录'
//             });
//         }
//
//         console.log('成功更新记录数:', result.affectedRows);
//
//         res.json({
//             success: true,
//             message: '桌位状态更新成功',
//             affectedRows: result.affectedRows
//         });
//     });
// });

// router.post('/uptabletables', function (req, res) {
//     let dh = req.body.dh;
//     let zh = req.body.zh;
//
//     // 参数验证
//     if (!zh) {
//         return res.status(400).json({
//             success: false,
//             message: '桌位编号(zh)不能为空'
//         });
//     }
//
//     // 更新桌位状态的SQL语句
//     var sql = `UPDATE order_table SET zt = 3, bm = '${dh}' WHERE zh LIKE '%${zh}%'`;
//
//     // 执行更新操作
//     db.query(sql, function (err, result) {
//         if (err) {
//             console.error('数据库错误:', err);
//             return res.status(500).json({
//                 success: false,
//                 message: '更新桌位状态失败',
//                 error: err.message
//             });
//         }
//
//         // 检查是否有行被更新
//         if (result.affectedRows === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: '未找到匹配的桌位记录'
//             });
//         }
//
//         console.log('成功更新记录数:', result.affectedRows);
//
//         res.json({
//             success: true,
//             message: '桌位状态更新成功',
//             affectedRows: result.affectedRows
//         });
//     });
// });


router.post('/updatejs', function (req, res) {
    let ddid = req.body.ddid;



    // 更新桌位状态的SQL语句
    var sql = `UPDATE orders_details SET zt = NULL WHERE ddid LIKE '%${ddid}%'`;

    // 执行更新操作
    db.query(sql, function (err, result) {
        if (err) {
            console.error('数据库错误:', err);
            return res.status(500).json({
                success: false,
                message: '结算失败',
                error: err.message
            });
        }



        res.json({
            success: true,
            message: '结算成功',
            affectedRows: result.affectedRows
        });
    });
});

module.exports = router;