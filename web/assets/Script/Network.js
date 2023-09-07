var Common = require("Common")

//本地地址
var localeRootUrl = "http://localhost:3000/dig/"

//拿访问远程地址的逻辑
function getROOTURL(){
    return localeRootUrl
}

var network = {
    NET_ERROR_TIMES:{},//网络出错次数
    getROOTURL:getROOTURL,

    //测试网络是否可用
    testNetworkAvaiable:function(callback){
        if (!Common.playerData){return false}
        // var xhr = new XMLHttpRequest();
        var xhr = cc.loader.getXMLHttpRequest()
        var url = getROOTURL()+"testNetwork"
        xhr.open("POST", url, true);
        Common.log("testNetworkAvaiable url:"+url)
        if (Common.playerData){
            xhr.setRequestHeader("authorization", Common.playerData.token);    
        }
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = function () {
             if (xhr.readyState == 4) {
                if (xhr.status >= 200 && xhr.status < 400) {
                    Common.log("预加载视频的时候此时网络ok")
                    callback(false)
                }else{  //网断了 xhr.status == 0
                    Common.log("预加载视频的时候此时网络断了")
                    callback(true)
                }
             }
        };
        xhr.send();               
    },

    send:function(body,url,callback,context){
        var urlArr = url.split("/")
        var protocalName = urlArr[urlArr.length-1]

        var xhr = new XMLHttpRequest();
        Common.log("链接url:"+url)
        xhr.open("POST", url, true);
        if (Common.playerData){
            xhr.setRequestHeader("authorization", Common.playerData.token);    
        }
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        
        xhr.onreadystatechange = function () {
            Common.log("xhr.onreadystatechange  >>>>>xhr.readyState:"+xhr.readyState+" xhr.status:"+xhr.status)
             if (xhr.readyState == 4) {
                // Common.log("xhr.onreadystatechange")
                if (xhr.status >= 200 && xhr.status < 400) {
                    var response = xhr.responseText;
                    Common.log("xhr.readyState"+xhr.readyState+"  xhr.status:"+xhr.status)
                    Common.log(response);
                    var data = JSON.parse(response)
                    if (data.code >= 0){
                        if (callback) {
                            callback(null,data,context)    
                        }
                    }else{// code = -1 是一些 正常错误，code = -2 是两个账户同时登陆错误
                        //code = -3 操作太频繁了 code = -4 被封号 code = -5 停服更新
                        if (data.code == -3) {
                            Common.showTips("operate_too_frequent")
                            return
                        }

                        if (data.code == -4) {
                            Common.log("you are evil user");
                            cc.director.end()
                            return
                        }

                        if (callback) {
                            callback(1,data,context)    
                        }
                        
                        //比如token失效啊之类的错误，直接 重新加载吧 , code = -1 ，比如gem不足之类的会返回这个

                        // if (data.error) {
                        //     cc.director.loadScene("main");
                        //     Common.log("have error,so need to relogin")                        
                        // }
                        Common.log("xhr.status:"+xhr.status+" network link error:"+data)
                        var _type = Common.DLG_TYPE.COMMON_DLG
                        var _isHideClose = true

                        if (data.code == -2) {
                            data = Common.STR("no_multi_login")
                            _type = Common.DLG_TYPE.SAME_USER_LG_DLG
                        }

                        if (data.code == -5) {
                            Common.log("stop server and will update");
                            data = "Sorry, we are updating our server, please login again later!"
                            _type = Common.DLG_TYPE.SAME_USER_LG_DLG                            
                        }                        

                        if (data.code == -6) {
                            Common.log("找不到此微信用户");
                            data = "找不到此微信用户，请重新登录"
                            _type = Common.DLG_TYPE.SAME_USER_LG_DLG                            
                        }                                                

                        var params = {type:_type,hideCloseBtn:_isHideClose,msg:JSON.stringify(data)}
                        var canvas = cc.find('Canvas')
                        canvas.getComponent("BaseWarScene").showMsgDlg(params,function(){                            
                            Common.playerData = null
                            cc.director.loadScene("main");
                        })                                        
                    }
                }else{  //网断了 xhr.status == 0

                    if (!network.NET_ERROR_TIMES[protocalName]) {
                        network.NET_ERROR_TIMES[protocalName] = 0
                    }

                    network.NET_ERROR_TIMES[protocalName]++
                    if (network.NET_ERROR_TIMES[protocalName] > 5) {
                        Common.log("xhr.status:"+xhr.status+" 网断了，协议名:"+protocalName+" 已经重复请求过的次数:"+network.NET_ERROR_TIMES[protocalName])
                        network.NET_ERROR_TIMES[protocalName] = 0
                        var params = {type:Common.DLG_TYPE.COMMON_DLG,hideCloseBtn:true,msg:Common.STR("net_link_error")}
                        cc.find('Canvas').getComponent("BaseWarScene").showMsgDlg(params,function(){
                            Common.playerData = null
                            cc.director.loadScene("main");
                        })                                                           
                    }else{
                        setTimeout(function(){
                            Common.log("网断了或者其他错误,协议名:"+protocalName+" 从新请求，当前请求次数:"+network.NET_ERROR_TIMES[protocalName])
                            network.send(body,url,callback,context)
                        },500);// 500 ms                        
                    }
                }
             }
        };
        xhr.send(body);               
    },


    login:function(context,params,callback){
        var UserId = params.address
        var signature = params.signature
        // var isMarket = params.isMarket ? 1 : 0

        var myRootUrl = getROOTURL()

        if (Common.DEBUG && Common.otherId) { //如果 otherId 有值，就登陆这个用户
            UserId = Common.otherId
            Name = "U"+UserId
        }            
        // var body = "UserId="+UserId+"&signature="+signature+"&isMarket="+isMarket
        var body = "UserId="+UserId+"&signature="+signature
        var url = myRootUrl+"login";
        network.send(body,url,callback,context)
    },    

    update(){},
}

module.exports = network