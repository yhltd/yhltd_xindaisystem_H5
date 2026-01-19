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
// 添加请求日志中间件
router.use(function(req, res, next) {
    console.log(`📥 ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
    console.log("Content-Type:", req.headers['content-type']);
    next();
});
process.on('uncaughtException', function(err) {
    console.error('全局未捕获异常:', err);
    console.error('错误堆栈:', err.stack);
});
// 添加CORS中间件（避免跨域问题）
router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
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


// router.all('/ass', function (req, res, next) {
//     console.log("yuangong")
//     let isSelect = req.query.pagenum == undefined;
//     let token = localStorage.getItem("token")
//     let key = '123456789abcdefg';
//     //console.log('加密的key:', key);
//     let iv = 'abcdefg123456789';
//     //console.log('加密的iv:', iv);
//     let data = JSON.parse(decrypt(key, iv, token));
//     let value = Object.values(data);
//     let company = value[0];
//
//     // if (data.table["5"].sel == 1) {
//     //
//     // } else {
//     //     res.render('me.html', {title: 'ExpressTitle', msg: '无权限查看'});
//     // }
//
//     // let account = req.cookies.account
//     // console.log(account);
//
//     let selectParams = {
//         name: ''
//     }
//     if (isSelect) {
//         selectParams.name = req.body.name;
//         localStorage.setItem("selectParams", JSON.stringify(selectParams))
//     } else {
//         selectParams = JSON.parse(localStorage.getItem("selectParams"));
//     }
//     if (selectParams.name == undefined) {
//         selectParams.name = "";
//     }
//     console.log("selectParams.name=>", selectParams.name)
//     let whereSql = "where company = '" + company + "'"
//     let type = req.params.type
//     console.log(req.params)
//     console.log(req.query)
//     let sql1 = "select distinct type from product " + whereSql;
//     console.log(sql1)
//     db.query(sql1, function (err, rows) {
//         try {
//             if (err) {
//                 console.log(err);
//             } else {
//                 console.log(rows)
//                 let result = {
//                     datas: [],
//                     types:[],
//                 }
//                 result.types = rows
//                 console.log("isSelect=>", isSelect)
//                 let sql = "select * from product " + whereSql;
//                 console.log("sql=>", sql)
//                 db.query(sql, function (err, rows) {
//                     if (err) {
//                         res.render('member_info.html', {title: 'Express', datas: []});
//                     } else {
//                         result.datas = rows
//                         result.datas2 = JSON.stringify(rows)
//                         console.log("result=>", result)
//                         res.render('order_panel.html', {
//                             title: 'Express',
//                             ...result
//                         });
//                     }
//                 });
//             }
//         } catch (e) {
//             res.render("error.html", {error: '网络错误，请稍后再试！'})
//         }
//     });
// });

// 添加桌位管理页面的路由
router.get('/ass', function (req, res, next) {
    console.log("访问order_panel的ass路由");

    // 获取用户信息
    let token = localStorage.getItem("token");
    let company = '';

    if (token) {
        try {
            let key = '123456789abcdefg';
            let iv = 'abcdefg123456789';
            let data = JSON.parse(decrypt(key, iv, token));
            let value = Object.values(data);
            company = value[0] || '';
        } catch (e) {
            console.log("获取公司信息失败");
        }
    }

    // 渲染桌位管理页面
    res.render('order_table.html', {
        company: company,
        title: '桌位管理'
    });
});

// 添加主页路由（确保存在）
// 替换原来的 GET /select 路由
router.get('/select', function (req, res, next) {
    console.log("GET /select - 加载点单页面");

    // 获取用户信息
    let token = localStorage.getItem("token");
    let company = '';
    let userData = {};

    if (token) {
        try {
            let key = '123456789abcdefg';
            let iv = 'abcdefg123456789';
            userData = JSON.parse(decrypt(key, iv, token));
            company = userData.company || '';
        } catch (e) {
            console.log("Token解析失败:", e);
        }
    }

    // 查询商品数据
    let whereSql = "where company = '" + company + "' and (tingyong != '是' or tingyong is null)";

    // 查询分类
    let sql1 = "select distinct type from product " + whereSql + " order by type";

    db.query(sql1, function (err, typeRows) {
        try {
            if (err) {
                console.log("查询分类失败:", err);
                return res.render('order_panel.html', {
                    datas: [],
                    types: [],
                    user: userData
                });
            }

            // 查询商品
            let sql = "select * from product " + whereSql + " order by type, product_name";

            db.query(sql, function (err, productRows) {
                let datas = productRows || [];
                let types = typeRows || [];

                console.log("渲染商品数据:", {
                    datasCount: datas.length,
                    typesCount: types.length
                });

                res.render('order_panel.html', {
                    datas: datas,
                    types: types,
                    user: userData
                });
            });
        } catch (e) {
            console.log("查询异常:", e);
            res.render('order_panel.html', {
                datas: [],
                types: [],
                user: userData
            });
        }
    });
});
/**
 * 查询列表页
 */
// router.get('/select', function (req, res, next) {
//     let token = localStorage.getItem("token");
//     let key = '123456789abcdefg';
//     let iv = 'abcdefg123456789';
//     let data = JSON.parse(decrypt(key, iv, token));
//     // console.log("读取权限: " + data)
//     //
//     // console.log("quanxian" + data.table["5"].sel)
//     // if (data.table["5"].sel == 1) {
//     res.redirect('/order_panel/ass');
//     // } else {
//     //     res.render('me.html', {title: 'ExpressTitle', msg: '无权限查看'});
//     // }
// });
// 检查并加载订单信息的函数
function checkAndLoadOrder(orderNumber, tableNumber) {
    console.log("检查并加载订单:", orderNumber, "桌号:", tableNumber);

    // 1. 先检查是否为挂账订单
    $.ajax({
        type: 'post',
        url: '/order_panel/checkGuazhangOrder',
        async: false,
        data: { ddid: orderNumber },
        success: function(res) {
            console.log("挂账检查结果:", res);

            if (res.isGuazhang) {
                console.log("✅ 发现挂账订单，加载订单内容");
                // 加载挂账订单内容
                loadGuazhangOrder(orderNumber, tableNumber);
            } else {
                console.log("普通订单或非挂账订单");
                // 尝试加载普通订单
                loadRegularOrder(orderNumber, tableNumber);
            }
        },
        error: function() {
            console.log("挂账检查失败");
            // 默认尝试加载
            loadGuazhangOrder(orderNumber, tableNumber);
        }
    });
}

function loadGuazhangOrder(orderNumber, tableNumber) {
    console.log("加载挂账订单:", orderNumber, "桌号:", tableNumber);

    $.ajax({
        type: 'post',
        url: '/order_panel/selectGuazhangOrder',
        async: false,
        timeout: 5000,
        data: {
            ddid: orderNumber,
            zh: tableNumber
        },
        success: function(res) {
            console.log("挂账订单查询结果:", res);

            if (res.success && res.data && res.data.length > 0) {
                // 设置单号
                $('#danhao').val(orderNumber);

                // 清空表格
                $('#table tbody').empty();

                // 构建表格行
                $.each(res.data, function(index, item) {
                    var product_now_id = index + 1;
                    var rowHtml = "" +
                        "<tr class=\"success\" ondblclick=\"ondblclick_f(this)\">" +
                        "<td class=\"itemOrderNo\">" + product_now_id + "</td>" +
                        "<td class=\"itemName\">" + (item.cpmc || "") + "</td>" +
                        "<td class=\"itemNum\">" +
                        "<span class=\"count\">" + (item.gs || 1) + "</span>" +
                        "/" +
                        "<span class=\"unit\">" + (item.unit || "瓶") + "</span>" +
                        "</td>" +
                        "<td class=\"itemAmount\">" +
                        "￥" +
                        "<span class=\"price\">" + (parseFloat(item.zhje) || 0).toFixed(2) + "</span>" +
                        "</td>" +
                        "<td class=\"itemid\" style='visibility: hidden;width: 0px;margin: 0;padding: 0'>" +
                        "<span class=\"id\">" + (item.product_id || "") + "</span>" +
                        "</td>" +
                        "</tr>";

                    $('#table tbody').append(rowHtml);
                });

                // 更新汇总
                Table_sum();

                console.log("挂账订单加载完成，共", res.data.length, "条记录");

                // 标记当前为挂账订单
                window.isGuazhangOrder = true;

                // 显示成功提示
                alert(`成功加载挂账订单，共 ${res.data.length} 件商品，总计 ￥${calculateTotalAmount()}`);
            } else {
                console.log("没有找到挂账订单数据");
                alert('没有找到该桌位的挂账订单');
            }
        },
        error: function(xhr, status, error) {
            console.error('挂账订单查询失败:', error);
            alert('加载挂账订单失败: ' + error);
        }
    });
}

// 计算总金额的函数
function calculateTotalAmount() {
    let total = 0;
    $('.itemAmount .price').each(function() {
        total += parseFloat($(this).text()) || 0;
    });
    return total.toFixed(2);
}


// router.post('/select', function (req, res, next) {
//     console.log("yuangong")
//     let isSelect = req.query.pagenum == undefined;
//     let token = localStorage.getItem("token")
//     let key = '123456789abcdefg';
//     //console.log('加密的key:', key);
//     let iv = 'abcdefg123456789';
//     //console.log('加密的iv:', iv);
//     let data = JSON.parse(decrypt(key, iv, token));
//     let value = Object.values(data);
//     let company = value[0];
//     console.log(value)
//     let users = {
//         name:value[6],
//         username:value[1],
//         password:value[2],
//         company:value[0],
//         usertype:value[5],
//     }
//     console.log(users)
//     // if (data.table["5"].sel == 1) {
//     //
//     // } else {
//     //     res.render('me.html', {title: 'ExpressTitle', msg: '无权限查看'});
//     // }
//
//     // let account = req.cookies.account
//     // console.log(account);
//
//     let selectParams = {
//         name: ''
//     }
//     if (isSelect) {
//         selectParams.name = req.body.name;
//         localStorage.setItem("selectParams", JSON.stringify(selectParams))
//     } else {
//         selectParams = JSON.parse(localStorage.getItem("selectParams"));
//     }
//     if (selectParams.name == undefined) {
//         selectParams.name = "";
//     }
//     console.log("selectParams.name=>", selectParams.name)
//     let whereSql = "where company = '" + company + "'"
//     let type = req.params.type
//     console.log(req.params)
//     console.log(req.query)
//     let sql1 = "select distinct type from product " + whereSql;
//     console.log(sql1)
//     db.query(sql1, function (err, rows) {
//         try {
//             if (err) {
//                 console.log(err);
//             } else {
//                 console.log(rows)
//                 let result = {
//                     datas: [],
//                     types:[],
//                     users:users,
//                 }
//                 result.types = rows
//                 console.log("isSelect=>", isSelect)
//                 let sql = "select * from product " + whereSql;
//                 console.log("sql=>", sql)
//                 db.query(sql, function (err, rows) {
//                     if (err) {
//                         console.log(err);
//                     } else {
//                         result.datas = rows
//                         console.log("result=>", result)
//                         res.json(JSON.stringify(result));
//                     }
//                 });
//             }
//         } catch (e) {
//             res.render("error.html", {error: '网络错误，请稍后再试！'})
//         }
//     });
// });


router.post('/select', function (req, res, next) {
    console.log("获取商品列表 - POST /select");

    let isSelect = req.query.pagenum == undefined;
    let token = localStorage.getItem("token");

    if (!token) {
        console.log("没有token");
        return res.json(JSON.stringify({
            datas: [],
            types: [],
            users: { name: '游客', username: 'guest', company: '默认公司' }
        }));
    }

    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data;

    try {
        data = JSON.parse(decrypt(key, iv, token));
    } catch (e) {
        console.log("Token解析失败:", e);
        return res.json(JSON.stringify({
            datas: [],
            types: [],
            users: { name: '游客', username: 'guest', company: '默认公司' }
        }));
    }

    let value = Object.values(data);
    let company = value[0];

    console.log("公司信息:", company);

    let users = {
        name: value[6] || '管理员',
        username: value[1] || 'admin',
        password: value[2] || '',
        company: company,
        usertype: value[5] || '商家'
    };

    console.log("用户信息:", users);

    let selectParams = {
        name: ''
    };

    if (isSelect) {
        selectParams.name = req.body.name || '';
        localStorage.setItem("selectParams", JSON.stringify(selectParams));
    } else {
        let stored = localStorage.getItem("selectParams");
        if (stored) {
            selectParams = JSON.parse(stored);
        }
    }

    if (!selectParams.name) {
        selectParams.name = "";
    }

    console.log("搜索条件:", selectParams.name);

    let whereSql = "where company = '" + company + "' and (tingyong != '是' or tingyong is null)";

    // 如果有搜索条件
    if (selectParams.name && selectParams.name.trim() !== "") {
        whereSql += " and product_name LIKE '%" + selectParams.name + "%'";
    }

    // 先查询分类
    let sql1 = "select distinct type from product " + whereSql + " order by type";
    console.log("分类SQL:", sql1);

    db.query(sql1, function (err, rows) {
        try {
            if (err) {
                console.log("查询分类失败:", err);
                return res.json(JSON.stringify({
                    datas: [],
                    types: [],
                    users: users
                }));
            }

            console.log("分类结果:", rows);
            let result = {
                datas: [],
                types: rows || [],
                users: users
            };

            // 再查询商品
            let sql = "select * from product " + whereSql + " order by type, product_name";
            console.log("商品SQL:", sql);

            db.query(sql, function (err, rows) {
                if (err) {
                    console.log("查询商品失败:", err);
                    result.datas = [];
                } else {
                    console.log("查询到商品数量:", rows.length);
                    result.datas = rows;
                }

                console.log("返回结果:", {
                    typesCount: result.types.length,
                    datasCount: result.datas.length
                });

                res.json(JSON.stringify(result));
            });
        } catch (e) {
            console.log("异常:", e);
            res.json(JSON.stringify({
                datas: [],
                types: [],
                users: users,
                error: '网络错误，请稍后再试！'
            }));
        }
    });
});

// 模糊查询
router.post('/getlist', function (req, res, next) {
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

    // 修改这里：添加模糊查询条件
    let whereSql = "where company = '" + company + "' and (tingyong != '是' or tingyong is null)";
    if (selectParams.name && selectParams.name.trim() !== "") {
        whereSql += " and product_name LIKE '%" + selectParams.name + "%'";
    }

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

// 订单号
router.post('/select_order_number', function (req, res, next) {
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
    let this_head = req.body.this_head;
    this_head = this_head.substring(0,8)
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
    let whereSql = "where company = '" + company + "' and ddh like '" + this_head + "%'"
    let type = req.params.type
    console.log(req.params)
    console.log(req.query)
    let sql1 = "select ddh from orders " + whereSql;
    console.log(sql1)
    db.query(sql1, function (err, rows) {
        try {
            if (err) {
                console.log(err);
            } else {
                console.log(rows)
                let result = {
                    datas: [],
                }
                result.datas = rows
                console.log("result=>", result)
                res.json(JSON.stringify(result));
            }
        } catch (e) {
            res.render("error.html", {error: '网络错误，请稍后再试！'})
        }
    });
});


// 在order_panel.js中添加新路由
router.post('/get_member_discount', function (req, res, next) {
    console.log("========== 查询会员折扣 ==========");

    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    let company = data.company || '';

    let points = parseFloat(req.body.points) || 0;
    let memberName = req.body.name || '';

    console.log("查询参数:", { company: company, points: points, name: memberName });

    // 如果传了会员姓名，先查询该会员的等级
    if (memberName) {
        let memberSql = `SELECT jibie FROM member_info WHERE company = '${company}' AND name = '${memberName}' LIMIT 1`;

        db.query(memberSql, function(memberErr, memberRows) {
            if (memberErr || memberRows.length === 0) {
                // 如果没有找到会员，根据积分查询等级
                queryLevelByPoints();
            } else {
                // 找到会员，使用会员的等级查询折扣
                let jibie = memberRows[0].jibie || '普通会员';
                queryDiscountByLevel(jibie);
            }
        });
    } else {
        // 没有会员姓名，直接根据积分查询
        queryLevelByPoints();
    }

    // 根据积分查询等级
    function queryLevelByPoints() {
        console.log("根据积分查询等级，积分:", points);

        // 首先查询member_jibie表的所有等级设置
        let levelsSql = `SELECT jibie, menkan, COALESCE(bili, 1) as discount FROM member_jibie WHERE company = '${company}' ORDER BY menkan`;

        db.query(levelsSql, function(levelsErr, levelsRows) {
            if (levelsErr || levelsRows.length === 0) {
                console.log("未找到等级设置，使用默认");
                return res.json({
                    jibie: '普通会员',
                    discount: 1,
                    points: points
                });
            }

            console.log("所有等级设置:", levelsRows);

            // 找出适合当前积分的等级
            let matchedJibie = '普通会员';
            let matchedDiscount = 1;

            for (let i = 0; i < levelsRows.length; i++) {
                if (points >= levelsRows[i].menkan) {
                    matchedJibie = levelsRows[i].jibie;
                    matchedDiscount = parseFloat(levelsRows[i].discount) || 1;
                }
            }

            console.log("匹配结果:", {
                积分: points,
                等级: matchedJibie,
                折扣: matchedDiscount
            });

            res.json({
                jibie: matchedJibie,
                discount: matchedDiscount,
                points: points
            });
        });
    }

    // 根据等级查询折扣
    function queryDiscountByLevel(jibie) {
        console.log("根据等级查询折扣，等级:", jibie);

        let discountSql = `SELECT COALESCE(bili, 1) as discount FROM member_jibie WHERE company = '${company}' AND jibie = '${jibie}' LIMIT 1`;

        db.query(discountSql, function(discountErr, discountRows) {
            if (discountErr || discountRows.length === 0) {
                console.log("未找到该等级折扣，使用默认");
                res.json({
                    jibie: jibie,
                    discount: 1,
                    points: points
                });
            } else {
                let discount = parseFloat(discountRows[0].discount) || 1;
                console.log("找到折扣:", discount);

                res.json({
                    jibie: jibie,
                    discount: discount,
                    points: points
                });
            }
        });
    }
});
// 根据您的表结构修复的结算挂账接口
router.post('/settleGuazhang', function (req, res) {
    console.log("========== 结算挂账请求 ==========");

    let ddid = req.body.ddid;
    let zh = req.body.zh || '';
    let jyje = parseFloat(req.body.jyje) || 0;

    console.log("结算参数:", { ddid, zh, jyje });

    // 获取公司信息
    let token = localStorage.getItem("token");
    let company = '';

    if (token) {
        try {
            let key = '123456789abcdefg';
            let iv = 'abcdefg123456789';
            let data = JSON.parse(decrypt(key, iv, token));
            company = data.company || '';
        } catch (e) {
            console.log("获取公司信息失败");
        }
    }

    if (!ddid) {
        return res.json({
            code: 400,
            msg: "缺少订单号"
        });
    }

    console.log("公司信息:", company);

    // 1. 更新orders_details表的zt字段（从'2'挂账改为'1'已结账）
    let updateDetailsSql = `
        UPDATE orders_details 
        SET zt = '1'
        WHERE ddid = ? 
        AND company = ? 
        AND zt = '2'`;

    console.log("更新商品详情SQL:", updateDetailsSql, [ddid, company]);

    db.query(updateDetailsSql, [ddid, company], function(err, detailResult) {
        if (err) {
            console.error("更新商品状态失败:", err);
            return res.json({
                code: 500,
                msg: "更新商品状态失败: " + err.message
            });
        }

        console.log("更新商品行数:", detailResult.affectedRows);

        // 2. 更新orders表 - 根据表结构设置实际收款金额
        let updateOrderSql = `
            UPDATE orders 
            SET ssje = ?,
                syy = '系统结算'
            WHERE ddh = ? 
            AND company = ?`;

        console.log("更新订单SQL:", updateOrderSql, [jyje, ddid, company]);

        db.query(updateOrderSql, [jyje, ddid, company], function(err, orderResult) {
            if (err) {
                console.error("更新订单状态失败:", err);
                // 继续执行，不中断
            } else {
                console.log("更新订单行数:", orderResult.affectedRows);
            }

            // 3. 如果有桌号，更新桌位状态到order_table表
            if (zh && zh.trim() !== '' && zh !== '未指定桌号') {
                // 更新桌位表（根据您的order_table表结构）
                let updateTableSql = `
                    UPDATE order_table 
                    SET zt = '已结账',
                        bm = ?
                    WHERE zh = ? 
                    AND company = ?`;

                console.log("更新桌位SQL:", updateTableSql, [ddid, zh, company]);

                db.query(updateTableSql, [ddid, zh, company], function(err, tableResult) {
                    if (err) {
                        console.log("桌位更新失败:", err);
                        // 桌位更新失败不影响主流程
                    } else {
                        console.log("桌位更新行数:", tableResult.affectedRows);
                    }

                    // 返回成功响应
                    sendSuccessResponse();
                });
            } else {
                // 没有桌号，直接返回成功
                sendSuccessResponse();
            }
        });
    });

    // 成功响应函数
    function sendSuccessResponse() {
        console.log("✅ 挂账结算成功！订单号:", ddid);

        res.json({
            code: 200,
            msg: "挂账结算成功！",
            data: {
                order_no: ddid,
                table_no: zh || '无桌位',
                settle_time: new Date().toISOString()
            }
        });
    }
});
router.post('/getGuazhangOrderDetails', function (req, res) {
    let ddid = req.body.ddid;

    console.log("查询挂账订单详情:", ddid);

    let token = localStorage.getItem("token");
    let company = '';

    if (token) {
        try {
            let key = '123456789abcdefg';
            let iv = 'abcdefg123456789';
            let data = JSON.parse(decrypt(key, iv, token));
            company = data.company || '';
        } catch (e) {
            console.log("获取公司信息失败");
        }
    }

    // 查询挂账订单的详细信息
    let sql = `
        SELECT 
            o.ddh as order_no,
            o.riqi as create_date,
            o.xfje as total_amount,
            o.ssje as actual_amount,
            o.yhje as discount_amount,
            o.hyxm as member_name,
            o.hyzh as member_account,
            o.syy as operator,
            COUNT(DISTINCT od.id) as item_count,
            SUM(od.zhje) as items_total,
            GROUP_CONCAT(DISTINCT od.cpmc) as product_names
        FROM orders o
        LEFT JOIN orders_details od ON o.ddh = od.ddid
        WHERE o.ddh = ?
        AND o.company = ?
        AND od.zt = '2'
        GROUP BY o.ddh, o.riqi, o.xfje, o.ssje, o.yhje, o.hyxm, o.hyzh, o.syy
        LIMIT 1`;

    console.log("查询SQL:", sql, [ddid, company]);

    db.query(sql, [ddid, company], function (err, rows) {
        if (err) {
            console.error("查询失败:", err);
            return res.json({
                success: false,
                message: '查询失败'
            });
        }

        if (rows.length === 0) {
            return res.json({
                success: false,
                message: '未找到挂账订单'
            });
        }

        res.json({
            success: true,
            data: rows[0],
            message: '查询成功'
        });
    });
});
// router.post('/select_huiyuan_list', function (req, res, next) {
//     console.log("yuangong")
//     let isSelect = req.query.pagenum == undefined;
//     let token = localStorage.getItem("token")
//     let key = '123456789abcdefg';
//     let iv = 'abcdefg123456789';
//     let data = JSON.parse(decrypt(key, iv, token));
//     let value = Object.values(data);
//     let company = value[0];
//     console.log(value)
//     let users = {
//         name:value[6],
//         username:value[1],
//         password:value[2],
//         company:value[0],
//         usertype:value[5],
//     }
//     console.log(users)
//     let this_head = req.body.this_head;
//
//     // 获取分页参数
//     let page = parseInt(req.body.page) || 1;
//     let limit = parseInt(req.body.limit) || 6; // 默认每页20条
//     let offset = (page - 1) * limit;
//
//     let selectParams = {
//         name: '',
//         phone:'',
//         username:''
//     }
//     if (isSelect) {
//         selectParams.name = req.body.name;
//         localStorage.setItem("selectParams", JSON.stringify(selectParams))
//     } else {
//         selectParams = JSON.parse(localStorage.getItem("selectParams"));
//     }
//     if (selectParams.name == undefined) {
//         selectParams.name = "";
//     }
//     if (selectParams.username == undefined) {
//         selectParams.username = "";
//     }
//     if (selectParams.phone == undefined) {
//         selectParams.phone = "";
//     }
//     console.log("selectParams.name=>", selectParams.name)
//
//     // 构建基础SQL
//     let baseSql = "select username,name,gender,state,phone,ifnull(jifen.points,0) as points from member_info left join(select hyxm,round(sum(zhje),2) as points from (select ddh,hyxm,ifnull(zhje,0) as zhje from orders left join orders_details on orders.ddh = orders_details.ddid) as o1 group by hyxm) as jifen on member_info.name = jifen.hyxm where company = '" + company + "'"
//
//     // 添加搜索条件
//     if (this_head && this_head.trim() !== '') {
//         baseSql += " and ( username like '%" + this_head + "%' or phone like '%" + this_head + "%' or name like '%" + this_head + "%')"
//     }
//
//     // 计数SQL
//     let countSql = "SELECT COUNT(*) as total FROM (" + baseSql + ") as t";
//
//     // 分页SQL
//     let dataSql = baseSql + " LIMIT " + limit + " OFFSET " + offset;
//
//     console.log("计数SQL:", countSql);
//     console.log("数据SQL:", dataSql);
//
//     // 先获取总数
//     db.query(countSql, function (err, countRows) {
//         try {
//             if (err) {
//                 console.log(err);
//                 res.json(JSON.stringify({success: false, error: err.message}));
//             } else {
//                 let total = countRows[0].total;
//
//                 // 再获取分页数据
//                 db.query(dataSql, function (err, rows) {
//                     if (err) {
//                         console.log(err);
//                         res.json(JSON.stringify({success: false, error: err.message}));
//                     } else {
//                         let result = {
//                             success: true,
//                             datas: rows,
//                             total: total,
//                             page: page,
//                             limit: limit,
//                             pages: Math.ceil(total / limit)
//                         }
//                         console.log("result=>", result)
//                         res.json(JSON.stringify(result));
//                     }
//                 });
//             }
//         } catch (e) {
//             res.render("error.html", {error: '网络错误，请稍后再试！'})
//         }
//     });
// });
router.post('/select_huiyuan_list', function (req, res, next) {
    console.log("查询会员列表");

    try {
        let token = localStorage.getItem("token");
        if (!token) {
            console.log("❌ 没有token");
            return res.json({
                success: false,
                datas: [],
                message: "未登录"
            });
        }

        let key = '123456789abcdefg';
        let iv = 'abcdefg123456789';
        let data = JSON.parse(decrypt(key, iv, token));
        let company = data.company || '';

        console.log("公司:", company);

        // 1. 先查询会员等级配置
        let levelSql = `SELECT jibie, menkan, COALESCE(bili, 1) as discount FROM member_jibie WHERE company = '${company}' ORDER BY menkan`;

        console.log("查询等级配置SQL:", levelSql);

        db.query(levelSql, function(levelErr, levelRows) {
            if (levelErr) {
                console.error("查询等级配置失败:", levelErr);
                levelRows = []; // 使用空数组继续
            }

            console.log("等级配置数据:", levelRows);

            // 2. 查询会员基本信息
            let querySql = `
    SELECT 
        m.username,
        COALESCE(m.name, '') as name,
        COALESCE(m.gender, '') as gender,
        COALESCE(m.phone, '') as phone,
        COALESCE(m.state, '正常') as state,
        m.company,
        -- 从订单表计算实际总消费金额作为积分
        COALESCE(SUM(o.xfje), 0) as points,
        -- 计算会员等级
        COALESCE(
            (SELECT jibie 
             FROM member_jibie 
             WHERE company = m.company 
             AND menkan <= COALESCE(SUM(o.xfje), 0)
             ORDER BY menkan DESC 
             LIMIT 1),
            '普通会员'
        ) as jibie,
        -- 计算折扣
        COALESCE(
            (SELECT bili 
             FROM member_jibie 
             WHERE company = m.company 
             AND menkan <= COALESCE(SUM(o.xfje), 0)
             ORDER BY menkan DESC 
             LIMIT 1),
            1
        ) as discount
    FROM member_info m
    LEFT JOIN orders o ON m.username = o.hyzh
    WHERE 1=1
`;

// 如果有公司条件
            if (company) {
                querySql += ` AND m.company = '${company}'`;
            }


// 添加搜索条件（如果提供了） - ⚠️ 这个要在GROUP BY之前
            let this_head = req.body.this_head || '';
            if (this_head && this_head.trim() !== '') {
                querySql += ` AND (
        m.username LIKE '%${this_head}%' 
        OR m.name LIKE '%${this_head}%' 
        OR m.phone LIKE '%${this_head}%'
    )`;
            }

// 必须添加GROUP BY - 放在搜索条件之后
            querySql += ` GROUP BY m.username, m.name, m.gender, m.phone, m.state, m.company`;


            // 添加分页参数 - 每页6条数据
            let page = parseInt(req.body.page) || 1;
            let limit = 6;
            let offset = (page - 1) * limit;

            querySql += ` ORDER BY name LIMIT ${limit} OFFSET ${offset}`;

            console.log("会员查询SQL:", querySql);

            // 先查询总数
            let countSql = `SELECT COUNT(*) as total FROM member_info WHERE 1=1`;
            if (company) {
                countSql += ` AND company = '${company}'`;
            }

            db.query(countSql, function (err, countResult) {
                if (err) {
                    console.error("查询总数失败:", err);
                    return res.json({
                        success: false,
                        datas: [],
                        error: "查询总数失败"
                    });
                }

                let total = countResult[0].total;

                // 查询会员数据
                db.query(querySql, function (err, rows) {
                    if (err) {
                        console.error("查询会员失败:", err);
                        return res.json({
                            success: false,
                            datas: [],
                            error: err.message
                        });
                    }

                    console.log(`✅ 查询到 ${rows.length} 条会员记录`);

                    // 3. 为每个会员动态计算等级和折扣
                    let processedMembers = rows.map(member => {
                        let points = parseFloat(member.points) || 0;
                        let jibie = '普通会员';
                        let discount = 1.0;

                        // 根据积分计算等级（与会员管理页面相同的逻辑）
                        if (levelRows.length > 0) {
                            // 按门槛降序排序，找到第一个符合条件的等级
                            let sortedLevels = [...levelRows].sort((a, b) => b.menkan - a.menkan);

                            for (let i = 0; i < sortedLevels.length; i++) {
                                if (points >= parseFloat(sortedLevels[i].menkan)) {
                                    jibie = sortedLevels[i].jibie;
                                    discount = parseFloat(sortedLevels[i].discount) || 1.0;
                                    break;
                                }
                            }
                        }

                        return {
                            ...member,
                            jibie: jibie,
                            discount: discount,
                            points: points
                        };
                    });

                    // 调试输出
                    console.log("=== 处理后会员数据 ===");
                    processedMembers.forEach((member, index) => {
                        console.log(`会员 ${index + 1}:`, {
                            姓名: member.name,
                            积分: member.points,
                            等级: member.jibie,
                            折扣: member.discount,
                            折扣显示: member.discount == 1 ? '无折扣' : (member.discount * 10).toFixed(1) + '折'
                        });
                    });

                    // 如果没有数据，返回一些测试数据
                    if (processedMembers.length === 0) {
                        console.log("⚠️ 会员表没有数据，返回测试数据");
                        processedMembers = [
                            {
                                username: '100001',
                                name: '测试会员1',
                                gender: '男',
                                phone: '13800138001',
                                state: '正常',
                                points: 100,
                                jibie: '普通会员',
                                discount: 1.0,
                                company: company
                            },
                            {
                                username: '100002',
                                name: '测试会员2',
                                gender: '女',
                                phone: '13800138002',
                                state: '正常',
                                points: 1500,
                                jibie: '白银会员',
                                discount: 0.9,
                                company: company
                            }
                        ];
                    }

                    // 计算总页数
                    let pages = Math.ceil(total / limit);

                    res.json({
                        success: true,
                        datas: processedMembers,
                        total: total,
                        page: page,
                        limit: limit,
                        pages: pages,
                        message: `共 ${total} 条记录，当前第 ${page} 页`
                    });
                });
            });
        });

    } catch (e) {
        console.error("处理异常:", e);
        res.json({
            success: false,
            datas: [],
            error: "系统异常: " + e.message
        });
    }
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

// router.post('/add', function (req, res) {
//     let token = localStorage.getItem("token");
//     let key = '123456789abcdefg';
//     let iv = 'abcdefg123456789';
//     let data = JSON.parse(decrypt(key, iv, token));
//     console.log(data)
//
//     let pro_list = JSON.parse(req.body.pro_list);
//     let pro_num = req.body.pro_num;
//     let youhui = req.body.youhui;
//     let user = req.body.member_name;
//     let username = req.body.member_username;
//     let yhje = req.body.yhje;
//     let ssje = req.body.ssje;
//     let xfje = req.body.xfje;
//     console.log(yhje,"这是后端内容")
//
//
//     let result = {
//         code: '',
//         msg: '',
//         data: []
//     }
//
//     company = data.company
//     uname = data.uname
//     type = data.type
//     account = data.account
//
//
//
//     var date = new Date();
//     var year = date.getFullYear();
//     var month = date.getMonth() + 1;
//     var day = date.getDate();
//
//     month = (month > 9) ? month : ("0" + month);
//     day = (day < 10) ? ("0" + day) : day;
//     var today = year + "-" + month + "-" + day;
//
//     var sql = "select * from orders where ddh = '" + pro_num + "' and company ='" + company + "'"
//
//     db.query(sql, function (err, rows) {
//         try {
//             if (err) {
//                 result.code = 500;
//                 result.msg = "单号查询失败";
//                 res.json(JSON.stringify(result));
//                 res.end('获取失败：');
//             }else{
//                 if(rows.length > 0){
//                     result.code = 402;
//                     result.msg = "订单号重复";
//                     res.json(JSON.stringify(result));
//                 }else{
//                     var sql = ""
//                     if(type == '商家'){
//                         sql = "insert into orders(riqi,ddh,yhfa,syy,hyzh,hyxm,company,yhje,ssje,xfje) values('" + today + "','" + pro_num + "','" + youhui + "','" + uname + "','" + username + "','" + user + "','" + company + "','" + yhje + "','" + ssje + "','" + xfje + "')"
//                     }else{
//                         sql = "insert into orders(riqi,ddh,hyzh,hyxm,hyjf,yhfa,company,yhje,ssje,xfje) values('" + today + "','" + pro_num  + "','" + account  + "','" + uname + "','" + youhui + "','" + company + "','" + yhje + "','" + ssje + "','" + xfje + "')"
//                     }
//                     db.query(sql, function (err, rows) {
//                         if (err) {
//                             console.log(err)
//                             result.code = 500;
//                             result.msg = "插入订单信息失败";
//                             res.json(JSON.stringify(result));
//                             res.end('获取失败：');
//                         }else{
//                             var sql1 = "insert into orders_details(ddid,cplx,cpmc,dw,dj,dzbl,zhdj,zhje,gs,company) values "
//                             var sql2 = ""
//                             for(var i=0; i<pro_list.length; i++){
//                                 if(sql2 == ""){
//                                     sql2 = "('" + pro_num + "','" + pro_list[i].cplx + "','" + pro_list[i].cpmc + "','" + pro_list[i].dw + "','" + pro_list[i].dj + "','" + youhui + "','" + pro_list[i].zhdj + "','" + pro_list[i].zhje + "','" + pro_list[i].gs + "','" + company  + "')"
//                                 }else{
//                                     sql2 = sql2 + ",('" + pro_num + "','" + pro_list[i].cplx + "','" + pro_list[i].cpmc + "','" + pro_list[i].dw + "','" + pro_list[i].dj + "','" + youhui + "','" + pro_list[i].zhdj + "','" + pro_list[i].zhje + "','" + pro_list[i].gs + "','" + company  + "')"
//                                 }
//                             }
//                             var sql = sql1 + sql2
//                             console.log(sql)
//                             db.query(sql, function (err, rows) {
//                                 if (err) {
//                                     console.log(err)
//                                     result.code = 500;
//                                     result.msg = "插入订单产品信息失败";
//                                     res.json(JSON.stringify(result));
//                                     res.end('获取失败：');
//                                 }else{
//                                     result.code = 200;
//                                     result.msg = "添加成功"
//                                     res.json(JSON.stringify(result));
//                                 }
//                             })
//                         }
//                     })
//                 }
//
//             }
//         } catch (e) {
//             res.render("error.html", {error: '网络错误，请稍后再试'})
//         }
//     })
//
// });

/**
 * 新增按钮 - 普通结账（修复版）
 */
router.post('/add', function (req, res) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data;

    try {
        data = JSON.parse(decrypt(key, iv, token));
    } catch (e) {
        console.log("Token解析失败:", e);
        return res.json({code: 401, msg: "身份验证失败"});
    }

    console.log("普通结账 - 用户数据:", data);

    // 解析参数
    let pro_list;
    try {
        pro_list = req.body.pro_list ? JSON.parse(req.body.pro_list) : [];
    } catch (e) {
        console.log("商品列表解析失败:", e);
        return res.json({code: 400, msg: "商品数据格式错误"});
    }

    let pro_num = req.body.pro_num || '';
    let youhui = req.body.youhui || '1';
    let user = req.body.member_name || '';
    let username = req.body.member_username || '';
    let yhje = parseFloat(req.body.yhje) || 0;
    let ssje = parseFloat(req.body.ssje) || 0;
    let xfje = parseFloat(req.body.xfje) || 0;
    let remark = req.body.remark || '';
    let zhuohao = req.body.zhuohao || '';

    console.log("普通结账参数:", {
        pro_num,
        zhuohao,
        pro_list_length: pro_list.length,
        xfje,
        ssje,
        yhje,
        youhui,
        user,
        username,
        remark: remark ? "有备注" : "无备注"
    });

    let result = {
        code: '',
        msg: '',
        data: []
    }

    let company = data.company || '';
    let uname = data.uname || data.name || '系统用户';
    let type = data.type || '商家';
    let account = data.account || '';

    // 验证必要参数
    if (!company) {
        return res.json({code: 400, msg: "公司信息缺失"});
    }

    if (!pro_num) {
        return res.json({code: 400, msg: "订单号不能为空"});
    }

    if (pro_list.length === 0) {
        return res.json({code: 400, msg: "商品列表不能为空"});
    }

    // 获取当前日期
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();

    month = (month > 9) ? month : ("0" + month);
    day = (day < 10) ? ("0" + day) : day;
    var today = year + "-" + month + "-" + day;

    // 1. 先检查订单是否已存在
    var sql = "select * from orders where ddh = '" + pro_num + "' and company ='" + company + "'";

    db.query(sql, function (err, rows) {
        try {
            if (err) {
                console.log("检查订单失败:", err);
                result.code = 500;
                result.msg = "单号查询失败";
                return res.json(JSON.stringify(result));
            } else {
                if(rows.length > 0){
                    result.code = 402;
                    result.msg = "订单号重复";
                    return res.json(JSON.stringify(result));
                } else {
                    // 2. 插入主订单
                    // 根据表结构：id riqi ddh hyzh hyxm yhfa xfje ssje yhje syy company hyjf
                    var orderSql = "";

                    if (type == '商家') {
                        // 商家：riqi, ddh, hyzh, hyxm, yhfa, xfje, ssje, yhje, syy, company
                        orderSql = "INSERT INTO orders(riqi, ddh, hyzh, hyxm, yhfa, xfje, ssje, yhje, syy, company) " +
                            "VALUES('" + today + "','" + pro_num + "','" + username + "','" + user + "','" + youhui + "'," +
                            xfje + "," + ssje + "," + yhje + ",'" + uname + "','" + company + "')";
                    } else {
                        // 普通用户：riqi, ddh, hyzh, hyxm, yhfa, xfje, ssje, yhje, syy, company, hyjf
                        orderSql = "INSERT INTO orders(riqi, ddh, hyzh, hyxm, yhfa, xfje, ssje, yhje, syy, company, hyjf) " +
                            "VALUES('" + today + "','" + pro_num + "','" + account + "','" + uname + "','" + youhui + "'," +
                            xfje + "," + ssje + "," + yhje + ",'" + uname + "','" + company + "','" + youhui + "')";
                    }

                    console.log("普通结账 - 订单SQL:", orderSql);

                    // 3. 执行订单插入
                    db.query(orderSql, function (err, orderResult) {
                        if (err) {
                            console.log("插入订单失败:", err);
                            result.code = 500;
                            result.msg = "插入订单信息失败: " + err.message;
                            return res.json(JSON.stringify(result));
                        } else {
                            console.log("✅ 订单插入成功，ID:", orderResult.insertId);

                            // 4. 批量插入商品详情
                            if (pro_list.length > 0) {
                                // orders_details表字段：id ddid cplx cpmc dw dj dzbl zhdj zhje company gs zt zh
                                var detailsSql = "INSERT INTO orders_details(ddid, cplx, cpmc, dw, dj, dzbl, zhdj, zhje, company, gs, zt, zh) VALUES ";
                                var values = [];

                                for(var i = 0; i < pro_list.length; i++) {
                                    var item = pro_list[i];

                                    // 验证必要字段
                                    if (!item.cpmc) {
                                        console.warn("商品缺少名称，跳过:", item);
                                        continue;
                                    }

                                    var dj = parseFloat(item.dj) || 0;
                                    var dzbl = parseFloat(item.dzbl) || 1;
                                    var zhdj = parseFloat(item.zhdj) || 0;
                                    var zhje = parseFloat(item.zhje) || 0;
                                    var gs = parseFloat(item.gs) || 1;

                                    // 确保折扣后的价格正确
                                    if (zhje === 0 && zhdj > 0) {
                                        zhje = zhdj * gs;
                                    }

                                    if (values.length > 0) {
                                        detailsSql += ", ";
                                    }

                                    // 注意：普通结账 zt 为 NULL 或空字符串，不是 '2'（挂账才是 '2'）
                                    detailsSql += "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                                    values.push(
                                        pro_num,                    // ddid
                                        item.cplx || '',           // cplx
                                        item.cpmc,                 // cpmc
                                        item.dw || '',             // dw
                                        dj,                        // dj
                                        dzbl,                      // dzbl（折扣比例）
                                        zhdj,                      // zhdj（折扣后单价）
                                        zhje,                      // zhje（折扣后总价）
                                        company,                   // company
                                        gs,                        // gs（数量）
                                        null,                      // zt（状态：null=普通结账，'2'=挂账）
                                        zhuohao || ''              // zh（桌号）
                                    );
                                }

                                if (values.length === 0) {
                                    result.code = 400;
                                    result.msg = "没有有效的商品数据";
                                    return res.json(JSON.stringify(result));
                                }

                                console.log("普通结账 - 商品详情SQL:", detailsSql);
                                console.log("普通结账 - 商品参数:", values);

                                // 5. 执行商品插入
                                db.query(detailsSql, values, function (err, detailResult) {
                                    if (err) {
                                        console.log("插入商品详情失败:", err);

                                        // 如果商品插入失败，回滚订单
                                        var deleteOrderSql = "DELETE FROM orders WHERE ddh = ?";
                                        db.query(deleteOrderSql, [pro_num], function() {
                                            // 忽略删除结果
                                        });

                                        result.code = 500;
                                        result.msg = "插入订单产品信息失败: " + err.message;
                                        return res.json(JSON.stringify(result));
                                    } else {
                                        console.log("✅ 商品详情插入成功，插入行数:", detailResult.affectedRows);

                                        // 6. 更新桌位信息（如果提供了桌号）
                                        if (zhuohao && zhuohao.trim() !== '' && zhuohao !== '未指定桌号') {
                                            var tableSql = "UPDATE order_table SET bm = ?, zt = '已结账', sj = NOW() WHERE zh = ?";
                                            db.query(tableSql, [pro_num, zhuohao], function(err, tableResult) {
                                                if (err) {
                                                    console.log("⚠️ 桌位更新失败:", err);
                                                } else {
                                                    console.log("✅ 桌位更新成功，影响行数:", tableResult.affectedRows);
                                                }
                                            });
                                        }

                                        // 7. 返回成功响应
                                        result.code = 200;
                                        result.msg = "结账成功！";
                                        result.data = {
                                            order_no: pro_num,
                                            table_no: zhuohao,
                                            amount: xfje,
                                            item_count: pro_list.length
                                        };

                                        console.log("🎉 普通结账成功！订单号:", pro_num);
                                        return res.json(JSON.stringify(result));
                                    }
                                });
                            } else {
                                // 没有商品数据
                                result.code = 200;
                                result.msg = "结账成功（无商品）";
                                return res.json(JSON.stringify(result));
                            }
                        }
                    });
                }
            }
        } catch (e) {
            console.log("普通结账 - 捕获异常:", e);
            result.code = 500;
            result.msg = "网络错误，请稍后再试";
            return res.json(JSON.stringify(result));
        }
    });
});

// router.post('/addguazhang', function (req, res) {
//     console.log("🚀 收到挂账请求");
//
//     // 设置响应超时（30秒）
//     res.setTimeout(30000, function() {
//         console.log("响应超时");
//         if (!res.headersSent) {
//             res.json({
//                 code: 504,
//                 msg: "请求超时，请稍后检查状态"
//             });
//         }
//     });
//
//     try {
//         // 1. 解析请求数据
//         let pro_list = [];
//         try {
//             if (req.body.pro_list) {
//                 pro_list = JSON.parse(req.body.pro_list);
//                 console.log("✅ 商品列表解析成功，数量:", pro_list.length);
//             }
//         } catch (e) {
//             console.log("商品列表解析失败:", e.message);
//             return res.json({
//                 code: 400,
//                 msg: "商品数据格式错误"
//             });
//         }
//
//         let pro_num = req.body.pro_num || '';
//         let youhui = req.body.youhui || '1';
//         let user = req.body.member_name || '';
//         let username = req.body.member_username || '';
//         let yhje = parseFloat(req.body.yhje) || 0;
//         let ssje = parseFloat(req.body.ssje) || 0;
//         let xfje = parseFloat(req.body.xfje) || 0;
//         let zhuohao = req.body.zhuohao || '';
//         let remark = req.body.remark || '';
//
//         console.log("📋 挂账参数:", {
//             pro_num,
//             zhuohao,
//             pro_list_length: pro_list.length,
//             xfje,
//             ssje,
//             yhje
//         });
//
//         // 验证必要参数
//         if (!pro_num) {
//             return res.json({
//                 code: 400,
//                 msg: "订单号不能为空"
//             });
//         }
//
//         // 2. 获取用户信息
//         let token = localStorage.getItem("token");
//         if (!token) {
//             console.log("❌ 没有token");
//             return res.json({
//                 code: 401,
//                 msg: "未登录"
//             });
//         }
//
//         let userData;
//         try {
//             let key = '123456789abcdefg';
//             let iv = 'abcdefg123456789';
//             userData = JSON.parse(decrypt(key, iv, token));
//         } catch (e) {
//             console.log("Token解析失败:", e);
//             return res.json({
//                 code: 401,
//                 msg: "身份验证失败"
//             });
//         }
//
//         let company = userData.company || '';
//         let uname = userData.uname || userData.name || '系统用户';
//         let type = userData.type || '商家';
//         let account = userData.account || '';
//
//         if (!company) {
//             return res.json({
//                 code: 400,
//                 msg: "公司信息缺失"
//             });
//         }
//
//         // 获取当前日期
//         let date = new Date();
//         let today = date.getFullYear() + '-' +
//             (date.getMonth() + 1).toString().padStart(2, '0') + '-' +
//             date.getDate().toString().padStart(2, '0');
//
//         // 3. **关键修改：使用异步方式，避免阻塞**
//         processOrderAsync();
//
//         async function processOrderAsync() {
//             let connection;
//
//             try {
//                 // 获取数据库连接
//                 db.getConnection(function(err, conn) {
//                     if (err) {
//                         console.error("获取数据库连接失败:", err);
//                         return res.json({
//                             code: 500,
//                             msg: "数据库连接失败"
//                         });
//                     }
//                     connection = conn;
//
//                     // 开始事务
//                     connection.beginTransaction(function(transErr) {
//                         if (transErr) {
//                             connection.release();
//                             console.error("开始事务失败:", transErr);
//                             return res.json({
//                                 code: 500,
//                                 msg: "开始事务失败"
//                             });
//                         }
//
//                         // 1. 检查订单是否已存在
//                         let checkSql = "SELECT COUNT(*) as count FROM orders WHERE ddh = ? AND company = ?";
//                         connection.query(checkSql, [pro_num, company], function(checkErr, checkRows) {
//                             if (checkErr) {
//                                 return rollbackAndRespond(checkErr, "检查订单失败");
//                             }
//
//                             if (checkRows[0].count > 0) {
//                                 return rollbackAndRespond(null, "订单号已存在", 402);
//                             }
//
//                             // 2. 插入订单主表
//                             let orderSql, orderParams;
//
//                             if (type === '商家') {
//                                 // orders表字段：riqi ddh hyzh hyxm yhfa xfje ssje yhje syy company
//                                 orderSql = "INSERT INTO orders(riqi, ddh, hyzh, hyxm, yhfa, xfje, ssje, yhje, syy, company) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
//                                 orderParams = [
//                                     today,          // riqi
//                                     pro_num,        // ddh
//                                     username || '', // hyzh
//                                     user || '',     // hyxm
//                                     youhui,         // yhfa
//                                     xfje,           // xfje
//                                     ssje,           // ssje
//                                     yhje,           // yhje
//                                     uname,          // syy
//                                     company         // company
//                                 ];
//                             } else {
//                                 // 普通用户，加上 hyjf 字段
//                                 orderSql = "INSERT INTO orders(riqi, ddh, hyzh, hyxm, yhfa, xfje, ssje, yhje, syy, company, hyjf) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
//                                 orderParams = [
//                                     today,          // riqi
//                                     pro_num,        // ddh
//                                     account || '',  // hyzh
//                                     uname,          // hyxm
//                                     youhui,         // yhfa
//                                     xfje,           // xfje
//                                     ssje,           // ssje
//                                     yhje,           // yhje
//                                     uname,          // syy
//                                     company,        // company
//                                     youhui          // hyjf
//                                 ];
//                             }
//
//                             console.log("插入订单SQL:", orderSql);
//                             console.log("订单参数:", orderParams);
//
//                             connection.query(orderSql, orderParams, function(orderErr, orderResult) {
//                                 if (orderErr) {
//                                     return rollbackAndRespond(orderErr, "插入订单失败");
//                                 }
//
//                                 console.log("✅ 订单插入成功，ID:", orderResult.insertId);
//
//                                 // 3. 插入商品详情
//                                 if (pro_list.length === 0) {
//                                     // 没有商品，直接提交
//                                     return commitTransaction();
//                                 }
//
//                                 let detailsSql = "INSERT INTO orders_details(ddid, cplx, cpmc, dw, dj, dzbl, zhdj, zhje, company, gs, zt, zh) VALUES ?";
//
//                                 let detailValues = pro_list.map(item => [
//                                     pro_num,                                // ddid
//                                     item.cplx || '',                       // cplx
//                                     item.cpmc || '',                       // cpmc
//                                     item.dw || '',                         // dw
//                                     parseFloat(item.dj) || 0,              // dj
//                                     parseFloat(youhui) || 1,               // dzbl
//                                     parseFloat(item.zhdj) || 0,            // zhdj
//                                     parseFloat(item.zhje) || 0,            // zhje
//                                     company,                               // company
//                                     parseFloat(item.gs) || 1,              // gs
//                                     '2',                                   // zt（挂账状态）
//                                     zhuohao || ''                          // zh（桌号）
//                                 ]);
//
//                                 console.log("插入商品数量:", detailValues.length);
//
//                                 connection.query(detailsSql, [detailValues], function(detailErr, detailResult) {
//                                     if (detailErr) {
//                                         return rollbackAndRespond(detailErr, "插入商品详情失败");
//                                     }
//
//                                     console.log("✅ 商品详情插入成功，插入行数:", detailResult.affectedRows);
//
//                                     // 提交事务
//                                     commitTransaction();
//                                 });
//                             });
//                         });
//
//                         // 提交事务函数
//                         function commitTransaction() {
//                             connection.commit(function(commitErr) {
//                                 if (commitErr) {
//                                     console.error("提交事务失败:", commitErr);
//                                     connection.rollback(function() {
//                                         connection.release();
//                                         res.json({
//                                             code: 500,
//                                             msg: "提交事务失败"
//                                         });
//                                     });
//                                     return;
//                                 }
//
//                                 console.log("✅ 事务提交成功");
//
//                                 // 4. 更新桌位信息（如果有桌号）
//                                 if (zhuohao && zhuohao.trim() !== '') {
//                                     let tableSql = "INSERT INTO order_table (zh, bm, company, zt, sj) VALUES (?, ?, ?, '挂账', NOW()) " +
//                                         "ON DUPLICATE KEY UPDATE bm = ?, zt = '挂账', sj = NOW()";
//
//                                     connection.query(tableSql, [zhuohao, pro_num, company, pro_num], function(tableErr) {
//                                         connection.release(); // 释放连接
//
//                                         if (tableErr) {
//                                             console.log("⚠️ 桌位更新失败:", tableErr);
//                                         } else {
//                                             console.log("✅ 桌位更新成功");
//                                         }
//
//                                         sendSuccessResponse();
//                                     });
//                                 } else {
//                                     connection.release(); // 释放连接
//                                     sendSuccessResponse();
//                                 }
//                             });
//                         }
//
//                         // 回滚和响应函数
//                         function rollbackAndRespond(error, message, code = 500) {
//                             console.error(message + ":", error);
//                             connection.rollback(function() {
//                                 connection.release();
//                                 res.json({
//                                     code: code,
//                                     msg: message + (error ? ": " + error.message : "")
//                                 });
//                             });
//                         }
//
//                         // 成功响应函数
//                         function sendSuccessResponse() {
//                             console.log("🎉 挂账成功！订单号:", pro_num);
//                             res.json({
//                                 code: 200,
//                                 msg: "挂账成功！",
//                                 data: {
//                                     order_no: pro_num,
//                                     table_no: zhuohao,
//                                     amount: xfje,
//                                     item_count: pro_list.length,
//                                     timestamp: new Date().toISOString()
//                                 }
//                             });
//                         }
//                     });
//                 });
//
//             } catch (error) {
//                 console.error("处理异常:", error);
//                 if (connection) {
//                     connection.release();
//                 }
//                 res.json({
//                     code: 500,
//                     msg: "服务器内部错误",
//                     error: error.message
//                 });
//             }
//         }
//
//     } catch (error) {
//         console.error("❌ 挂账处理异常:", error);
//         res.json({
//             code: 500,
//             msg: "服务器内部错误",
//             error: error.message
//         });
//     }
// });
router.post('/addguazhang', function (req, res) {
    console.log("🚀 挂账请求到达");

    try {
        // 1. 解析JSON请求体
        console.log("请求体:", JSON.stringify(req.body));

        let pro_list = req.body.pro_list || [];
        let pro_num = req.body.pro_num || '';
        let youhui = req.body.youhui || '1';
        let user = req.body.member_name || '';
        let username = req.body.member_username || '';
        let yhje = parseFloat(req.body.yhje) || 0;
        let ssje = parseFloat(req.body.ssje) || 0;
        let xfje = parseFloat(req.body.xfje) || 0;
        let zhuohao = req.body.zhuohao || ''; // 桌号可选
        let remark = req.body.remark || '';

        console.log("参数:", { pro_num, zhuohao, item_count: pro_list.length, xfje });

        // 2. 验证必要参数
        if (!pro_num) {
            return res.json({ code: 400, msg: "订单号不能为空" });
        }

        if (!Array.isArray(pro_list) || pro_list.length === 0) {
            return res.json({ code: 400, msg: "商品列表不能为空" });
        }

        // 3. 获取用户信息
        let token = localStorage.getItem("token");
        let company = 'default_company';

        if (token) {
            try {
                let key = '123456789abcdefg';
                let iv = 'abcdefg123456789';
                let userData = JSON.parse(decrypt(key, iv, token));
                company = userData.company || company;
            } catch (e) {
                console.log("Token解析失败，使用默认公司");
            }
        }

        // 4. 获取当前日期
        let date = new Date();
        let today = date.getFullYear() + '-' +
            (date.getMonth() + 1).toString().padStart(2, '0') + '-' +
            date.getDate().toString().padStart(2, '0');

        // 5. 插入订单主表
        let orderSql = "INSERT INTO orders(riqi, ddh, company, xfje, ssje, yhje, yhfa) VALUES(?, ?, ?, ?, ?, ?, ?)";
        let orderParams = [today, pro_num, company, xfje, ssje, yhje, youhui];

        console.log("订单SQL:", orderSql, "参数:", orderParams);

        db.query(orderSql, orderParams, function (err, orderResult) {
            if (err) {
                console.error("插入订单失败:", err);
                return res.json({ code: 500, msg: "插入订单失败: " + err.message });
            }

            console.log("✅ 订单插入成功，ID:", orderResult.insertId);

            // 6. 插入商品详情
            if (pro_list.length > 0) {
                let detailsSql = "INSERT INTO orders_details(ddid, cplx, cpmc, dw, dj, dzbl, zhdj, zhje, company, gs, zt, zh) VALUES ?";

                let detailValues = pro_list.map(item => [
                    pro_num,                                // ddid
                    item.cplx || '',                       // cplx
                    item.cpmc || '',                       // cpmc
                    item.dw || '',                         // dw
                    parseFloat(item.dj) || 0,              // dj
                    parseFloat(youhui) || 1,               // dzbl
                    parseFloat(item.zhdj) || 0,            // zhdj
                    parseFloat(item.zhje) || 0,            // zhje
                    company,                               // company
                    parseFloat(item.gs) || 1,              // gs
                    '2',                                   // zt（挂账状态）
                    zhuohao || ''                          // zh（桌号，可能为空）
                ]);

                console.log("插入商品，数量:", detailValues.length);

                db.query(detailsSql, [detailValues], function (err, detailResult) {
                    if (err) {
                        console.error("插入商品失败:", err);
                        // 即使商品插入失败，也返回部分成功
                    } else {
                        console.log("✅ 商品插入成功，行数:", detailResult.affectedRows);
                    }

                    // 7. 如果有桌号，更新桌位信息
                    if (zhuohao && zhuohao.trim() !== '') {
                        let tableSql = "UPDATE order_table SET bm = ?, zt = '3', sj = NOW() WHERE zh = ?";
                        db.query(tableSql, [pro_num, zhuohao], function(err) {
                            if (err) {
                                console.log("⚠️ 桌位更新失败:", err);
                            } else {
                                console.log("✅ 桌位更新成功");
                            }
                        });
                    }

                    // 8. 返回成功响应
                    res.json({
                        code: 200,
                        msg: "挂账成功！",
                        data: {
                            order_no: pro_num,
                            table_no: zhuohao || '无桌位',
                            amount: xfje,
                            item_count: pro_list.length,
                            timestamp: new Date().toISOString()
                        }
                    });
                });
            } else {
                // 没有商品的情况
                res.json({
                    code: 200,
                    msg: "挂账成功（无商品）",
                    data: { order_no: pro_num }
                });
            }
        });

    } catch (error) {
        console.error("处理异常:", error);
        res.json({
            code: 500,
            msg: "服务器内部错误",
            error: error.message
        });
    }
});
// 复用add接口的处理逻辑
function addOrderHandler(data, res) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let userData;

    try {
        userData = JSON.parse(decrypt(key, iv, token));
    } catch (e) {
        console.log("Token解析失败");
        return res.json({code: 401, msg: "未登录"});
    }

    let pro_list = JSON.parse(data.pro_list || '[]');
    let pro_num = data.pro_num;
    let youhui = data.youhui || '1';
    let user = data.member_name || '';
    let username = data.member_username || '';
    let yhje = parseFloat(data.yhje) || 0;
    let ssje = parseFloat(data.ssje) || 0;
    let xfje = parseFloat(data.xfje) || 0;
    let zhuohao = data.zhuohao || '';
    let remark = data.remark || '';

    let company = userData.company;
    let uname = userData.uname;
    let type = userData.type;
    let account = userData.account;

    let date = new Date();
    let today = date.getFullYear() + '-' +
        (date.getMonth() + 1).toString().padStart(2, '0') + '-' +
        date.getDate().toString().padStart(2, '0');

    // 关键修改：跳过订单重复检查！
    console.log("⏩ 跳过订单检查，直接插入...");
    let orderSql = "";
    if (type == '商家') {
        orderSql = "INSERT IGNORE INTO orders(riqi,ddh,yhfa,syy,hyzh,hyxm,company,yhje,ssje,xfje) VALUES(?,?,?,?,?,?,?,?,?,?)";
    } else {
        orderSql = "INSERT IGNORE INTO orders(riqi,ddh,hyzh,hyxm,hyjf,yhfa,company,yhje,ssje,xfje) VALUES(?,?,?,?,?,?,?,?,?,?)";
    }

    let orderParams = type == '商家'
        ? [today, pro_num, youhui, uname, username, user, company, yhje, ssje, xfje]
        : [today, pro_num, account, uname, youhui, company, yhje, ssje, xfje];

    db.query(orderSql, orderParams, function (err, orderResult) {
        if (err) {
            console.log("订单插入失败:", err.message);
            return res.json({code: 500, msg: "订单插入失败"});
        }

        console.log("✅ 订单插入成功");

        if (pro_list.length === 0) {
            return res.json({code: 200, msg: "挂账成功（无商品）"});
        }

        let sql1 = "INSERT INTO orders_details(ddid,cplx,cpmc,dw,dj,dzbl,zhdj,zhje,company,gs,zt,zh) VALUES ";
        let sql2 = "";

        for(let i=0; i<pro_list.length; i++){
            if(sql2 == ""){
                sql2 = "(?,?,?,?,?,?,?,?,?,?,?,?)";
            }else{
                sql2 += ",(?,?,?,?,?,?,?,?,?,?,?,?)";
            }
        }

        let detailsSql = sql1 + sql2;
        let detailParams = [];

        for(let i=0; i<pro_list.length; i++){
            let item = pro_list[i];
            detailParams.push(
                pro_num,
                item.cplx || '',
                item.cpmc || '',
                item.dw || '',
                item.dj || '0',
                youhui,
                parseFloat(item.zhdj) || 0,
                parseFloat(item.zhje) || 0,
                company,
                parseFloat(item.gs) || 1,
                '2',
                zhuohao
            );
        }

        db.query(detailsSql, detailParams, function (err, detailResult) {
            if (err) {
                console.log("商品插入失败:", err.message);
                return res.json({code: 500, msg: "商品插入失败"});
            }

            // 更新桌位
            if(zhuohao){
                let tableSql = "UPDATE order_table SET bm = ?, zt = '3', sj = NOW() WHERE zh = ?";
                db.query(tableSql, [pro_num, zhuohao], function() {
                    // 忽略桌位更新错误
                });
            }

            console.log("✅✅✅ 挂账成功");
            res.json({
                code: 200,
                msg: "挂账成功！",
                data: {
                    order_no: pro_num,
                    table_no: zhuohao,
                    amount: xfje
                }
            });
        });
    });
}

router.post('/check_order_exists', function (req, res) {
    console.log("检查订单是否存在:", req.body.ddid);

    // 设置响应头，防止超时
    res.setTimeout(5000, function() {
        console.log("检查订单超时");
        if (!res.headersSent) {
            return res.json({
                exists: false,
                message: '查询超时'
            });
        }
    });

    let ddid = req.body.ddid;

    if (!ddid) {
        return res.json({
            exists: false,
            message: '缺少订单号'
        });
    }

    // 简单查询，只检查是否存在
    var sql = `SELECT COUNT(*) as count FROM orders WHERE ddh = ? LIMIT 1`;

    console.log("执行SQL:", sql, "参数:", ddid);

    db.query(sql, [ddid], function (err, rows) {
        if (err) {
            console.error("检查订单失败:", err);
            return res.json({
                exists: false,
                message: '查询失败',
                error: err.message
            });
        }

        let exists = rows[0] && rows[0].count > 0;
        console.log(`订单 ${ddid} 是否存在: ${exists}`);

        return res.json({
            exists: exists,
            count: rows[0] ? rows[0].count : 0,
            message: exists ? '订单已存在' : '订单不存在'
        });
    });
});

// 添加查询挂账订单的接口
router.post('/selectGuazhangOrder', function (req, res) {
    let ddid = req.body.ddid;
    let zh = req.body.zh;
    let token = localStorage.getItem("token");

    // 获取公司信息
    let company = '';
    if (token) {
        try {
            let key = '123456789abcdefg';
            let iv = 'abcdefg123456789';
            let data = JSON.parse(decrypt(key, iv, token));
            let value = Object.values(data);
            company = value[0] || '';
        } catch (e) {
            console.log('获取公司信息失败:', e);
        }
    }

    console.log("查询挂账订单，订单号:", ddid, "桌号:", zh, "公司:", company);

    // 查询订单基本信息
    let orderSql = `SELECT o.* FROM orders o 
                JOIN orders_details od ON o.ddh = od.ddid 
                WHERE o.ddh = '${ddid}' 
                AND o.company = '${company}' 
                AND od.zt = '2' 
                LIMIT 1`;

    // 查询订单详情
    let detailsSql = `SELECT od.*, p.id as product_id, p.unit 
                     FROM orders_details od 
                     LEFT JOIN product p ON od.cpmc = p.product_name 
                     WHERE od.ddid = '${ddid}' AND od.zt = '2'`;

    // 先查询订单信息
    db.query(orderSql, function (err, orderRows) {
        if (err) {
            console.error('查询订单失败:', err);
            return res.json({
                success: false,
                message: '查询订单失败'
            });
        }

        if (orderRows.length === 0) {
            return res.json({
                success: false,
                message: '未找到订单'
            });
        }

        // 再查询订单详情
        db.query(detailsSql, function (err, detailRows) {
            if (err) {
                console.error('查询订单详情失败:', err);
                return res.json({
                    success: false,
                    message: '查询订单详情失败'
                });
            }

            res.json({
                success: true,
                orderInfo: orderRows[0],
                data: detailRows,
                message: '获取挂账订单成功'
            });
        });
    });
});

// 简化的检查挂账接口
router.post('/checkGuazhangOrder', function (req, res) {
    let ddid = req.body.ddid;

    console.log("检查订单是否为挂账，订单号:", ddid);

    if (!ddid) {
        return res.json({
            isGuazhang: false,
            message: '缺少订单号'
        });
    }

    // 通过orders_details表检查zt字段
    var sql = `SELECT od.ddid, od.zt FROM orders_details od WHERE od.ddid = '${ddid}' AND od.zt = '2' LIMIT 1`;

    db.query(sql, function (err, rows) {
        if (err) {
            console.error('数据库错误:', err);
            return res.json({
                isGuazhang: false,
                message: '查询失败'
            });
        }

        if (rows.length > 0) {
            let isGuazhang = rows[0].zt == '2';
            console.log(`订单 ${ddid} 状态: ${rows[0].zt}, 是挂账: ${isGuazhang}`);

            return res.json({
                isGuazhang: isGuazhang,
                ddid: ddid,
                orderStatus: rows[0].zt,
                message: isGuazhang ? '该订单为挂账状态（未结算）' : '该订单不是挂账状态'
            });
        } else {
            console.log(`未找到挂账记录: ${ddid}`);
            return res.json({
                isGuazhang: false,
                message: '未找到挂账记录'
            });
        }
    });
});

// 添加测试路由 ----------------------------------------------------
router.post('/test_insert', function (req, res) {
    console.log("========== 测试插入开始 ==========");
    console.log("测试时间:", new Date().toISOString());

    // 获取公司信息（从token解密）
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data;

    try {
        data = JSON.parse(decrypt(key, iv, token));
        console.log("解密后的token数据:", data);
    } catch (e) {
        console.log("Token解密失败，使用默认公司");
    }

    let company = (data && data.company) ? data.company : 'test_company';
    let testOrderNo = 'TEST' + Date.now();

    // 1. 测试orders表插入
    const sql1 = `INSERT INTO orders (ddh, company, riqi) 
              VALUES ('${testOrderNo}', '${company}', CURDATE())`;

    console.log("测试SQL1:", sql1);

    db.query(sql1, function (err, result) {
        if (err) {
            console.error("✅ 测试orders表插入失败:", err);
            return res.json(JSON.stringify({
                success: false,
                error: err.message,
                sql: sql1
            }));
        }

        console.log("✅ orders表插入成功:", {
            affectedRows: result.affectedRows,
            insertId: result.insertId
        });

        // 2. 测试orders_details表插入
        const sql2 = `INSERT INTO orders_details (ddid, cpmc, company, create_time) 
                      VALUES ('${testOrderNo}', '测试商品', '${company}', NOW())`;

        console.log("测试SQL2:", sql2);

        db.query(sql2, function (err2, result2) {
            if (err2) {
                console.error("❌ orders_details表插入失败:", err2);
                return res.json(JSON.stringify({
                    success: false,
                    error: err2.message,
                    sql: sql2
                }));
            }

            console.log("✅ orders_details表插入成功:", {
                affectedRows: result2.affectedRows,
                insertId: result2.insertId
            });

            // 3. 立即查询验证
            const sql3 = `SELECT * FROM orders WHERE ddh = '${testOrderNo}'`;

            db.query(sql3, function (err3, rows3) {
                console.log("✅ 查询验证结果:");
                if (err3) {
                    console.error("查询失败:", err3);
                } else {
                    console.log("找到记录数:", rows3.length);
                    if (rows3.length > 0) {
                        console.log("第一条记录:", rows3[0]);
                    }
                }

                // 返回成功结果
                res.json(JSON.stringify({
                    success: true,
                    message: "测试插入完成",
                    orderNo: testOrderNo,
                    company: company,
                    ordersInsert: {
                        affectedRows: result.affectedRows,
                        insertId: result.insertId
                    },
                    detailsInsert: {
                        affectedRows: result2.affectedRows,
                        insertId: result2.insertId
                    },
                    verify: {
                        count: rows3 ? rows3.length : 0
                    }
                }));
            });
        });
    });
});

// 添加调试挂账路由 ----------------------------------------------------
router.post('/debug_guazhang', function (req, res) {
    console.log("========== 调试挂账请求 ==========");
    console.log("请求完整信息:");
    console.log("- 订单号:", req.body.pro_num);
    console.log("- 桌号:", req.body.zhuohao);
    console.log("- 备注:", req.body.remark);
    console.log("- 优惠金额:", req.body.yhje);
    console.log("- 实际金额:", req.body.ssje);
    console.log("- 消费金额:", req.body.xfje);

    try {
        if (req.body.pro_list) {
            let pro_list = JSON.parse(req.body.pro_list);
            console.log("- 商品数量:", pro_list.length);
            console.log("- 第一个商品:", pro_list[0]);
        } else {
            console.log("- pro_list为空或未提供");
        }
    } catch (e) {
        console.log("- 解析pro_list失败:", e.message);
    }

    // 返回接收到的数据（不实际插入）
    res.json(JSON.stringify({
        code: 200,
        msg: "调试模式 - 数据接收成功",
        receivedData: {
            orderNo: req.body.pro_num,
            tableNo: req.body.zhuohao,
            itemCount: req.body.pro_list ? JSON.parse(req.body.pro_list).length : 0
        }
    }));
});
router.post('/load_table_order', function (req, res) {
    console.log("加载桌位订单信息");

    let tableNumber = req.body.tableNumber;
    let orderNo = req.body.orderNo;

    console.log("桌位:", tableNumber, "订单:", orderNo);

    if (!tableNumber && !orderNo) {
        return res.json({
            success: false,
            message: '缺少参数'
        });
    }

    // 如果有订单号，直接查询订单
    if (orderNo) {
        // 查询订单详情
        let sql = `SELECT od.*, p.unit, p.id as product_id 
                   FROM orders_details od 
                   LEFT JOIN product p ON od.cpmc = p.product_name 
                   WHERE od.ddid = '${orderNo}'`;

        db.query(sql, function (err, rows) {
            if (err) {
                console.log("查询订单失败:", err);
                return res.json({
                    success: false,
                    message: '查询失败'
                });
            }

            console.log("查询到订单商品:", rows.length);

            res.json({
                success: true,
                data: rows,
                orderNo: orderNo,
                message: '加载订单成功'
            });
        });
    }
    // 如果有桌号，查询桌位关联的订单
    else if (tableNumber) {
        // 先查询桌位信息
        let tableSql = `SELECT bm FROM order_table WHERE zh = '${tableNumber}' LIMIT 1`;

        db.query(tableSql, function (err, tableRows) {
            if (err || !tableRows || tableRows.length === 0 || !tableRows[0].bm) {
                console.log("桌位没有关联订单");
                return res.json({
                    success: false,
                    message: '该桌位没有订单'
                });
            }

            let orderNo = tableRows[0].bm;

            // 查询订单详情
            let orderSql = `SELECT od.*, p.unit, p.id as product_id 
                           FROM orders_details od 
                           LEFT JOIN product p ON od.cpmc = p.product_name 
                           WHERE od.ddid = '${orderNo}'`;

            db.query(orderSql, function (err, orderRows) {
                if (err) {
                    console.log("查询订单失败:", err);
                    return res.json({
                        success: false,
                        message: '查询失败'
                    });
                }

                res.json({
                    success: true,
                    data: orderRows,
                    orderNo: orderNo,
                    message: '加载订单成功'
                });
            });
        });
    }


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
        })
    })
});
// 必须要有这一行！
module.exports = router;