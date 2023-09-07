const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  UserId: { // 用户metamask钱包地址
    type: String,
    required: true,
    unique: true,
  },
  CreatedAt: {
    type: Date,
    default: Date.now
  },
  LastLogin: {
    type: Date,
    default: Date.now
  },

  token: { //主要用来记录登陆的时候生成的token的后10位,用来鉴别唯一用户登陆
    type: String,
    default:"init",
  },     
});

module.exports = mongoose.model('User', UserSchema);
