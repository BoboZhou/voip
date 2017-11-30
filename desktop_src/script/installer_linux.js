var builder = require('electron-builder');
const Platform = builder.Platform;
const path = require('path')
const rimraf = require('rimraf')
const packageJson = require('../package.json');
const Config = require('../config.js')
// console.log('Platform', Platform.LINUX.createTarget());
// return;
var globPatterns = [
  // match all files
  "**/*",
  "!lib",
  "!build",
  "!dist",
  "!desktop_setup.iss",
  "!desktop_setup_test.iss",
  "!gulpfile.js",
  "!vc_redist.x86.exe",
  "!web_interface.md",
  "!screencaptureDebug.node"
];
//TODO according to platform to decide "!lib" in globPatterns
var buildJson = {
  appId: 'com.rong.test',
  artifactName: '${os}-${arch}.${ext}',
  asar: false,
  directories: {
      buildResources: './buildSrc',
      output: 'dist',
      app: "./"
  },
  electronVersion: '1.4.15',
  electronDist: './node_modules/electron/distRaw',
  files: globPatterns,
  protocols: [{
    name: Config.PROTOCAL,
    schemes: [Config.PROTOCAL]
  }],
  // extraResources: {
  //   "from": "../api/bin/dist/",
  //   "to": "api/bin/dist/",
  //   "filter": [
  //     "**/*"
  //   ]
  // },
  // extraResources: ["web_interface.md"],
  // extraFiles: ["web_interface.md"],
  "win": {
    // "packageCategory":
    "target": ["nsis-web","nsis","portable"]
  },
  "linux": {
    // "packageCategory":
    // "target": ["deb:ia32"],
    "target": ["deb"],
    // "target": ["AppImage","deb","tar.gz"],
    "category": "Network",
    "desktop": {
        "Type": "Application",
        "Encoding": "UTF-8",
        "Name": Config.PACKAGE.PRODUCTNAME,
        "Comment": "RCE for Linux",
        "Exec": Config.PACKAGE.APPNAME,
        "Icon": "RCE",
        "Terminal": false
    },
    "executableName": Config.PACKAGE.APPNAME
    // "icon": "./buildSrc/icons"
  }, 
  "deb": {
    "icon": "RCE",
    "depends": ["libnotify4", "libappindicator1", "libxtst6", "libnss3 (>=3.13.3)", "libxss1", "fontconfig-config", "gconf2", "libasound2", "pulseaudio"]
  },
  // "deb": {
  //   // "packageCategory":
  //   "icon": "res/app.png"
  // },
  "dmg": {
    "title": Config.PACKAGE.APPNAME,
    "background": path.join(__dirname, '..', 'res', Config.PACKAGE.MAC.BACKGROUND),
    "icon": path.join(__dirname, '..', 'res', Config.PACKAGE.MAC.APPICON),
    "iconSize": 80,
    "contents": [
      { "x": 438, "y": 160, "type": "link", "path": "/Applications" },
      { "x": 192, "y": 160, "type": "file" }
    ]
  }
}
var options = {
    // targets: Platform.LINUX.createTarget(),
    // linux: ['deb:ia32'],
    // linux: ['deb:x64'],
    // linux: ['rpm:x64'],
    projectDir: './',
    config: buildJson
};

function deleteOutputFolder () {
  return new Promise((resolve, reject) => {
    rimraf(path.join(__dirname, '..', 'dist'), (error) => {
      error ? reject(error) : resolve()
    })
  })
}

function createMacInstaller () {
  return new Promise((resolve, reject) => {
    builder.build(options, function(error){
       error ? reject(error) : resolve()
    });
  })
}


deleteOutputFolder()
  .then(createMacInstaller)
  .catch((error) => {
    console.error(error.message || error)
    process.exit(1)
  })