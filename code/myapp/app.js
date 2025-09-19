var createError = require('http-errors');
var cookieParser = require('cookie-parser')
var express = require('express');
var path = require('path');
var logger = require('morgan');


var indexRouter = require('./routes/index');
var index1Router = require('./routes/index1');
var usersRouter = require('./routes/users');
var customerRouter = require('./routes/customer');
var day_tradingRouter = require('./routes/day_trading');
var month_tradingRouter = require('./routes/month_trading');
var statisticsRouter = require('./routes/statistics');
var productRouter = require('./routes/product');
var member_infoRouter = require('./routes/member_info');
var order_panelRouter = require('./routes/order_panel');
var membership_levelRouter = require('./routes/membership_level');
var ordersRouter = require('./routes/orders');
var orders1Router = require('./routes/orders1');
var userssRouter = require('./routes/userss');
var orders_detailsRouter = require('./routes/orders_details');
var orders_details_memberRouter = require('./routes/orders_details_member');
var report_formRouter = require('./routes/report_form');
var pushNewsRouter = require('./routes/push_news');
var order_tableRouter = require('./routes/order_table');
// var event_discountRouter = require('./routes/event_discount');
var app = express();



// view engine setup  更换模板引擎
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

//注释掉默认的，自己手动修改默认引擎;
var nunjucks = require('nunjucks');
nunjucks.configure(path.join(__dirname, 'views'), {
  autoescape: true,
  express: app,
  watch: true
});


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/', index1Router);
app.use('/users', usersRouter);
app.use('/customer', customerRouter);
app.use('/day_trading', day_tradingRouter);
app.use('/month_trading', month_tradingRouter);
app.use('/statistics', statisticsRouter);
app.use('/product', productRouter);
app.use('/member_info', member_infoRouter);
app.use('/order_panel', order_panelRouter);
app.use('/membership_level', membership_levelRouter);
app.use('/orders', ordersRouter);
app.use('/orders1', orders1Router);
app.use('/userss', userssRouter);
app.use('/orders_details', orders_detailsRouter);
app.use('/orders_details_member', orders_details_memberRouter);
app.use('/report_form', report_formRouter);
app.use('/pushnews', pushNewsRouter);
app.use('/order_table', order_tableRouter);
// app.use('/event_discount', event_discountRouter);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
  res.status(err.status || 500);
  // res.render('views/error');
  // res.json({ message: err.message, error: err });
  res.render('error.html',{error:err});//根据错误状态码渲染不同模板数据

  
  // res.status(err.status);//http错误状态码
});

module.exports = app;
