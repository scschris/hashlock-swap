const express = require('express');
const router = express.Router();
const { ethers } = require("ethers");//ethers.js

const config = require('../config/config');
const cache = require('memory-cache');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

// var geoip = require('geoip-lite');
var log = require('log4js').getLogger("users");

function ConsoleLog(msg){
	if (config.DEBUG){
		console.log(msg)	
	}
}

function LogError(UserId,msg){
	var msg = "UserId:"+UserId+"_"+msg
	ConsoleLog(msg)
	log.error(msg);
	
}

function LogDebug(UserId,msg){
	var msg = "UserId:"+UserId+"_"+msg
	ConsoleLog(msg)
	log.debug(msg);	
}


//第一次登陆时，客户端带钱包地址的签名上来，验证是否是钱包登录，禁止其他随便就能登录
function checkSignLogin(signature,signerAccount){
	ConsoleLog("signature:"+signature)
	ConsoleLog("signerAccount:"+signerAccount)
	// signerAccount = "0x58e624074be45004a68e8872a28f28b9ec6b3f37"
	// signature = "0x1e9e6bb2ae439797208eca565dce5893ebfb4bd7d79e3ad0e32725935883a4755d696d8f4bebab278d5094e1bff61366110f465129c986b6aae13e4521c4a5051b"
    if (typeof signature == "undefined" || signature == null || signature == "") {
    	return false
    }
    if (typeof signerAccount == "undefined" || signerAccount == null || signerAccount == "") {
    	return false
    }	    

	let _message = "Welcome"
	let payload = ethers.utils.defaultAbiCoder.encode(["string"], [_message]);
	// console.log("Payload:", payload);
	let payloadHash = ethers.utils.keccak256(payload);
	// console.log("PayloadHash:", payloadHash);
	console.log("Signature1:", signature);
	let Recoverd = ethers.utils.verifyMessage(ethers.utils.arrayify(payloadHash), signature)
	console.log("Recovered:", Recoverd);
	
	let isCheck = (Recoverd.toLowerCase() == signerAccount.toLowerCase())	    
	console.log(isCheck)
	return isCheck
}

function createWallet() {
	const wallet = ethers.Wallet.createRandom()//10万次测试，没有重复
	// console.log("i=>:"+i+' address:'+wallet.address+" key:"+wallet.privateKey)
	return wallet 
}


router.get('/',function(req,res,next) {
	res.send("<br><br>Welcome to play Dig game! this is dig server <br>")
});

router.post('/login',function(req,res,next) {
	var _UserId = req.body.UserId //钱包地址
	var _signature = req.body.signature

	if (!checkSignLogin(_signature,_UserId)) {//没有通过验证，不创建数据库
		LogError(_UserId,"无法验证初次登陆钱包创建的签名")
		res.send({code:-1,des:"signature check failed"})
		return
	}

	User.find({ UserId: _UserId },function (err, docs) {
		if (err){
			LogError(_UserId,"登录错误 error:"+err)
			res.send({code:-1,des:"database find userId:"+_UserId+" err:"+err})			
		}else{
			if (docs.length == 0){// 没有就创建一个用户
				LogDebug(_UserId,"没有找到这个_UserId:"+_UserId)
				createNewUser(res,_UserId,_signature);	
			}else{ // 返回用户信息
				//generate token
				generateToken(res,_UserId,function(token) {
				    var doc = docs[0] //find 是数组
				    var update = {}

					update.LastLogin = Date.now()
					LogDebug(_UserId,"update======> is :"+JSON.stringify(update))
					update.token = token.substring(token.length-10,token.length)//窃取后面10位

					sendLoginData(res,doc,token,_UserId,update)						
				})
			}
		}
	}).lean() //mongoose.Document too heavily,convert to lean
});


//监测是否是机器人访问，一个api请求太频繁就不对
// stayMs是毫秒
function checkRobotRequest(req,cacheKey,stayMs){
    var cachValue = cache.get(cacheKey)
    ConsoleLog("cacheKey:"+cacheKey+"cachValue is "+cachValue)
    if (!cachValue) {//没有就添加进去
        cache.put(cacheKey, 1, stayMs, function(key, value) {
            // ConsoleLog(key + ' 100ms 到了,开始失效:' + value);
        }); // Time in ms
        return false
    }else{//500 ms 就有发过来了，直接返回，发的太频繁
        return true     
    }
};

// middleware for check token validate
function checkToken(req,res,next){
	const token = req.headers["authorization"]
	const _UserId = req.body.UserId
	var cacheKey = token.substring(token.length - 43,token.length)
	if(checkRobotRequest(req,cacheKey,300)){
		LogError(_UserId,"这个用户发的"+req.url+"太频繁，有问题啊,查一下？？")
	}

	// ConsoleLog("当前登陆的token :"+token)
    jwt.verify(token, config.jwtSecret, function(err,decode){
        if(err){
            //If error send Forbidden (403)
            LogError(_UserId,'checkToken err:'+err);
            // res.sendStatus(403);
            // this is error 
            // {"error":{"name":"TokenExpiredError","message":"jwt expired","expiredAt":"2019-04-05T08:23:42.000Z"}}
            res.send({
            	error:err,
            })
        } else {
            next()
            ConsoleLog('SUCCESSFUL: checkToken');
        }
    })	
}

function generateResult(code,doc,token){
		var result = {
			code:0,
			UserId:doc.UserId,
			token:token,
		}

		return result;
}

//下发数据给用户
function sendLoginData(res,doc,token,_UserId,update){
		let result = generateResult(0,doc,token)
		User.updateOne({ UserId: _UserId},update,function(err,docs){
			if (err) {
				LogError(_UserId,"relogin 数据存储错误:"+err)
				res.send(err)
			}else{
				//docs 是这样 {"n":1,"nModified":0,"ok":1}
				LogDebug(_UserId,"relogin登陆 successful")
				res.send(result);		
			}
		});					
};

function createNewUser(res,_UserId,_signature){
	var UserSchema = {}
	UserSchema.UserId = _UserId
	let _wallet = createWallet()
	UserSchema.PvtKey = _wallet.privateKey
	UserSchema.PvtAddr = _wallet.address	

	generateToken(res,_UserId,function(token) {
	    UserSchema.token = token.substring(token.length-10,token.length)//窃取后面10位
	    var _user = new User(UserSchema)
		_user.save(function(err,docs){
			if (err) {
				LogError(_UserId,"创建新用户存储数据库错误")
				res.send({code:-1,des:"database save userId:"+_UserId+" err:"+err})		
			}else{
				var doc = docs // 这里注意,save 的docs是一个object,find 的obj是一个数组
			    doc.createUser = true //
				let result = generateResult(0,doc,UserSchema.token)
				res.send(result);										    	
			}
		})
	})
}


function generateToken(res,_UserId,callback) {
	//generate token
	jwt.sign({UserId:_UserId}, config.jwtSecret , { expiresIn: '5h' },function(err, token){
	    if(err) { 
	    	LogError(_UserId,"生成token失败:"+err)
	    	res.send({code:-1,des:"generate token error:"+err})
	    	return 
	    }
	    callback(token)
	});	
}
module.exports = router;
