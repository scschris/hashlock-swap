
var log4js = require('log4js');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const compress = require('compression'); //Gzip compressing can greatly decrease the size of the response body and hence increase the speed of a web app
var morgan = require('morgan');
const cors = require('cors');//cross origin resource share
const helmet = require('helmet');
const config = require('./config/config');

var log = log4js.getLogger("app");

//connect to the mongodb 
require('./config/mongoose')

var Route = require('./routes/Route');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(cors());

if (config.DEBUG){
app.use(morgan('dev'))//生产环境不需要这个	
}

// 参考 https://github.com/log4js-node/log4js-example
app.use(log4js.connectLogger(log4js.getLogger("http"), { level: 'auto' }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json());
app.use(cookieParser());
app.use(compress());
app.use(helmet());

app.use(express.static(path.join(__dirname, 'public')));

// app.use('/users', usersRouter);
app.use('/dig', Route);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
