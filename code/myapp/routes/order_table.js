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
// 在 order_table.js 文件顶部添加这个函数
function getCurrentCompany(req) {
    let company = '';

    // 尝试多种方式获取token
    let token = req.headers['authorization'] ||
        req.headers['x-token'] ||
        req.body.token ||
        (req.cookies ? req.cookies.token : null);

    // 如果还没有，尝试从localStorage获取（适用于开发测试）
    if (!token && typeof localStorage !== 'undefined') {
        try {
            token = localStorage.getItem("token");
        } catch (e) {
            console.log('无法从localStorage获取token:', e.message);
        }
    }

    if (token && token !== 'undefined' && token !== 'null') {
        try {
            let key = '123456789abcdefg';
            let iv = 'abcdefg123456789';

            let decrypted = decrypt(key, iv, token);
            let data = JSON.parse(decrypted);
            let value = Object.values(data);
            company = value[0] || '';
        } catch (decryptError) {
            console.error("解密失败:", decryptError.message);
            company = '默认公司';
        }
    } else {
        console.log("没有有效的token，使用默认company");
        company = '默认公司';
    }

    console.log("获取到的公司:", company);
    return company;
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

// 修改添加新桌位接口
router.post('/addTable', function (req, res) {
    console.log("=== 添加新桌位开始 ===");

    let zh = req.body.zh;
    let zx = req.body.zx;
    let company = req.body.company || '';

    console.log("接收参数:", { zh, zx, company });

    // 验证参数
    if (!zh) {
        return res.json({
            success: false,
            message: '桌位编号不能为空'
        });
    }

    if (!zx) {
        return res.json({
            success: false,
            message: '桌位人数不能为空'
        });
    }

    // 验证桌位编号格式
    if (!/^[A-Za-z0-9_-]+$/.test(zh)) {
        return res.json({
            success: false,
            message: '桌位编号只能包含字母、数字、下划线和横线'
        });
    }

    // 验证桌位人数范围
    const capacity = parseInt(zx);
    if (isNaN(capacity) || capacity < 1 || capacity > 20) {
        return res.json({
            success: false,
            message: '桌位人数必须在1-20之间'
        });
    }

    // 检查桌位是否已存在
    let checkSql = `SELECT COUNT(*) as count FROM order_table 
                   WHERE zh = '${zh}' 
                   AND (company = '${company}' OR company IS NULL OR company = '')`;

    console.log("检查SQL:", checkSql);

    db.query(checkSql, function (checkErr, checkResult) {
        if (checkErr) {
            console.error('检查桌位存在性失败:', checkErr);
            return res.json({
                success: false,
                message: '检查桌位失败'
            });
        }

        console.log("检查结果:", checkResult[0].count);

        if (checkResult[0].count > 0) {
            return res.json({
                success: false,
                message: '桌位编号已存在，请使用其他编号'
            });
        }

        // 获取当前最大ID
        let getMaxIdSql = `SELECT COALESCE(MAX(id), 0) as max_id FROM order_table`;

        db.query(getMaxIdSql, function (maxErr, maxResult) {
            if (maxErr) {
                console.error('获取最大ID失败:', maxErr);
                return res.json({
                    success: false,
                    message: '获取ID失败'
                });
            }

            const nextId = maxResult[0].max_id + 1;
            console.log("下一个可用ID:", nextId);

            // 使用手动ID插入数据
            let insertSql = `INSERT INTO order_table 
                           (id, zh, zx, zt, company) 
                           VALUES (?, ?, ?, ?, ?)`;

            let params = [
                nextId,
                zh,
                zx,
                '1',  // 初始状态为1（空闲）
                company
            ];

            console.log("插入SQL:", insertSql);
            console.log("参数:", params);

            db.query(insertSql, params, function (insertErr, insertResult) {
                if (insertErr) {
                    console.error('插入桌位失败:', insertErr);
                    return res.json({
                        success: false,
                        message: '添加桌位失败: ' + insertErr.message
                    });
                }

                console.log('添加桌位成功，ID:', nextId);

                // 返回完整的桌位数据，包括所有字段
                res.json({
                    success: true,
                    message: '添加桌位成功',
                    data: {
                        id: nextId,
                        zh: zh,
                        zx: zx,
                        zt: '1',
                        sj: null,
                        bm: null,
                        company: company
                    }
                });
            });
        });
    });
});

// 修改 order_table.js 中的 deleteTable 接口
router.post('/deleteTable', function (req, res) {
    console.log("=== 删除桌位接口开始 ===");

    let id = req.body.id;
    let zh = req.body.zh;
    let company = req.body.company || '';

    console.log("接收参数:", { id, zh, company });

    // 验证参数
    if (!id && !zh) {
        return res.json({
            success: false,
            message: '请提供桌位ID或编号'
        });
    }

    try {
        // 优先使用ID，如果没有ID则使用桌位编号
        let whereClause = '';
        if (id) {
            whereClause = `id = '${id}'`;
        } else {
            whereClause = `zh LIKE '%${zh}%'`;
        }

        // 添加公司条件
        if (company && company.trim() !== '') {
            whereClause += ` AND (company = '${company}' OR company IS NULL OR company = '')`;
        }

        // 先检查桌位是否存在及其状态
        let checkSql = `SELECT zt, zh FROM order_table WHERE ${whereClause}`;

        console.log("检查SQL:", checkSql);

        db.query(checkSql, function (checkErr, checkResult) {
            if (checkErr) {
                console.error('检查桌位失败:', checkErr);
                return res.json({
                    success: false,
                    message: '检查桌位失败: ' + checkErr.message
                });
            }

            if (checkResult.length === 0) {
                return res.json({
                    success: false,
                    message: '未找到指定的桌位'
                });
            }

            const tableData = checkResult[0];
            console.log("找到桌位:", tableData);

            // 检查桌位状态（只能删除空闲桌位）
            if (tableData.zt !== '1') {
                return res.json({
                    success: false,
                    message: `桌位 ${tableData.zh} 当前不是空闲状态，无法删除`
                });
            }

            // 执行删除
            let deleteSql = `DELETE FROM order_table WHERE ${whereClause}`;

            console.log("删除SQL:", deleteSql);

            db.query(deleteSql, function (deleteErr, deleteResult) {
                if (deleteErr) {
                    console.error('删除桌位失败:', deleteErr);
                    return res.json({
                        success: false,
                        message: '删除桌位失败: ' + deleteErr.message
                    });
                }

                console.log('删除桌位成功，影响行数:', deleteResult.affectedRows);

                // ✅ 修复：注释掉未定义的函数调用，或者定义它
                // logTableDeletionToDatabase(tableData, company);

                // ✅ 替代方案：简单记录到控制台
                console.log(`桌位删除记录: ${tableData.zh}, 公司: ${company}, 时间: ${new Date().toLocaleString()}`);

                res.json({
                    success: true,
                    message: `成功删除桌位: ${tableData.zh}`,
                    affectedRows: deleteResult.affectedRows,
                    table: tableData
                });
            });
        });

    } catch (error) {
        console.error('删除桌位过程异常:', error);
        res.json({
            success: false,
            message: '删除桌位过程异常: ' + error.message
        });
    }
});

router.all('/ass', function (req, res, next) {
    console.log("访问ass路由");

    try {
        // 先尝试获取 company，但不让错误影响页面加载
        let company = '';
        try {
            let token = req.headers['authorization'] || req.cookies.token || req.body.token || localStorage.getItem("token");
            if (token) {
                let key = '123456789abcdefg';
                let iv = 'abcdefg123456789';
                let data = JSON.parse(decrypt(key, iv, token));
                let value = Object.values(data);
                company = value[0] || '';
            }
        } catch (tokenError) {
            console.log("获取company失败，使用默认值:", tokenError.message);
            company = 'default_company';
        }

        console.log("当前company:", company);

        let isSelect = req.query.pagenum == undefined;
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

        // 简化查询，先不查询 product 表
        let result = {
            datas: [],
            types: [],
            datas2: '[]'
        };

        // 先渲染页面，不等待数据库查询
        console.log("渲染order_table.html");
        res.render('order_table.html', {
            title: 'Express',
            ...result
        });

    } catch (e) {
        console.error("ass路由错误:", e);
        res.render("error.html", {error: '网络错误，请稍后再试！'});
    }
});

// 查询桌位
// router.post('/select', function (req, res) {
//     console.log("调用/select接口");
//
//     try {
//         // 获取company - 使用更稳健的方式
//         let company = '';
//
//         // 方法1: 从请求头获取
//         let token = req.headers['authorization'] ||
//             req.headers['x-token'] ||
//             req.cookies?.token ||
//             req.body?.token;
//
//         console.log("找到的token:", token ? token.substring(0, 20) + "..." : "无token");
//
//         if (!token) {
//             // 方法2: 从localStorage获取（服务器端）
//             try {
//                 token = localStorage.getItem("token");
//                 console.log("从localStorage获取token:", token ? "有" : "无");
//             } catch (lsError) {
//                 console.log("localStorage不可用:", lsError.message);
//             }
//         }
//
//         if (token && token !== 'undefined' && token !== 'null') {
//             try {
//                 let key = '123456789abcdefg';
//                 let iv = 'abcdefg123456789';
//
//                 console.log("尝试解密token...");
//                 let decrypted = decrypt(key, iv, token);
//                 console.log("解密成功，数据:", decrypted.substring(0, 50) + "...");
//
//                 let data = JSON.parse(decrypted);
//                 let value = Object.values(data);
//                 company = value[0] || '';
//
//                 console.log("提取的company:", company);
//             } catch (decryptError) {
//                 console.error("解密失败:", decryptError.message);
//                 company = 'default_company';
//             }
//         } else {
//             console.log("没有有效的token，使用默认company");
//             company = 'default_company';
//         }
//
//         // 如果还是空，使用默认值
//         if (!company || company.trim() === '') {
//             company = 'default_company';
//         }
//
//         console.log("最终使用的company:", company);
//
//         // 构建SQL查询
//         let sql = `SELECT * FROM order_table WHERE company = ?`;
//         console.log("执行SQL:", sql, "参数:", company);
//
//         db.query(sql, [company], function (err, rows) {
//             if (err) {
//                 console.error('数据库查询错误详情:');
//                 console.error('- 错误代码:', err.code);
//                 console.error('- 错误消息:', err.sqlMessage);
//                 console.error('- SQL状态:', err.sqlState);
//                 console.error('- 错误SQL:', err.sql);
//
//                 // 如果表不存在或字段不存在，先创建
//                 if (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_BAD_FIELD_ERROR') {
//                     console.log("检测到表结构问题，尝试修复...");
//
//                     // 先返回空数据，让前端能显示
//                     return res.json({
//                         success: true,
//                         data: [],
//                         message: '表结构需要更新，暂时返回空数据'
//                     });
//                 }
//
//                 return res.status(500).json({
//                     success: false,
//                     message: '数据库查询失败',
//                     error: err.message,
//                     code: err.code
//                 });
//             }
//
//             console.log('数据库返回结果数量:', rows.length);
//
//             // 如果没有数据，初始化一些默认数据
//             if (rows.length === 0) {
//                 console.log("没有找到数据，可能需要初始化...");
//             }
//
//             res.json({
//                 success: true,
//                 data: rows,
//                 message: '获取桌位列表成功'
//             });
//         });
//
//     } catch (error) {
//         console.error('处理select请求时发生未捕获的错误:', error);
//         console.error('错误堆栈:', error.stack);
//
//         // 无论如何都返回一个响应，避免前端卡住
//         res.status(500).json({
//             success: false,
//             message: '服务器内部错误',
//             error: error.message
//         });
//     }
// });
// 查询桌位 - 简化版
// router.post('/select', function (req, res) {
//     console.log("=== /select 开始 ===");
//
//     // 直接查询，不考虑token和company
//     let sql = `SELECT * FROM order_table`;
//     console.log("SQL:", sql);
//
//     db.query(sql, function (err, rows) {
//         if (err) {
//             console.error('数据库错误:', err.message);
//
//             // 即使出错也要返回响应
//             return res.json({
//                 success: false,
//                 data: [],
//                 message: '数据库错误: ' + err.message
//             });
//         }
//
//         console.log("查询到数据条数:", rows ? rows.length : 0);
//
//         // 确保总是返回JSON响应
//         res.json({
//             success: true,
//             data: rows || [],
//             message: '获取成功'
//         });
//
//         console.log("=== /select 结束 ===");
//     });
// });
router.post('/select', function (req, res) {
    console.log("=== /select 开始 ===");

    // 获取当前公司
    let company = getCurrentCompany(req);
    console.log("当前公司:", company);

    // ✅ 关键修改：查询当前公司的数据，如果没有则查询company为空的数据
    let sql = `SELECT * FROM order_table WHERE company = ? OR company IS NULL OR company = ''`;
    console.log("执行SQL:", sql, "参数:", company);

    db.query(sql, [company], function (err, rows) {
        if (err) {
            console.error('数据库错误:', err.message);
            return res.json({
                success: false,
                data: [],
                message: '数据库错误: ' + err.message
            });
        }

        console.log("查询到数据条数:", rows ? rows.length : 0);

        // ✅ 如果有company为空的记录，更新它们
        if (rows.length > 0) {
            let nullCompanyRows = rows.filter(row => !row.company || row.company.trim() === '');
            if (nullCompanyRows.length > 0 && company !== '默认公司') {
                let ids = nullCompanyRows.map(row => row.id).join(',');
                let updateSql = `UPDATE order_table SET company = '${company}' WHERE id IN (${ids})`;

                db.query(updateSql, function(updateErr, updateResult) {
                    if (!updateErr) {
                        console.log(`更新了 ${updateResult.affectedRows} 条记录的company字段`);
                    }
                });
            }
        }

        res.json({
            success: true,
            data: rows || [],
            message: '获取成功'
        });

        console.log("=== /select 结束 ===");
    });
});
// 查询状态桌位
// router.post('/selectnum', function (req, res) {
//     let zt = req.body.zt;
//     let token = req.headers['x-token'] || req.body.token || localStorage.getItem("token");
//
//     // 获取公司信息
//     let company = '';
//     if (token) {
//         try {
//             let key = '123456789abcdefg';
//             let iv = 'abcdefg123456789';
//             let data = JSON.parse(decrypt(key, iv, token));
//             let value = Object.values(data);
//             company = value[0] || '';
//         } catch (e) {
//             console.log('获取公司信息失败，使用默认条件:', e);
//         }
//     }
//
//     let sql = '';
//     if (zt == "") {
//         if (company && company.trim() !== '') {
//             sql = `SELECT id, zh, zx, zt, sj, bm, company FROM order_table WHERE company = '${company}'`;
//         } else {
//             sql = `SELECT id, zh, zx, zt, sj, bm, company FROM order_table`;
//         }
//     } else {
//         if (company && company.trim() !== '') {
//             sql = `SELECT id, zh, zx, zt, sj, bm, company FROM order_table WHERE zt = '${zt}' AND company = '${company}'`;
//         } else {
//             sql = `SELECT id, zh, zx, zt, sj, bm, company FROM order_table WHERE zt = '${zt}'`;
//         }
//     }
//
//     console.log('查询SQL:', sql);
//
//     db.query(sql, function (err, rows) {
//         if (err) {
//             console.error('数据库错误:', err);
//             return res.status(500).json({
//                 success: false,
//                 message: '数据库查询失败',
//                 error: err.message
//             });
//         }
//
//         console.log('数据库返回结果数量:', rows.length);
//
//         res.json({
//             success: true,
//             data: rows,
//             message: '获取桌位列表成功'
//         });
//     });
// });
router.post('/selectnum', function (req, res) {
    let zt = req.body.zt;

    // 获取当前公司
    let company = getCurrentCompany(req);
    console.log("当前公司:", company, "状态:", zt);

    let sql = '';
    if (zt == "" || !zt) {
        // 查询当前公司或company为空的记录
        sql = `SELECT id, zh, zx, zt, sj, bm, company 
               FROM order_table 
               WHERE (company = '${company}' OR company IS NULL OR company = '')`;
    } else {
        sql = `SELECT id, zh, zx, zt, sj, bm, company 
               FROM order_table 
               WHERE zt = '${zt}' 
               AND (company = '${company}' OR company IS NULL OR company = '')`;
    }

    console.log('查询SQL:', sql);

    db.query(sql, function (err, rows) {
        if (err) {
            console.error('数据库错误:', err);
            return res.status(500).json({
                success: false,
                message: '数据库查询失败',
                error: err.message
            });
        }

        console.log('查询到记录数:', rows.length);

        res.json({
            success: true,
            data: rows,
            message: '获取桌位列表成功'
        });
    });
});
// router.post('/selectsea', function (req, res) {
//     let zh = req.body.zh;
//     let token = req.headers['x-token'] || req.body.token || localStorage.getItem("token");
//
//     // 获取公司信息
//     let company = '';
//     if (token) {
//         try {
//             let key = '123456789abcdefg';
//             let iv = 'abcdefg123456789';
//             let data = JSON.parse(decrypt(key, iv, token));
//             let value = Object.values(data);
//             company = value[0] || '';
//         } catch (e) {
//             console.log('获取公司信息失败，使用默认条件:', e);
//         }
//     }
//
//     // 构建SQL，根据是否有company条件来决定查询
//     let sql = '';
//     if (company && company.trim() !== '') {
//         sql = `SELECT id, zh, zx, zt, sj, bm, company FROM order_table WHERE zh LIKE '%${zh}%' AND company = '${company}'`;
//     } else {
//         sql = `SELECT id, zh, zx, zt, sj, bm, company FROM order_table WHERE zh LIKE '%${zh}%'`;
//     }
//
//     console.log('查询SQL:', sql);
//
//     db.query(sql, function (err, rows) {
//         if (err) {
//             console.error('数据库错误:', err);
//             return res.status(500).json({
//                 success: false,
//                 message: '数据库查询失败',
//                 error: err.message
//             });
//         }
//
//         console.log('数据库返回结果数量:', rows.length);
//
//         res.json({
//             success: true,
//             data: rows,
//             message: '获取桌位列表成功'
//         });
//     });
// });
router.post('/selectsea', function (req, res) {
    let zh = req.body.zh;
    console.log("查询桌位，桌号:", zh);

    // 获取当前公司
    let company = getCurrentCompany(req);
    console.log("当前公司:", company);

    // ✅ 关键修改：放宽查询条件
    // 1. 先查询当前公司的数据
    // 2. 如果没有，查询company为空的数据
    let sql = `SELECT id, zh, zx, zt, sj, bm, company 
               FROM order_table 
               WHERE zh LIKE '%${zh}%' 
               AND (company = '${company}' OR company IS NULL OR company = '')`;

    console.log('查询SQL:', sql);

    db.query(sql, function (err, rows) {
        if (err) {
            console.error('数据库错误:', err);
            return res.status(500).json({
                success: false,
                message: '数据库查询失败',
                error: err.message
            });
        }

        console.log('查询到记录数:', rows.length);

        if (rows.length > 0) {
            // ✅ 如果找到数据但company为空，更新它
            let tableData = rows[0];
            if ((!tableData.company || tableData.company.trim() === '') && company !== '默认公司') {
                let updateSql = `UPDATE order_table 
                                SET company = '${company}' 
                                WHERE zh LIKE '%${zh}%' 
                                AND (company IS NULL OR company = '')`;

                db.query(updateSql, function(updateErr, updateResult) {
                    if (!updateErr && updateResult.affectedRows > 0) {
                        console.log('更新桌位company字段成功');
                        tableData.company = company;
                    }
                });
            }
        }

        res.json({
            success: true,
            data: rows,
            message: '获取桌位列表成功'
        });
    });
});

router.post('/selectdanhao', function (req, res) {

    let ddid = req.body.ddid;
    var sql = `SELECT od.*,p.id as product_id, p.price as current_price FROM orders_details od INNER JOIN product p ON od.cpmc = p.product_name WHERE od.ddid LIKE '%${ddid}%' AND (od.zt IS NULL OR od.zt = '2')`;

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
// 安排入座 - 简化版
// router.post('/updatetale', function (req, res) {
//     console.log("=== /updatetale 开始 ===");
//
//     try {
//         let zh = req.body.zh;
//         console.log("接收到的桌位号:", zh);
//
//         if (!zh) {
//             console.log("错误：桌位号为空");
//             return res.json({
//                 success: false,
//                 message: '桌位编号不能为空'
//             });
//         }
//
//         // 简化的SQL，不检查company
//         let sql = `UPDATE order_table SET zt = '3' WHERE zh = '${zh}'`;
//         console.log("执行SQL:", sql);
//
//         db.query(sql, function (err, result) {
//             if (err) {
//                 console.error('数据库错误:', err.message);
//                 return res.json({
//                     success: false,
//                     message: '更新失败: ' + err.message
//                 });
//             }
//
//             console.log("更新成功，影响行数:", result.affectedRows);
//
//             res.json({
//                 success: true,
//                 message: '安排入座成功',
//                 affectedRows: result.affectedRows
//             });
//
//             console.log("=== /updatetale 结束 ===");
//         });
//
//     } catch (error) {
//         console.error('服务器错误:', error);
//         res.json({
//             success: false,
//             message: '服务器错误: ' + error.message
//         });
//     }
// });
router.post('/updatetale', function (req, res) {
    let zh = req.body.zh;

    // 获取当前公司
    let company = getCurrentCompany(req);
    console.log("安排入座，桌位:", zh, "公司:", company);

    // ✅ 更新条件：匹配桌号，并且company匹配或为空
    let sql = `UPDATE order_table 
               SET zt = '3' 
               WHERE zh LIKE '%${zh}%' 
               AND (company = '${company}' OR company IS NULL OR company = '')`;

    console.log("执行SQL:", sql);

    db.query(sql, function (err, result) {
        if (err) {
            console.error('数据库错误:', err.message);
            return res.json({
                success: false,
                message: '更新失败: ' + err.message
            });
        }

        console.log("更新成功，影响行数:", result.affectedRows);

        res.json({
            success: true,
            message: '安排入座成功',
            affectedRows: result.affectedRows
        });
    });
});
// router.post('/updatetale1', function (req, res) {
//     console.log("=== /updatetale1 开始 ===");
//
//     try {
//         let zh = req.body.zh;
//         console.log("接收到的桌位号:", zh);
//
//         if (!zh) {
//             return res.json({
//                 success: false,
//                 message: '桌位编号不能为空'
//             });
//         }
//
//         // 简化的SQL
//         let sql = `UPDATE order_table SET zt = '1', sj = NULL, bm = NULL WHERE zh LIKE '%${zh}%'`;
//         console.log("执行SQL:", sql);
//
//         db.query(sql, function (err, result) {
//             if (err) {
//                 console.error('数据库错误:', err.message);
//                 return res.json({
//                     success: false,
//                     message: '更新失败: ' + err.message
//                 });
//             }
//
//             console.log("更新成功，影响行数:", result.affectedRows);
//
//             res.json({
//                 success: true,
//                 message: '桌位状态更新成功',
//                 affectedRows: result.affectedRows
//             });
//         });
//
//     } catch (error) {
//         console.error('服务器错误:', error);
//         res.json({
//             success: false,
//             message: '服务器错误: ' + error.message
//         });
//     }
// });
router.post('/updatetale1', function (req, res) {
    let zh = req.body.zh;

    // 获取当前公司
    let company = getCurrentCompany(req);
    console.log("清空桌位，桌位:", zh, "公司:", company);

    let sql = `UPDATE order_table 
               SET zt = '1', sj = NULL, bm = NULL 
               WHERE zh LIKE '%${zh}%' 
               AND (company = '${company}' OR company IS NULL OR company = '')`;

    console.log("执行SQL:", sql);

    db.query(sql, function (err, result) {
        if (err) {
            console.error('数据库错误:', err.message);
            return res.json({
                success: false,
                message: '更新失败: ' + err.message
            });
        }

        console.log("更新成功，影响行数:", result.affectedRows);

        res.json({
            success: true,
            message: '桌位状态更新成功',
            affectedRows: result.affectedRows
        });
    });
});
// router.post('/updatetaleall1', function (req, res) {
//     // 获取公司信息
//     let company = '';
//     try {
//         let token = localStorage.getItem("token");
//         if (token) {
//             let key = '123456789abcdefg';
//             let iv = 'abcdefg123456789';
//             let data = JSON.parse(decrypt(key, iv, token));
//             let value = Object.values(data);
//             company = value[0] || '';
//         }
//     } catch (e) {
//         console.log('获取公司信息失败:', e);
//     }
//
//     // 直接更新所有记录的zt值为1
//     var sql = '';
//     if (company && company.trim() !== '') {
//         sql = `UPDATE order_table SET zt = 1, sj = NULL, bm = NULL WHERE company = '${company}'`;
//     } else {
//         sql = `UPDATE order_table SET zt = 1, sj = NULL, bm = NULL`;
//     }
//
//     console.log("执行SQL:", sql);
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
//         console.log('成功更新记录数:', result.affectedRows);
//
//         res.json({
//             success: true,
//             message: '所有桌位状态已更新为1',
//             affectedRows: result.affectedRows
//         });
//     });
// });
router.post('/updatetaleall1', function (req, res) {
    // 获取当前公司
    let company = getCurrentCompany(req);
    console.log("清空所有桌位，公司:", company);

    let sql = `UPDATE order_table 
               SET zt = 1, sj = NULL, bm = NULL 
               WHERE company = '${company}' OR company IS NULL OR company = ''`;

    console.log("执行SQL:", sql);

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
// router.post('/updatetale2', function (req, res) {
//     let zh = req.body.zh;
//     let sj = req.body.sj;
//
//     // 参数验证
//     if (!zh) {
//         return res.status(400).json({
//             success: false,
//             message: '桌位编号(zh)不能为空'
//         });
//     }
//
//     // 获取公司信息
//     let company = '';
//     try {
//         let token = localStorage.getItem("token");
//         if (token) {
//             let key = '123456789abcdefg';
//             let iv = 'abcdefg123456789';
//             let data = JSON.parse(decrypt(key, iv, token));
//             let value = Object.values(data);
//             company = value[0] || '';
//         }
//     } catch (e) {
//         console.log('获取公司信息失败:', e);
//     }
//
//     // ✅ 修复这里：使用数字状态 '2'，而不是中文字符
//     var sql = `UPDATE order_table SET zt = '2', sj = '${sj}' WHERE zh LIKE '%${zh}%' AND company = '${company}'`;
//
//     console.log("执行SQL:", sql);
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
//         console.log('成功更新记录数:', result.affectedRows);
//
//         res.json({
//             success: true,
//             message: '桌位状态更新成功',
//             affectedRows: result.affectedRows
//         });
//     });
// });
router.post('/updatetale2', function (req, res) {
    let zh = req.body.zh;
    let sj = req.body.sj;

    if (!zh) {
        return res.status(400).json({
            success: false,
            message: '桌位编号(zh)不能为空'
        });
    }

    // 获取当前公司
    let company = getCurrentCompany(req);
    console.log("预约桌位，桌位:", zh, "时间:", sj, "公司:", company);

    let sql = `UPDATE order_table 
               SET zt = '2', sj = '${sj}' 
               WHERE zh LIKE '%${zh}%' 
               AND (company = '${company}' OR company IS NULL OR company = '')`;

    console.log("执行SQL:", sql);

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
//     // 获取公司信息
//     let company = '';
//     try {
//         let token = localStorage.getItem("token");
//         if (token) {
//             let key = '123456789abcdefg';
//             let iv = 'abcdefg123456789';
//             let data = JSON.parse(decrypt(key, iv, token));
//             let value = Object.values(data);
//             company = value[0] || '';
//         }
//     } catch (e) {
//         console.log('获取公司信息失败:', e);
//     }
//
//     // ✅ 修复这里：使用数字状态 '3'，而不是中文字符
//     var sql = `UPDATE order_table SET zt = '3', bm = '${dh}' WHERE zh LIKE '%${zh}%' AND company = '${company}'`;
//
//     console.log("执行SQL:", sql);
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
//         console.log('成功更新记录数:', result.affectedRows);
//
//         res.json({
//             success: true,
//             message: '桌位状态更新成功',
//             affectedRows: result.affectedRows
//         });
//     });
// });
router.post('/uptabletables', function (req, res) {
    let dh = req.body.dh;
    let zh = req.body.zh;

    if (!zh) {
        return res.status(400).json({
            success: false,
            message: '桌位编号(zh)不能为空'
        });
    }

    // 获取当前公司
    let company = getCurrentCompany(req);
    console.log("绑定订单，桌位:", zh, "订单号:", dh, "公司:", company);

    // ✅ 先更新company字段，再设置状态和订单号
    let sql = `UPDATE order_table 
               SET company = '${company}', 
                   zt = '3', 
                   bm = '${dh}' 
               WHERE zh LIKE '%${zh}%' 
               AND (company = '${company}' OR company IS NULL OR company = '')`;

    console.log("执行SQL:", sql);

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
            message: '桌位状态和订单号更新成功',
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
//-------------------------------------------------------------------
// 检查单个桌位是否有未结算订单
// router.post('/checkUnpaidOrder', function (req, res) {
//     console.log("=== /checkUnpaidOrder 开始 ===");
//
//     try {
//         let zh = req.body.zh;
//         console.log("接收到的桌位号:", zh);
//
//         if (!zh) {
//             return res.json({
//                 success: false,
//                 message: '桌位编号不能为空'
//             });
//         }
//
//         // 简化的查询逻辑
//         let sql = `SELECT bm FROM order_table WHERE zh LIKE '%${zh}%'`;
//         console.log("执行SQL:", sql);
//
//         db.query(sql, function (err, rows) {
//             if (err) {
//                 console.error('数据库错误:', err.message);
//                 return res.json({
//                     success: false,
//                     message: '查询失败: ' + err.message,
//                     hasUnpaid: false
//                 });
//             }
//
//             console.log("查询结果:", rows);
//
//             if (rows.length === 0 || !rows[0].bm) {
//                 return res.json({
//                     success: true,
//                     hasUnpaid: false,
//                     ddid: '',
//                     message: '该桌位没有订单'
//                 });
//             }
//
//             let ddid = rows[0].bm;
//
//             res.json({
//                 success: true,
//                 hasUnpaid: false, // 默认返回false，简化逻辑
//                 ddid: ddid,
//                 message: '查询成功'
//             });
//         });
//
//     } catch (error) {
//         console.error('服务器错误:', error);
//         res.json({
//             success: false,
//             message: '服务器错误: ' + error.message,
//             hasUnpaid: false
//         });
//     }
// });
// 检查单个桌位是否有未结算订单
router.post('/checkUnpaidOrder', function (req, res) {
    let zh = req.body.zh;

    console.log("=== /checkUnpaidOrder 开始 ===");
    console.log("接收到的桌位号:", zh);

    if (!zh) {
        console.log("错误：桌位号为空");
        return res.json({
            success: false,
            message: '桌位编号不能为空',
            hasUnpaid: false
        });
    }

    // 获取当前公司
    let company = getCurrentCompany(req);
    console.log("检查未结算订单，桌位:", zh, "公司:", company);

    // 1. 先查询桌位信息
    let sql1 = `SELECT bm, zt FROM order_table 
               WHERE zh LIKE '%${zh}%' 
               AND (company = '${company}' OR company IS NULL OR company = '')
               LIMIT 1`;

    console.log("执行SQL1（查询桌位）:", sql1);

    db.query(sql1, function (err, rows) {
        if (err) {
            console.error('数据库错误:', err.message);
            return res.json({
                success: false,
                message: '查询失败: ' + err.message,
                hasUnpaid: false
            });
        }

        console.log("桌位查询结果:", rows);

        if (rows.length === 0) {
            // 没有找到桌位
            console.log("未找到桌位记录");
            return res.json({
                success: true,
                hasUnpaid: false,
                ddid: '',
                message: '该桌位不存在'
            });
        }

        let tableData = rows[0];
        let ddid = tableData.bm;
        let tableStatus = tableData.zt;

        console.log("桌位信息:", {
            "订单号": ddid,
            "桌位状态": tableStatus,
            "状态说明": tableStatus === '1' ? '空闲' : tableStatus === '2' ? '已预订' : tableStatus === '3' ? '已占用' : '未知'
        });

        // 检查是否有订单号
        if (!ddid || ddid === 'null' || ddid.trim() === '') {
            console.log("桌位没有订单号");
            return res.json({
                success: true,
                hasUnpaid: false,
                ddid: '',
                message: '该桌位没有订单'
            });
        }

        console.log("发现订单号:", ddid);

        // 2. 检查这个订单在orders_details表中是否已结算
        let sql2 = `SELECT COUNT(*) as count, 
                           MAX(zt) as order_status,
                           SUM(zhje) as total_amount
                    FROM orders_details 
                    WHERE ddid LIKE '%${ddid}%'`;

        console.log("执行SQL2（查询订单详情）:", sql2);

        db.query(sql2, function (err2, result2) {
            if (err2) {
                console.error('查询订单详情失败:', err2.message);
                return res.json({
                    success: false,
                    message: '查询订单详情失败: ' + err2.message,
                    hasUnpaid: false,
                    ddid: ddid
                });
            }

            console.log("订单详情查询结果:", result2);

            if (result2.length === 0) {
                console.log("订单详情表中没有找到该订单");
                return res.json({
                    success: true,
                    hasUnpaid: false,
                    ddid: ddid,
                    message: '订单详情表中没有找到记录'
                });
            }

            let orderCount = result2[0].count;
            let orderStatus = result2[0].order_status;
            let totalAmount = result2[0].total_amount || 0;

            console.log("订单统计:", {
                "商品数量": orderCount,
                "订单状态": orderStatus,
                "订单状态说明": orderStatus === '2' ? '挂账' : orderStatus === null ? '已结算' : '其他',
                "总金额": totalAmount
            });

            // 判断是否有未结算订单
            // 如果订单状态为 '2'（挂账），则表示有未结算订单
            // 如果订单状态为 NULL，则表示已结算
            let hasUnpaid = (orderStatus === '2'); // 状态2表示挂账

            console.log("未结算判断结果:", hasUnpaid ? "有未结算订单" : "已结算或无未结算订单");

            // 3. 如果是已占用的桌位但没有订单详情，也视为有未结算
            if (tableStatus === '3' && orderCount === 0) {
                console.log("桌位状态为已占用，但没有订单详情，视为有未结算");
                hasUnpaid = true;
            }

            res.json({
                success: true,
                hasUnpaid: hasUnpaid,
                ddid: ddid,
                tableStatus: tableStatus,
                orderStatus: orderStatus,
                totalAmount: totalAmount,
                itemCount: orderCount,
                message: hasUnpaid ? '该桌位有未结算订单' : '该桌位已结算或无未结算订单'
            });

            console.log("=== /checkUnpaidOrder 结束 ===");
        });
    });
});
// 检查所有桌位是否有未结算订单
router.post('/checkAllUnpaid', function (req, res) {
    // 查询所有有消费单号的桌位
    let sql1 = `SELECT bm FROM order_table WHERE bm IS NOT NULL`;

    db.query(sql1, function (err, rows) {
        if (err) {
            console.error('数据库错误:', err);
            return res.status(500).json({
                success: false,
                message: '查询桌位信息失败',
                error: err.message
            });
        }

        if (rows.length === 0) {
            // 如果没有桌位有消费单号
            return res.json({
                success: true,
                hasUnpaid: false,
                message: '没有桌位有未结算订单'
            });
        }

        // 收集所有消费单号
        let ddids = rows.map(row => row.bm).filter(Boolean);

        if (ddids.length === 0) {
            return res.json({
                success: true,
                hasUnpaid: false,
                message: '没有消费单号需要检查'
            });
        }

        // 构建查询条件
        let conditions = ddids.map(ddid => `ddid LIKE '%${ddid}%'`).join(' OR ');

        // 检查orders_details表中是否有未结算的订单
        let sql2 = `SELECT COUNT(DISTINCT ddid) as count FROM orders_details WHERE (${conditions}) AND zt IS NOT NULL`;

        db.query(sql2, function (err, result) {
            if (err) {
                console.error('数据库错误:', err);
                return res.status(500).json({
                    success: false,
                    message: '检查未结算订单失败',
                    error: err.message
                });
            }

            let hasUnpaid = result[0].count > 0;

            res.json({
                success: true,
                hasUnpaid: hasUnpaid,
                unpaidCount: result[0].count,
                message: hasUnpaid ? `有${result[0].count}个桌位未结算` : '所有桌位已结算'
            });
        });
    });
});
// 检查所有桌位是否有未结算订单
router.post('/checkAllUnpaid', function (req, res) {
    // 查询所有有消费单号的桌位
    let sql1 = `SELECT bm FROM order_table WHERE bm IS NOT NULL`;

    db.query(sql1, function (err, rows) {
        if (err) {
            console.error('数据库错误:', err);
            return res.status(500).json({
                success: false,
                message: '查询桌位信息失败',
                error: err.message
            });
        }

        if (rows.length === 0) {
            // 如果没有桌位有消费单号
            return res.json({
                success: true,
                hasUnpaid: false,
                message: '没有桌位有未结算订单'
            });
        }

        // 收集所有消费单号
        let ddids = rows.map(row => row.bm).filter(Boolean);

        if (ddids.length === 0) {
            return res.json({
                success: true,
                hasUnpaid: false,
                message: '没有消费单号需要检查'
            });
        }

        // 构建查询条件
        let conditions = ddids.map(ddid => `ddid LIKE '%${ddid}%'`).join(' OR ');

        // 检查orders_details表中是否有未结算的订单
        let sql2 = `SELECT COUNT(DISTINCT ddid) as count FROM orders_details WHERE (${conditions}) AND zt IS NOT NULL`;

        db.query(sql2, function (err, result) {
            if (err) {
                console.error('数据库错误:', err);
                return res.status(500).json({
                    success: false,
                    message: '检查未结算订单失败',
                    error: err.message
                });
            }

            let hasUnpaid = result[0].count > 0;

            res.json({
                success: true,
                hasUnpaid: hasUnpaid,
                unpaidCount: result[0].count,
                message: hasUnpaid ? `有${result[0].count}个桌位未结算` : '所有桌位已结算'
            });
        });
    });
});
//---------------------------------------------------------------

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

// 生成订单号接口
router.post('/generateOrderForTable', function (req, res) {
    console.log("开始生成订单号...");

    try {
        // 获取token（从请求头或localStorage）
        let token = req.headers['x-token'] || req.body.token || localStorage.getItem("token");

        if (!token) {
            console.log("未找到token");
            return res.status(401).json({
                success: false,
                message: '未登录，请重新登录'
            });
        }

        // 解密token获取公司信息
        let key = '123456789abcdefg';
        let iv = 'abcdefg123456789';
        let data;

        try {
            data = JSON.parse(decrypt(key, iv, token));
        } catch (e) {
            console.log("token解密失败:", e);
            // 如果解密失败，使用默认公司信息（用于测试）
            data = {
                company: '默认公司',
                account: 'test'
            };
        }

        let value = Object.values(data);
        let company = value[0] || 'DEFAULT_COMPANY';
        let account = value[1] || 'admin';

        console.log("公司信息:", company, "账号:", account);

        // 生成订单号
        var now = new Date();
        var year = now.getFullYear();
        var month = (now.getMonth() + 1).toString().padStart(2, '0');
        var day = now.getDate().toString().padStart(2, '0');
        var hour = now.getHours().toString().padStart(2, '0');
        var minute = now.getMinutes().toString().padStart(2, '0');
        var second = now.getSeconds().toString().padStart(2, '0');
        var millisecond = now.getMilliseconds().toString().padStart(3, '0');

        // 生成随机数（3位）
        var randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

        // 订单号格式：年月日时分秒毫秒 + 随机数
        var orderNumber = year + month + day + hour + minute + second + millisecond + randomNum;

        console.log("生成的订单号:", orderNumber);

        // 可选：保存订单到数据库
        var today = year + "-" + month + "-" + day;
        var insertSql = `INSERT INTO orders (riqi, ddh, company, syy, create_time) 
                        VALUES ('${today}', '${orderNumber}', '${company}', '${account}', NOW())`;

        db.query(insertSql, function (err, result) {
            if (err) {
                console.log("插入订单记录失败（不影响订单号生成）:", err);
                // 即使插入失败也返回订单号
            } else {
                console.log("订单记录创建成功，ID:", result.insertId);
            }

            res.json({
                success: true,
                orderNo: orderNumber,
                message: '订单号生成成功'
            });
        });

    } catch (e) {
        console.error('生成订单号异常:', e);

        // 生成备用订单号（即使出错也要返回一个订单号）
        var backupOrderNo = 'BK' + Date.now() + Math.floor(Math.random() * 1000);

        res.json({
            success: true,
            orderNo: backupOrderNo,
            message: '订单号生成成功（备用）'
        });
    }
});

// 更新桌位并绑定订单号接口
router.post('/updatetablewithorder', function (req, res) {
    console.log("更新桌位订单号...");

    let zh = req.body.zh;
    let bm = req.body.bm;
    let token = req.headers['x-token'] || req.body.token || localStorage.getItem("token");

    console.log("桌位号:", zh, "订单号:", bm);

    if (!zh) {
        return res.status(400).json({
            success: false,
            message: '桌位编号不能为空'
        });
    }

    if (!bm) {
        return res.status(400).json({
            success: false,
            message: '订单号不能为空'
        });
    }

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
            console.log('获取公司信息失败，使用默认条件:', e);
        }
    }

    // 构建SQL - 更新桌位状态为3（已占用）并设置订单号和公司
    let sql = `UPDATE order_table SET zt = '3', bm = '${bm}', company = '${company}', sj = NULL, update_time = NOW() WHERE zh LIKE '%${zh}%'`;

    if (company) {
        sql += ` AND company = '${company}'`;
    }

    console.log("执行SQL:", sql);

    db.query(sql, function (err, result) {
        if (err) {
            console.error('数据库错误:', err);
            return res.status(500).json({
                success: false,
                message: '更新桌位失败',
                error: err.message
            });
        }

        console.log('影响行数:', result.affectedRows);

        if (result.affectedRows === 0) {
            // 如果没有更新到记录，尝试插入新记录（如果桌位不存在）
            let insertSql = `INSERT INTO order_table (zh, zt, bm, company, create_time) 
                           VALUES ('${zh}', '3', '${bm}', '${company}', NOW())`;

            db.query(insertSql, function (insertErr, insertResult) {
                if (insertErr) {
                    console.error('插入桌位记录失败:', insertErr);
                    return res.status(500).json({
                        success: false,
                        message: '桌位不存在且创建失败',
                        error: insertErr.message
                    });
                }

                console.log('创建新桌位记录成功');
                return res.json({
                    success: true,
                    message: '桌位创建并绑定订单号成功',
                    affectedRows: insertResult.affectedRows,
                    isNew: true
                });
            });
        } else {
            res.json({
                success: true,
                message: '桌位状态和订单号更新成功',
                affectedRows: result.affectedRows,
                isNew: false
            });
        }
    });
});
// 在order_table.js中添加标记所有订单为已结算的接口
router.post('/markAllPaid', function (req, res) {
    console.log("=== 标记所有订单为已结算 ===");

    // 1. 获取所有有订单号的桌位
    let sql1 = `SELECT DISTINCT bm FROM order_table WHERE bm IS NOT NULL AND bm != ''`;

    db.query(sql1, function (err, rows) {
        if (err) {
            console.error('查询订单失败:', err);
            return res.json({ success: false, message: '查询失败' });
        }

        if (rows.length === 0) {
            return res.json({ success: true, message: '没有需要结算的订单' });
        }

        // 2. 收集所有订单号
        let orderNumbers = rows.map(row => row.bm);

        // 3. 标记这些订单为已结算（zt设为NULL）
        let sql2 = `UPDATE orders_details SET zt = NULL WHERE ddid IN (?)`;

        db.query(sql2, [orderNumbers], function (err, result) {
            if (err) {
                console.error('更新订单状态失败:', err);
                return res.json({ success: false, message: '更新失败' });
            }

            console.log('已结算订单数量:', result.affectedRows);

            res.json({
                success: true,
                message: `已标记 ${orderNumbers.length} 个订单为已结算`,
                affectedRows: result.affectedRows
            });
        });
    });
});

// 获取桌位订单号的接口
router.post('/getTableOrder', function (req, res) {
    let zh = req.body.zh;

    console.log("获取桌位订单，桌位号:", zh);

    if (!zh) {
        return res.json({
            success: false,
            message: '桌位号不能为空'
        });
    }

    // 查询桌位绑定的订单号
    let sql = `SELECT bm FROM order_table WHERE zh LIKE '%${zh}%' LIMIT 1`;

    db.query(sql, function (err, rows) {
        if (err) {
            console.error('查询失败:', err);
            return res.json({
                success: false,
                message: '查询失败'
            });
        }

        if (rows.length === 0 || !rows[0].bm) {
            return res.json({
                success: false,
                message: '该桌位没有订单'
            });
        }

        res.json({
            success: true,
            orderNo: rows[0].bm,
            message: '获取订单成功'
        });
    });
});

module.exports = router;