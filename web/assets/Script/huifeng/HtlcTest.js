var Common = require("Common")
var sha256 = require('sha256');
var hash = sha256.create();
var WalletMgr = require("WalletMgr")
var networks = require('networks') 
var EventDispatch = require("EventDispatch")


function toHex(str) {
    var result = '';
    for (var i=0; i<str.length; i++) {
        result += str.charCodeAt(i).toString(16);
    }
    return result;
}

cc.Class({
    extends: cc.Component,

    properties: {
      infoLb:cc.Label,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        //创建合约
        EventDispatch.addEvent("createContract",this,function(self,params){
            Common.log(params)
            Common.log("createContract event==>")
            self.infoLb.string += " 新生成的合约id:"+params
        })       

        //提现
        EventDispatch.addEvent("withdraw",this,function(self,params){
            Common.log("withdraw event contractId:==>")
            Common.log(params)
            self.infoLb.string += " 您的合约资产被取走合约id:"+params
            let contractId = params

            // 读合约        
            WalletMgr.executeContractForReadOly(null, 'getContract', [contractId],{},function(txParams,error) {
                if (error) {
                    Common.log("WalletMgr.executeContractForReadOly 执行合约错误:"+error.message)
                    return
                }
                Common.log("WalletMgr.executeContractForReadOly 执行合约成功:"+JSON.stringify(txParams))
                Common.log("取款密钥:"+txParams.preimage)
                self.infoLb.string = " 取款密钥是:"+txParams.preimage
            },)          
        })       

    },


    start () {
        let account = WalletMgr.getCurrentAccount()
        let network = WalletMgr.getNetwork()

        if (account.address.toLowerCase()  == "0x58E624074be45004A68E8872a28f28B9eC6b3F37".toLowerCase()) {
          this.infoLb.string = "当前账户是:Alice"+" "
        }else if (account.address.toLowerCase()  == "0x8db71749b3Beb08B6661f431160C73d92A3d6e5f".toLowerCase()) {
          this.infoLb.string = "当前账户是:Bob"+" "
        }else{
          this.infoLb.string = "当前账户是:"+account.address+" "
        }

        const _network = networks.find(n => n.chainId === network.chainId)
        if (_network) {
          this.infoLb.string += "当前网络是:"+_network.name+" "
        }
        
        
    },


    BtnCallBack(event,arg) {
        text = event.string
        arg = Number(arg)
        switch (arg)
        {
        case 1://生成hashlock
            this.hashlock = "0x"+ hash.update(text).hex();
            console.log("hashlock:"+this.hashlock)
            event.string = this.hashlock
          
          break;
        case 2://生成timelock
            this.timelock = Date.now()/1000+Number(text)
            this.timelock = Math.floor(this.timelock)
            event.string = this.timelock
            console.log("timelock:"+this.timelock)
           break;
        case 3://输入bnb
            this.bnb = WalletMgr.parseEther(text)
            event.string = this.bnb
            console.log("bnb:"+this.bnb)
          break;
        case 4://输入receive addr
            this.receiverAddr = text
          break;
        case 5://输入hashlock
            this.hashlock = text
            console.log("hashlock:"+this.hashlock)
            event.string = this.hashlock
          break;
        case 6://输入timelock
            this.timelock = text
            event.string = this.timelock
            console.log("timelock:"+this.timelock)            
          break;

        case 7://Btn 创建合约 按钮
            if (!Common.playerData) {
              console.log("请先登录啊")
              return
            }
            
            let _receiver = this.receiverAddr
            let _hashlock = this.hashlock
            let _timelock = this.timelock
            let bnb = this.bnb
            var fromAddress = Common.playerData.UserId
            console.log("_receiver:"+_receiver+" _hashlock:"+_hashlock+" timelock:"+_timelock+" wallet addr:"+fromAddress)
            WalletMgr.executeContract(null, 'createContract', [_receiver,_hashlock,_timelock],{},function(txParams,error) {
                if (error) {
                    Common.log("WalletMgr.executeContract 执行合约错误:"+error.message)
                    return
                }

                const tx = {
                  from: fromAddress,//当前钱包地址
                  value:bnb, //需要自己输入的 bnb 或者 ether
                  ...txParams,
                };            
                Common.log("tx ==>")
                Common.log(tx)
                WalletMgr.sendTransaction(tx,function(res,error){
                    if (error) {
                        Common.log("WalletMgr.sendTransaction 执行合约错误:"+error.message)
                        return    
                    }
                    Common.log("WalletMgr.sendTransaction 执行合约成功:"+JSON.stringify(res))
                })
            },)

          break;                
        case 8://请输入对方创建时候的合约id
            this.contractId = text
            console.log("contractId:"+this.contractId)
            event.string = this.contractId

          break;                
        case 9://输入hash原值 preimage
            // this.preImage = "0x"+toHex(text)
            this.preImage = text
            console.log("preImage:"+this.preImage)
            event.string = this.preImage
          break;                
        case 10://Btn 提现 按钮

            if (!Common.playerData) {
              console.log("请先登录啊")
              return
            }

            var fromAddress = Common.playerData.UserId
            console.log("contractId:"+this.contractId+" preImage:"+this.preImage+" wallet addr:"+fromAddress)

            WalletMgr.executeContract(null, 'withdraw', [this.contractId,this.preImage],{},function(txParams,error) {
                if (error) {
                    Common.log("WalletMgr.executeContract 执行合约错误:"+error.message)
                    return
                }

                const tx = {
                  from: fromAddress,//当前钱包地址
                  ...txParams,
                };            
                Common.log("tx ==>")
                Common.log(tx)
                WalletMgr.sendTransaction(tx,function(res,error){
                    if (error) {
                        Common.log("WalletMgr.sendTransaction 执行合约错误:"+error.message)
                        return    
                    }
                    Common.log("WalletMgr.sendTransaction 执行合约成功:"+JSON.stringify(res))
                })
            },)

          break;                

        case 11://退款的时候输入 创建时的合约id
            this.contractId = text
            console.log("contractId:"+this.contractId)
            event.string = this.contractId

          break;                                                                                

        case 12://Btn 退款 按钮

            if (!Common.playerData) {
              console.log("请先登录啊")
              return
            }

            var fromAddress = Common.playerData.UserId
            console.log("contractId:"+this.contractId+" wallet addr:"+fromAddress)

            WalletMgr.executeContract(null, 'refund', [this.contractId],{},function(txParams,error) {
                if (error) {
                    Common.log("WalletMgr.executeContract 执行合约错误:"+error.message)
                    return
                }

                const tx = {
                  from: fromAddress,//当前钱包地址
                  ...txParams,
                };            
                Common.log("tx ==>")
                Common.log(tx)
                WalletMgr.sendTransaction(tx,function(res,error){
                    if (error) {
                        Common.log("WalletMgr.sendTransaction 执行合约错误:"+error.message)
                        return    
                    }
                    Common.log("WalletMgr.sendTransaction 执行合约成功:"+JSON.stringify(res))
                })
            },)

          break;                          
        default:
          console.log("ERROR:invalid type")
        } 
    },

    // update (dt) {},
});