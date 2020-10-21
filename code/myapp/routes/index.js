var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index.html', { title: 'ExpressTitle' });
});
router.get('/welcome', function(req, res, next) {
  res.render('welcome.html');
});

module.exports = router;
