var Common = require("Common")
var Network = require("Network")
var EventDispatch = require("EventDispatch")

var DB = require("DB")
var WalletMgr = require("WalletMgr")

var networkLinkOk = false //网络链接返回数据了
var loadSceneOk = false //加载场景也ok了

var sceneName = "hftest"

import { ethers } from 'ethers.umd.min'

cc.Class({
    extends: cc.Component,
    properties: {
        version:cc.Label,
        htlcAbi:cc.JsonAsset,
    },

    // LIFE-CYCLE CALLBACKS:
    onLoad () { 

        Common.HTLCABIRopstenAddr = "0xd77aa86CaFf8B7C4B27E4f26A600CC0dc5EE49d8"
        Common.HTLCABIBSCAddr = "0xd2e3d48b8dfe2c27c1d2343eef327f3163a6ca4e"

        Common.HTLCABI = this.htlcAbi.json

        this.version.string = "V:"+Common.VERSION
        this.enterGame()
    },

    getSceneName(){
        return "Login"
    },

    showInstallMetaMaskDlg(){
        Common.log("please install metamask");
        cc.sys.openURL("https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn")
    },

    showErrorMsgDlg(msg,callback){
        Common.log(msg);
    },    

    enterBtn(){
        WalletMgr.init()
        var self = this
        WalletMgr.enableBrowserExtension(function(address,error) {
            if (error) {
                var errorMsg = error.message
                if (error.type == -1) {
                    errorMsg = Common.STR("no_support_chain")
                }
                self.showErrorMsgDlg(errorMsg,function(){})
                return
            }

            function _realLogin(address,signature) {
                let params = {address:address,signature:signature,isMarket:0}
                Network.login(self,params,function(err,result,self){
                    if (!err){
                        Common.playerData = result
                        Common.log("用户登陆")

                        networkLinkOk = true //网络链接返回数据了
                        var cacheInfo = {address:address,signature:signature}
                        DB.setEncryedData(DB.USERINFO,cacheInfo)

                       cc.director.loadScene(sceneName,function () {
                            Common.log('Success to load scene: ' + sceneName);
                        });

                    }
                })   
            }

            var fromAddress = address

            var cacheInfo = DB.getDecryedData(DB.USERINFO)
            if (cacheInfo.address && cacheInfo.address == address && cacheInfo.signature && cacheInfo.signature.length > 0) {
                _realLogin(address,cacheInfo.signature)
            }else{
                //第一次要签个名，不然别人都可以登陆你的账号了
                WalletMgr.getUserSignature(function(signature,error){
                    if (error) {
                        self.showErrorMsgDlg(error.message)
                        return
                    }                     
                    _realLogin(address,signature)
                })
            }
        })
    },

    enterGame(){
        Common.init() //初始化下
        this.loadMyScene(sceneName)

        if (!WalletMgr.isInstallMetaMask()) { //让用户安装metamask
            this.showInstallMetaMaskDlg()
            return
        }   

        // this.enterBtn() //如果不需要进入按钮，直接这里登陆
    },


    // onload 结束后
    start () {
        // this.loadMyScene("main")
    },

    loadMyScene(sceneName){
        var self = this
        Common.log("will load scene")
        cc.director.preloadScene(sceneName,
            function(completedCount, totalCount, item)  {
                var progress = completedCount / totalCount;
                // Common.log("searching progress:" + progress);
               },function (error, asset) {
                if (error) {
                    Common.log("loadScene main error:")
                    Common.log(error)
                    self.loadMyScene(sceneName)
                    return 
                }
                //加载完成
                Common.log("will loadScene:"+sceneName)
                loadSceneOk = true //加载场景也ok了
            }
        );
    },

});