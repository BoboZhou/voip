const {remote} = require('electron')
const path = require('path')
var RongIMClient

try {
    var basePath = path.resolve(__dirname, process.platform) + '/RongIMLib';
    RongIMClient = remote.require(basePath)
} catch (err) {
    console.log(err);
    RongIMClient = null
}

module.exports = {
    RongIMClient: RongIMClient
}