var express = require('express');
var router = express.Router();
const path = require('path');

/* GET home page. */
router.get('/', function(req, res, next) {
	console.log("req: " + req + "res: "+res)
  res.send("hello world")
});



module.exports = router;
