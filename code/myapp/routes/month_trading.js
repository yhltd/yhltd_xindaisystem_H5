let express = require('express');
let router = express.Router();
//引入数据库包
let db = require("./db.js");
let nodeExcel = require('excel-export');

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
 * 查询列表页
 */
router.get('/select', function (req, res, next) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    if (data.table["3"].sel == 1) {
        //res.render('../views/month_trading/month_trading_select.html');
        res.redirect('/month_trading/ass');
    } else {
        res.render('me.html', {title: 'ExpressTitle', msg: '无权限查看'});
    }
});

// router.all('/ass', function (req, res, next) {
//     let token = localStorage.getItem("token")
//     let key = '123456789abcdefg';
//     console.log('加密的key:', key);
//     let iv = 'abcdefg123456789';
//     //console.log('加密的iv:', iv);
//     let data = JSON.parse(decrypt(key, iv, token));
//     let value = Object.values(data);
//     let company = value[0];
//     company = toLiteral(company);
//     //let company = req.cookies.company
//     let isSelect = req.query.pagenum == undefined;
//     let selectParams = {
//         recipient: '',
//         cardholder: '',
//         drawee: '',
//         date1: '',
//         d1:false,
//         date2:'',
//         d2:false
//     }
//     console.log('isSelect:', isSelect);
//
//     if (isSelect) {
//         selectParams.recipient = req.body.recipient;
//         selectParams.cardholder = req.body.cardholder;
//         selectParams.drawee = req.body.drawee;
//         selectParams.date1 = req.body.date1;
//         selectParams.date2 = req.body.date2;
//
//         //console.log("selectParams.date1--->" + selectParams.date1)
//         localStorage.setItem("selectParams", JSON.stringify(selectParams))
//     } else {
//         selectParams = JSON.parse(localStorage.getItem("selectParams"));
//     }
//
//     console.log("selectParams.date1=>",selectParams.date1);
//     console.log("selectParams.date2=>",selectParams.date2);
//     if (selectParams.recipient == undefined) {
//         selectParams.recipient = "";
//     }
//     if (selectParams.cardholder == undefined) {
//         selectParams.cardholder = "";
//     }
//     if (selectParams.drawee == undefined) {
//         selectParams.drawee = "";
//     }
//     // if(selectParams.date1== undefined && selectParams.date2== undefined){
//     //     let myDate = new Date();
//     //     console.log("mydate" + myDate)
//     //     let n = myDate.getFullYear();
//     //     let y = myDate.getMonth() + 1
//     //     console.log("y=>" + y)
//     //     let r = myDate.getDate();
//     //     let date = n + "-" + (y < 10 ? '0' + y : y) + "-" + (r < 10 ? '0' + r : r);
//     //     selectParams.date1 = date;
//     //     selectParams.date2 = date;
//     //     selectParams.d1 = true;
//     //     selectParams.d2 = true;
//     // }
//
//     if(selectParams.date1== undefined || selectParams.date1 == ""){
//          selectParams.d1 = true;
//          selectParams.date1 ="1900-01-01";
//         // let myDate = new Date();
//         // console.log("mydate" + myDate)
//         // let n = myDate.getFullYear();
//         // let y = myDate.getMonth() + 1
//         // console.log("y=>" + y)
//         // let r = myDate.getDate();
//         // let x = myDate.getHours();
//         // let f = myDate.getMinutes();
//         // selectParams.d1 = true
//         // let date1 = n + "-" + (y < 10 ? '0' + y : y) + "-" + "01";
//         // selectParams.date1 = date1;
//     }
//     if(selectParams.date2== undefined || selectParams.date2 == ""){
//         let myDate = new Date();
//         console.log("mydate" + myDate)
//         let n = myDate.getFullYear();
//         let y = myDate.getMonth() + 1
//         console.log("y=>" + y)
//         let r = myDate.getDate();
//         let x = myDate.getHours();
//         let f = myDate.getMinutes();
//         let date2 = n + "-" + (y < 10 ? '0' + y : y) + "-" + (r < 10 ? '0' + r : r);
//         selectParams.d2 = true;
//         selectParams.date2 = date2;
//         console.log("selectParams.date2=>",selectParams.date2);
//         // let r = myDate.getDate();
//         // switch (y)
//         // {
//         //     case 1,3,5,7,8,10,12:
//         //         r = "31";
//         //         break;
//         //     case 4,6,9,11:
//         //         r = "30";
//         //         break;
//         //     default:
//         //         //2月
//         //         if (DateTime.IsLeapYear(DateTime.Now.Year))
//         //             r = "29";
//         //         else
//         //             r ="28";
//         //         break;
//         // }
//         selectParams.d2 = true;
//         // let date2 = n + "-" + (y < 10 ? '0' + y : y) + "-" + r;
//         selectParams.date2 = date2;
//         console.log("selectParams.date2=>",selectParams.date2);
//     }
//     selectParams.recipient = toLiteral(selectParams.recipient);
//     selectParams.cardholder = toLiteral(selectParams.cardholder);
//     selectParams.drawee = toLiteral(selectParams.drawee);
//     localStorage.setItem('selectParams', JSON.stringify(selectParams));
//     let whereSql = " where a.id=b.id and a.gongsi = '" + company + "' and recipient like '%" + selectParams.recipient + "%' and cardholder like '%" + selectParams.cardholder + "%' and drawee like '%" + selectParams.drawee + "%' and a.date_time  >= '"+ selectParams.date1 + "' and a.date_time <= '"+ selectParams.date2 +"' ";
//
//     let sql1 = " select a.id " +
//         "from day_trading as a,customer as b " + whereSql;
//     sql1 += "group by b.id";
//     let sql2 = "select Count(c.id) as count from ( " + sql1 + ") as c"
//
//     //console.log("sql1=>",sql2)
//     db.query(sql2, function (err, rows) {
//         try {
//             if (err) {
//                 console.log(err);
//             } else {
//                 let value = rows;
//                 let result = {
//                     datas: [],
//                     rowcounts: 0,
//                     pagecounts: 0,
//                     pagenum: 0,
//                     pageSize: 10,
//                     msg: '',
//                     recipient:selectParams.recipient,
//                     cardholder:selectParams.cardholder,
//                     drawee:selectParams.drawee
//                     // date1:selectParams.date1,
//                     // date2:selectParams.date2
//                 }
//                 //console.log("isSelect=>",isSelect)
//                 if (isSelect) {
//                     result.rowcounts = value[0].count
//                     result.pagecounts = Math.ceil(result.rowcounts / result.pageSize)
//                     result.pagenum = 1
//                 } else {
//                     result.rowcounts = value[0].count
//                     result.pagecounts = Math.ceil(result.rowcounts / result.pageSize)
//                     result.pagenum = parseInt(req.query.pagenum <= 0 ? 1 : req.query.pagenum >= result.pagecounts ? result.pagecounts : req.query.pagenum);
//                 }
//                 if (result.rowcounts == 0) {
//                     result.msg = '没有查到相关信息'
//                 }
//                 let sql = "select b.*,sum(a.repayment) as repayment,sum(a.swipe) as swipe," +
//                     "sum(a.repayment)-sum(a.swipe) as balance_of_credit_card," +
//                     "sum(a.basics_service_charge)+sum(a.other_service_charge) as the_total_fee," +
//                     "sum(a.swipe)*(b.service_charge)+sum(a.repayment)-sum(a.swipe) as collected_amount," +
//                     "sum(a.swipe)*(b.service_charge)-sum(a.basics_service_charge)+sum(a.other_service_charge) as profit " +
//                     "from day_trading as a,customer as b " + whereSql;
//
//                 sql += " group by b.id ";
//                 sql += "limit " + (result.pagenum - 1) * result.pageSize + "," + result.pageSize;
//
//                 console.log("sql-->"+sql)
//                 db.query(sql, function (err, rows) {
//                     if (err) {
//                         res.render('../views/month_trading/month_trading_select.html', {title: 'Express', ...result});
//                     } else {
//                         result.datas = rows
//                         //console.log("result=>",result)
//                         res.render('../views/month_trading/month_trading_select.html', {
//                             title: 'Express',
//                             date1: selectParams.d1 ? '' : selectParams.date1,
//                             date2: selectParams.d2 ? '' : selectParams.date2,
//                             ...result
//                         });
//                     }
//                 })
//                 let sql3 = JSON.stringify(sql);
//                 let sql4 = JSON.parse(sql3);
//                 console.log("sql4-->"+sql4);
//             }
//         } catch (e) {
//             res.render("error.html", {error: '网络错误，请稍后再试'})
//         }
//     });
//
//
// });
router.all('/ass', function (req, res, next) {
    let token = localStorage.getItem("token");
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    let value = Object.values(data);
    let company = value[0];
    company = toLiteral(company);

    let isSelect = req.query.pagenum == undefined;
    let selectParams = {
        recipient: '',
        cardholder: '',
        drawee: '',
        date1: '',
        date2: ''
    }

    console.log("请求方法:", req.method);
    console.log("请求参数 body:", req.body);
    console.log("请求参数 query:", req.query);

    // 从请求中获取筛选参数
    if (req.method === 'POST') {
        // 添加日期格式转换，横杠转斜杠
        let date1_input = req.body.date1 || '';
        let date2_input = req.body.date2 || '';

        // 如果有提交的特殊格式字段（从前端隐藏字段传来的）
        if (req.body.date1_sql) {
            selectParams.date1 = req.body.date1_sql;
        } else if (date1_input.includes('-')) {
            // 将横杠格式转为斜杠格式
            selectParams.date1 = date1_input.replace(/-/g, '/');
        } else {
            selectParams.date1 = date1_input;
        }

        if (req.body.date2_sql) {
            selectParams.date2 = req.body.date2_sql;
        } else if (date2_input.includes('-')) {
            // 将横杠格式转为斜杠格式
            selectParams.date2 = date2_input.replace(/-/g, '/');
        } else {
            selectParams.date2 = date2_input;
        }

        selectParams.recipient = req.body.recipient || '';
        selectParams.cardholder = req.body.cardholder || '';
        selectParams.drawee = req.body.drawee || '';
        isSelect = true;

        console.log('接收到的日期参数：', {
            'body.date1': req.body.date1,
            'body.date1_sql': req.body.date1_sql,
            '转换后.date1': selectParams.date1,
            'body.date2': req.body.date2,
            'body.date2_sql': req.body.date2_sql,
            '转换后.date2': selectParams.date2
        });
    }
    else if (req.method === 'GET') {
        if (isSelect) {
            // 初始GET请求可能有查询参数
            selectParams.recipient = req.query.recipient || '';
            selectParams.cardholder = req.query.cardholder || '';
            selectParams.drawee = req.query.drawee || '';
            selectParams.date1 = req.query.date1 || '';
            selectParams.date2 = req.query.date2 || '';

            // 转换GET请求中的日期格式（横杠转斜杠）
            if (selectParams.date1 && selectParams.date1.includes('-')) {
                selectParams.date1 = selectParams.date1.replace(/-/g, '/');
            }
            if (selectParams.date2 && selectParams.date2.includes('-')) {
                selectParams.date2 = selectParams.date2.replace(/-/g, '/');
            }
        } else {
            // 分页请求，从localStorage获取参数
            let savedParams = localStorage.getItem("selectParams");
            if (savedParams) {
                selectParams = JSON.parse(savedParams);

                // 确保存储的日期是斜杠格式
                if (selectParams.date1 && selectParams.date1.includes('-')) {
                    selectParams.date1 = selectParams.date1.replace(/-/g, '/');
                }
                if (selectParams.date2 && selectParams.date2.includes('-')) {
                    selectParams.date2 = selectParams.date2.replace(/-/g, '/');
                }
            }
        }
    }

    console.log("筛选参数:", selectParams);
    // 检查是否需要设置默认日期
    let needsDefaultDate = true;
    if (selectParams.date1 || selectParams.date2) {
        // 如果任何一个日期有值，就不设置默认值
        needsDefaultDate = false;
        console.log('用户指定了日期参数，不设置默认值');
    }

    // 保存到localStorage供分页使用
    localStorage.setItem("selectParams", JSON.stringify(selectParams));


// 构建WHERE条件
    let whereConditions = [
        "a.id = b.id",
        "a.gongsi = '" + company + "'"
    ];

// 添加文本搜索条件
    if (selectParams.recipient) {
        whereConditions.push("b.recipient like '%" + toLiteral(selectParams.recipient) + "%'");
    }
    if (selectParams.cardholder) {
        whereConditions.push("b.cardholder like '%" + toLiteral(selectParams.cardholder) + "%'");
    }
    if (selectParams.drawee) {
        whereConditions.push("b.drawee like '%" + toLiteral(selectParams.drawee) + "%'");
    }

// 处理日期筛选条件
    let hasDateFilter = false;

    if (selectParams.date1 && selectParams.date2) {
        // 两个日期都有值
        let date1 = formatDate(selectParams.date1);
        let date2 = formatDate(selectParams.date2);

        whereConditions.push("DATE(a.date_time) >= '" + date1 + "'");
        whereConditions.push("DATE(a.date_time) <= '" + date2 + "'");
        hasDateFilter = true;

        console.log("使用用户指定的日期范围:", date1, "至", date2);
    } else if (selectParams.date1) {
        // 只有开始日期
        let date1 = formatDate(selectParams.date1);
        whereConditions.push("DATE(a.date_time) >= '" + date1 + "'");
        hasDateFilter = true;
        console.log("使用开始日期筛选:", date1);
    } else if (selectParams.date2) {
        // 只有结束日期
        let date2 = formatDate(selectParams.date2);
        whereConditions.push("DATE(a.date_time) <= '" + date2 + "'");
        hasDateFilter = true;
        console.log("使用结束日期筛选:", date2);
    } else if (needsDefaultDate) {
        // 没有日期参数，设置默认值为当月
        let now = new Date();
        let currentYear = now.getFullYear();
        let currentMonth = now.getMonth() + 1;

        // 当月第一天
        let firstDay = currentYear + '/' +
            (currentMonth < 10 ? '0' + currentMonth : currentMonth) +
            '/01';

        // 当月最后一天
        let lastDay = new Date(currentYear, currentMonth, 0).getDate();
        let lastDayStr = currentYear + '/' +
            (currentMonth < 10 ? '0' + currentMonth : currentMonth) +
            '/' +
            (lastDay < 10 ? '0' + lastDay : lastDay);

        // 更新selectParams以便显示在页面上
        selectParams.date1 = firstDay;
        selectParams.date2 = lastDayStr;

        // 更新localStorage中的值
        localStorage.setItem("selectParams", JSON.stringify(selectParams));

        // 添加到查询条件
        whereConditions.push("DATE(a.date_time) >= '" + firstDay + "'");
        whereConditions.push("DATE(a.date_time) <= '" + lastDayStr + "'");
        hasDateFilter = true;

        console.log('设置默认日期为当月:', firstDay, '至', lastDayStr);
    } else {
        // 完全没有日期限制（不应该出现这种情况）
        console.log('警告：没有日期限制条件！');
    }

    console.log("日期筛选状态:", hasDateFilter ? "已设置" : "未设置");

    let whereSql = " where " + whereConditions.join(" and ");
    console.log("WHERE条件:", whereSql);

    // 统计查询
    let sql1 = "SELECT a.id " +
        "FROM day_trading AS a, customer AS b " + whereSql;
    sql1 += " GROUP BY b.id";
    let sql2 = "SELECT COUNT(c.id) AS count FROM (" + sql1 + ") AS c"

    console.log("统计SQL:", sql2);

    db.query(sql2, function (err, rows) {
        try {
            if (err) {
                console.log("统计查询错误:", err);
                res.render('../views/month_trading/month_trading_select.html', {title: 'Express', msg: '查询出错'});
                return;
            }

            let count = rows && rows[0] ? rows[0].count : 0;
            console.log("查询到的记录数:", count);

            let result = {
                datas: [],
                rowcounts: count,
                pagecounts: 0,
                pagenum: 0,
                pageSize: 10,
                msg: '',
                recipient: selectParams.recipient,
                cardholder: selectParams.cardholder,
                drawee: selectParams.drawee,
                date1: selectParams.date1,
                date2: selectParams.date2
            }

            result.pagecounts = Math.ceil(result.rowcounts / result.pageSize) || 1;

            if (isSelect) {
                result.pagenum = 1;
            } else {
                result.pagenum = parseInt(req.query.pagenum) || 1;
                if (result.pagenum < 1) result.pagenum = 1;
                if (result.pagecounts > 0 && result.pagenum > result.pagecounts) {
                    result.pagenum = result.pagecounts;
                }
            }

            if (result.rowcounts == 0) {
                result.msg = '没有查到相关信息';
            }

            // 主查询
            let sql = "SELECT b.*, " +
                "SUM(a.repayment) AS repayment, " +
                "SUM(a.swipe) AS swipe, " +
                "SUM(a.repayment) - SUM(a.swipe) AS balance_of_credit_card, " +
                "SUM(a.basics_service_charge) + SUM(a.other_service_charge) AS the_total_fee, " +
                "SUM(a.swipe) * (b.service_charge) + SUM(a.repayment) - SUM(a.swipe) AS collected_amount, " +
                "SUM(a.swipe) * (b.service_charge) - SUM(a.basics_service_charge) + SUM(a.other_service_charge) AS profit " +
                "FROM day_trading AS a, customer AS b " + whereSql;

            sql += " GROUP BY b.id ";
            sql += " ORDER BY b.id ";
            sql += " LIMIT " + (result.pagenum - 1) * result.pageSize + ", " + result.pageSize;

            console.log("主查询SQL:", sql);

            db.query(sql, function (err, rows) {
                if (err) {
                    console.log("主查询错误:", err);
                    res.render('../views/month_trading/month_trading_select.html', {title: 'Express', ...result});
                } else {
                    result.datas = rows || [];
                    console.log("查询到", result.datas.length, "条记录");

                    // 添加调试信息到页面
                    result.debug = {
                        whereSql: whereSql,
                        rowCount: rows.length,
                        params: selectParams
                    };

                    res.render('../views/month_trading/month_trading_select.html', {
                        title: 'Express',
                        ...result
                    });
                }
            });

        } catch (e) {
            console.error("处理错误:", e);
            res.render("error.html", {error: '网络错误，请稍后再试'});
        }
    });
});
// 辅助函数：格式化日期为YYYY-MM-DD
function formatDate(dateStr) {
    if (!dateStr) return '';

    // 如果是横杠格式，先转为斜杠格式（匹配数据库）
    if (dateStr.includes('-')) {
        dateStr = dateStr.replace(/-/g, '/');
    }

    // 移除时间部分
    dateStr = dateStr.split('T')[0];

    // 将斜杠分隔符标准化
    dateStr = dateStr.replace(/[./]/g, '/');

    // 确保格式正确
    let parts = dateStr.split('/');
    if (parts.length >= 3) {
        let year = parts[0];
        let month = parts[1].padStart(2, '0');
        let day = parts[2].padStart(2, '0');

        // 如果年份是两位，补齐为四位
        if (year.length === 2) {
            year = '20' + year;
        }

        return year + '/' + month + '/' + day; // 返回斜杠格式以匹配数据库
    }

    return dateStr;
}
const disableLayout = {layout: false};

// disable interface layout.hbs  user config layout: false
router.all('/Excel', function (req, res, next) {
    let selectParams = {
        recipient: '',
        cardholder: '',
        drawee: '',
        date1: '',
        date2: ''
    }

    let token = localStorage.getItem("token")
    let key = '123456789abcdefg';
    let iv = 'abcdefg123456789';
    let data = JSON.parse(decrypt(key, iv, token));
    let value = Object.values(data);
    let company = value[0];

    selectParams = JSON.parse(localStorage.getItem("selectParams"));

    console.log('Excel导出参数:', selectParams);

    // 转换日期格式为斜杠
    let date1_sql = selectParams.date1;
    let date2_sql = selectParams.date2;

    // 如果存储的是横杠格式，转为斜杠
    if (date1_sql && date1_sql.includes('-')) {
        date1_sql = date1_sql.replace(/-/g, '/');
    }
    if (date2_sql && date2_sql.includes('-')) {
        date2_sql = date2_sql.replace(/-/g, '/');
    }

    // 处理默认值
    if (!date1_sql || date1_sql === '') {
        date1_sql = '1900/01/01';
    }
    if (!date2_sql || date2_sql === '') {
        let now = new Date();
        date2_sql = now.getFullYear() + '/' +
            (now.getMonth() + 1).toString().padStart(2, '0') + '/' +
            now.getDate().toString().padStart(2, '0');
    }

    let whereSql = " where a.id=b.id and a.gongsi = '" + company +
        "' and recipient like '%" + toLiteral(selectParams.recipient) +
        "%' and cardholder like '%" + toLiteral(selectParams.cardholder) +
        "%' and drawee like '%" + toLiteral(selectParams.drawee) +
        "%' and DATE(a.date_time) >= '" + date1_sql +
        "' and DATE(a.date_time) <= '" + date2_sql + "'";

    console.log('Excel查询条件:', whereSql);

    let sql = "select b.*,sum(a.repayment) as repayment,sum(a.swipe) as swipe," +
        "sum(a.repayment)-sum(a.swipe) as balance_of_credit_card," +
        "sum(a.basics_service_charge)+sum(a.other_service_charge) as the_total_fee," +
        "sum(a.swipe)*(b.service_charge)+sum(a.repayment)-sum(a.swipe) as collected_amount," +
        "sum(a.swipe)*(b.service_charge)-sum(a.basics_service_charge)+sum(a.other_service_charge) as profit " +
        "from day_trading as a,customer as b " + whereSql;
    sql += " group by b.id ";

    console.log('Excel查询SQL:', sql);
    db.query(sql, function (err, rows) {
        try {
            if (err) {
                console.log(err);
            } else {
                let values = rows
                console.log("value=>", values)
            }
            let sql2 = JSON.stringify(sql);
            let sql3 = JSON.parse(sql2);
            console.log(sql3);
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
                    caption: '已还款',
                    type: 'number'
                }, {
                    caption: '已刷额',
                    type: 'number'
                }, {
                    caption: '未刷金额',
                    type: 'number'
                }, {
                    caption: '总手续费',
                    type: 'number'
                }, {
                    caption: '应收金额',
                    type: 'number'
                }, {
                    caption: '利润',
                    type: 'number'
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
                //row.push(rows[i].service_charge)
                row.push(rows[i].repayment)
                row.push(rows[i].swipe)
                row.push(rows[i].balance_of_credit_card)
                row.push(rows[i].the_total_fee)
                row.push(rows[i].collected_amount)
                row.push(rows[i].profit)
                conf.rows.push(row)

            }
            let result = nodeExcel.execute(conf);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats');
            res.setHeader("Content-Disposition", "attachment; filename=" + "month_trading.xlsx");
            res.end(result, 'binary');
        } catch (e) {
            res.render("error.html", {error: '网络错误，请稍后再试'})
        }
    });


});
module.exports = router;