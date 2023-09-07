import networks from './networks'

var MetaMask = {
  init (ethereum) {
    this.name = 'MetaMask'
    this._accounts = []
    this._enabled = false
    if (ethereum && ethereum.isMetaMask) {
      this.ethereum = ethereum
      this._chainId = undefined
      this._chainId = undefined
      this._onEnabled = undefined
      this._currentAccount = undefined
    }
  },

  isEnabled () { return this._enabled },

  enable (callback) {
    var self = this
    self.ethereum.request({ method: 'eth_requestAccounts' }).then(function(accounts){
        self._currentAccount = { address: accounts[0] }

        self.ethereum.on('chainChanged', chainId => {
          self._chainId = chainId
          self._onNetworkChanged && self._onNetworkChanged(self.getNetwork(chainId))
        })
        self.ethereum.on('accountsChanged', accounts => {
          self._currentAccount = { address: accounts[0] }
          self._onAccountChanged && self._onAccountChanged({ address: accounts[0] })
        })

        self.ethereum.request({ method: 'eth_chainId' }).then(function (_chainId) {
          self._chainId = _chainId
          self._enabled = true
          self._onEnabled && self._onEnabled({ address: accounts[0] })        
          callback(accounts[0],null)          
        }).catch(function (error) {
          callback(null,error)
        })

    }).catch(function(error) {
      console.log(error)
      callback(null,error)
    })
  },

  dispose () {
    this.ethereum.removeAllListeners('chainChanged')
    this.ethereum.removeAllListeners('accountsChanged')
  },

  onEnabled (callback) {
    this._onEnabled = callback
    return () => this._onEnabled = undefined
  },

  getChainId () { return this._chainId },

  getNetwork (chainId = this._chainId) {
    return {
      chainId,
      isBscMainnet: chainId === '0x38',
      isBscTestnet: chainId === '0x61',
    }
  },

  onNetworkChanged (callback) {
    this._onNetworkChanged = callback
    return () => this._onNetworkChanged = undefined
  },

  onAccountChanged (callback) {
    this._onAccountChanged = callback
    return () => this._onAccountChanged = undefined
  },  

  getCurrentAccount () { return this._currentAccount },

  getAllAccounts (callback) {
    var self = this
    self.ethereum.request({ method: 'wallet_getPermissions' }).then(function (result) {
        const found = result[0].caveats.find(c => c.type === 'filterResponse')
        self._accounts = (found ? found.value : []).map(address => ({ address }))
        callback(self._accounts,null)
    }).catch(function (error) {
      console.log(error)
      callback(null,error)
    })
  },

  //登录签名
  getUserSignature(signer,hash,callback){
      if (window.ethereum && window.ethereum.isMetaMask) {
        this.ethereum = window.ethereum
        if (this.ethereum) {
          this.ethereum.request({ method: "personal_sign", params: [signer, hash]}).then(function (signature) {
            console.log(signature)
            callback(signature,null)
          }).catch(function (error) {
            console.log(error)
            callback(null,error)
          })
        }
      }
  },

  signMessage (message,callback) {
    this.ethereum.request({ method: 'eth_sign', params: [this._currentAccount.address, message] }).then(function (result) {
      callback(result)
    }).catch(function (error) {
      // body...
    })
  },

  signTypedData (typedData,callback) {
    this.ethereum.request({
      method: 'eth_signTypedData',
      params: [typedData, this._currentAccount.address],
      from: this._currentAccount.address,
    }).then(function (result) {
      callback(result)
    }).catch(function (error) {
      // body...
    })
  },

  sendTransaction (tx,callback) {
    this.ethereum.request({
      method: 'eth_sendTransaction',
      params: [tx],
    }).then(function (result) {
      callback(result,null)
    }).catch(function (error) {
      callback(null,error)
    })
  }
}

module.exports = MetaMask