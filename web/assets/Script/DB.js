var Common = null
var Db = {
    USERID_KEY:"aaaaa",
    USERINFO:"bbcep",

    clear(){
        Db.setEncryedData(Db.USERINFO,{})
        Db.setData(Db.USERID_KEY,"")
    },

    init(){
        Common = require("Common")
    },

    setEncryedData(key,data){
        // data = {"userid":"time"}
        cc.sys.localStorage.setItem(key,(JSON.stringify(data)));
    },

    getDecryedData(key){
        var decryptStr = (cc.sys.localStorage.getItem(key))
        if (decryptStr && decryptStr.length > 0) {
            var data = JSON.parse(decryptStr);
            return data || {}
        }

        return {}
    },

    setData(key,str){
        cc.sys.localStorage.setItem(key, str);
    },

    getData(key){
        return cc.sys.localStorage.getItem(key)
    },
};

module.exports = Db