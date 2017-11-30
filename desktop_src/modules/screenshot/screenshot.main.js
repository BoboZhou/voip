const path = require('path')
var nodeUrl = path.resolve(__dirname, process.platform) + '/screencapture';
const screencapture = require(nodeUrl)
const appCapture = new screencapture.Main;
global.sharedObj = {appCapture: appCapture};
