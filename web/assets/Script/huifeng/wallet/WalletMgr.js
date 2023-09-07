var networks = require('./networks') 
var MetaMask = require('./MetaMask') 
import { ethers } from 'ethers.umd.min'
var Common = require("Common")
var EventDispatch = require("EventDispatch")


var WalletMgr = {
  BNBPrice:0,//usd
  init(){
    WalletMgr.initMetaMask()
  },

  //合约的 ethers
  initContract(network){
    this.url = network.url
    this.explorer = network.explorer
    let url = network.url

    this.provider = null

    if (network.chainId == 0x3) {// ropsten
      this.provider = ethers.getDefaultProvider('ropsten');
      this.htlcContract = new ethers.Contract(Common.HTLCABIRopstenAddr, Common.HTLCABI, this.provider)

    }else{ //bsc
      this.provider = new ethers.providers.JsonRpcProvider({ url })
      this.htlcContract = new ethers.Contract(Common.HTLCABIBSCAddr, Common.HTLCABI, this.provider)

    }

    //create contract
    this.htlcContract.on("EventHTLCNew", (contractId,sender,receiver,amount,hashlock,timelock, event) => {
        Common.log("EventHTLCNew event contractId is ===>"+contractId)
        Common.log(event)      

        EventDispatch.dispatch("createContract",contractId)
    });

    //withdraw
    this.htlcContract.on("EventHTLCWithdraw", (contractId,sender,receiver,amount,hashlock,timelock, event) => {
        Common.log("EventHTLCWithdraw event contractId is ===>"+contractId)

        EventDispatch.dispatch("withdraw",contractId)
    });    

  },

  isInstallMetaMask(){
      return (window.ethereum && window.ethereum.isMetaMask)
  },

  initMetaMask() {
    if (window.ethereum && window.ethereum.isMetaMask) {
      MetaMask.init(window.ethereum)
    }
  },

  enableBrowserExtension (callback) {
    MetaMask.enable(function(address,error){
      if (!error) {
        let chainId = MetaMask.getChainId()
        if (!WalletMgr.initRpcFromChainId(chainId)) { 
          callback(null,{type:-1})// 暂时只支持币安链
          return
        }
        
      }
      callback(address,error)
    })
  },

  onEnabled (callback) {
    return this.isBrowserExtensionInstalled && this.browserExtension.onEnabled(callback)
  },

  getNetwork() {
    return MetaMask.getNetwork()
  },

  onNetworkChanged (callback) {
    const handler = network => {
      this.initRpcFromChainId(network.chainId)
      callback(network)
    }
    return MetaMask.onNetworkChanged(handler)
  },

  initRpcFromChainId (chainId) {
    let self = this
    if (chainId) {
      const network = networks.find(n => n.chainId === chainId)
      if (network) {
        self.initContract(network)
        return true
      }
    }
    return false
  },

  getCurrentAccount() {
    return MetaMask.getCurrentAccount()
  },

  onAccountChanged (callback) {
    return MetaMask.onAccountChanged(callback)
  },

  getAllAccounts (callback) {
    MetaMask.getAllAccounts(callback)
  },

  signMessage (message,callback) {
    MetaMask.signMessage(message,callback)
  },

  signTypedData (typedData,callback) {
    // return this.isBrowserExtensionInstalled && await this.browserExtension.signTypedData(typedData)
    MetaMask.signMessage(typedData,callback)
  },

  sendTransaction ({ from, to, value, ...others },callback) {
    let options = {}
    if (!value) {
        options = {
          from,
          to,
          ...others,
        }
    }else{
        options = {
          from,
          to,
          value: Number(value).toString(16),//这个地方实际就是输入的BNB数量
          ...others,
        }      
    }

    MetaMask.sendTransaction(options,callback)
  },

  executeContract (type, method, parameters = [], overrides = {},callback) {
    var contract = this.htlcContract 
    contract.populateTransaction[method](...parameters, overrides).then(function (tx) {
      callback(tx,null)
    }).catch(function (error) {
      callback(null,error)
    })

    // const symbol = await contract.symbol()
    // const name = await contract.name()
    // const minter = await contract.minter()
    // const balance = await contract.balanceOf(...parameters)
    // console.log("balance is:"+balance)
  },

  executeContractForReadOly (type, method, parameters = [], overrides = {},callback) {
    contract = this.htlcContract
    contract[method](...parameters, overrides).then(function (tx) {
      callback(tx,null)
    }).catch(function (error) {
      callback(null,error)
    })
  },  

  getAccount (address,callback) {
    this.provider.getBalance(address).then(function (balance) {
      callback(balance,null)
    }).catch(function (error) {
      callback(null,error)
    })    
  } , 

  parseEther (ether) {
    return (ethers.utils.parseEther(ether))
  },

  formatEther(ether){
    // ConsoleLog("=========>"+ethers.utils.formatEther("10000"))
    return ethers.utils.formatEther(ether)
  },

  getUserSignature(callback){
    if (window.ethereum && window.ethereum.isMetaMask) {
        let message = "Welcome"
        let payload = ethers.utils.defaultAbiCoder.encode(["string"], [message]);
        console.log("Payload:", payload);
        var currentAccount = MetaMask.getCurrentAccount()
        console.log("signer address:",currentAccount.address)
        let payloadHash = ethers.utils.keccak256(payload);
        MetaMask.getUserSignature(currentAccount.address,payloadHash,callback)
    }    
  }, 

}

module.exports = WalletMgr