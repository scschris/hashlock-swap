var isDebug = true
console.log("当前环境 AutoMake.debug is :"+isDebug)

// 本地数据库
var myHost = null

//test 使用
// 本地数据库
var myHost = "mongodb://localhost/huifengtest"    
console.log("当前环境数据库连的是:"+myHost)

const config = {
  DEBUG:isDebug,// 开发环境中把它关闭吧
  port: 3000,
  jwtSecret: "make-the-life-fun",
  MONGOOSE_DEBUG:isDebug,
  mongo: {// 游戏服务器连的是 读写分离的数据库
    host: myHost,
    port: 27017
  },
  mongo_group: {// 冲榜，分组的 数据库 连的是主节点
    host: myHost,
    port: 27017
  }
};

module.exports = config;