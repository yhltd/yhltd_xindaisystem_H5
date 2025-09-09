let express = require('express');
let router = express.Router();
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

if (typeof localStorage === "undefined" || localStorage === null) {
  let LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}
/* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index.html', { title: 'ExpressTitle' });
// });
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
      res.render("users.html", {company: company, account: account, password: password})

    } else {
      res.render("users.html");
    }
  } else {
    res.render('users.html', {title: 'ExpressTitle'});
  }
});
router.get('/welcome', function(req, res, next) {
  res.render('welcome.html');
});
router.get('/welcome/index', function(req, res, next) {
    res.render('index.html');
});
router.get('/copyright', function(req, res, next) {
  res.render('copyright.html');
});
router.get('/help', function(req, res, next) {
  res.render('help.html');
});
module.exports = router;
