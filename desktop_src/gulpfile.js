'use strict';
var gulp = require('gulp');
var sequence = require('gulp-sequence');
var clean = require('gulp-clean');
var fs = require('fs-extra');
var argv = require('yargs')
    .option('platform', {
        alias: 'p',
        describe: 'choose a platform',
        choices: ['mac', 'darwin', 'windows', 'win', 'win32', 'win64', 'linux'],
        default: 'darwin'
    })
    .argv;
var path = require('path');
var packager = require('electron-packager');
var builder = require('electron-builder');
var electronInstaller = require('electron-winstaller');
// var debianInstaller = require('electron-installer-debian')
var packageJSON = require('./package.json');
var config = require('./config.js');
var finalAppPaths = [];
const zip = require('gulp-zip');
var childProcess = require('child_process');
gulp.task('zip', () => {
    var fileName = 'SealTalk-' + config.PACKAGE.VERSION + '-darwin-x64.zip';
    return gulp.src('build/SealTalk-Ent-darwin-x64/SealTalk_Ent.app')
        .pipe(zip(fileName))
        .pipe(gulp.dest('dist/osx'));
});
gulp.task('default', ['serve']);
gulp.task('cleanup:build', function() {
    var osInfo = getOSInfo();
    var arch = osInfo.arch;
    var platform = osInfo.platform;
    var src = './build/' + config.PACKAGE.PRODUCTNAME + '-' + platform + '-' + arch;
    src = './build';
    return gulp.src([src], {
            read: false
        })
        .pipe(clean());
});
gulp.task('package', function(done) {
    var devDependencies = packageJSON.devDependencies;
    // var devDependenciesKeys = Object.keys(devDependencies);
    var ignoreFiles = [
        // 'build',
        'dist', 'dist2', 'script', 'notice.txt', 'gulpfile.js', 'builder.json', 'gruntfile.js', '.npminstall', 'index1.html', '配置说明.txt', 'desktop_setup.iss', 'screencapture.node_debug', 'screencapture.node_pkg', '.vscode', '.gitignore', 'latestApp', 'screencaptureDebug.node'
    ];
    //devDependenciesKeys.forEach(function(key) {
    //ignoreFiles.push('node_modules/' + key);
    //});
    var supportPlatforms = ['darwin', 'win32', 'linux'];
    var osInfo = getOSInfo();
    var arch = osInfo.arch;
    var platform = osInfo.platform;
    // We will keep all stuffs in dist/ instead of src/ for production
    var iconFolderPath = './res';
    var iconPath;
    var productName = config.PACKAGE.PRODUCTNAME;
    productName += '-' + platform + '-' + arch;
    if (platform === 'darwin') {
        iconPath = path.join(iconFolderPath, config.PACKAGE.MAC.APPICON);
    } else {
        iconPath = path.join(iconFolderPath, config.PACKAGE.WIN.APPICON);
    }
    supportPlatforms.forEach(function(_platform) {
        if (_platform !== platform) {
            if (platform === 'win32') {
                ignoreFiles.push('modules/screenshot/' + _platform);
                ignoreFiles.push('modules/ronglib/' + _platform);
            } else {
                ignoreFiles.push(path.join('modules/screenshot', _platform));
                ignoreFiles.push(path.join('modules/ronglib', _platform));
            }
        }
    });
    ignoreFiles.push('platforms');
    var ignorePath = ignoreFiles.join('|');
    var ignoreRegexp = new RegExp(ignorePath, 'ig');
    packager({
        'dir': './',
        //'name': config.PACKAGE.PRODUCTNAME,
        'name': config.PACKAGE.APPNAME,
        'platform': platform,
        'asar': false,
        // 'asar-unpack': 'RongIMLib.node',
        // 'asar-unpack-dir': 'node_modules/screenshot.framework',
        'arch': arch,
        'electronVersion': config.PACKAGE.RUNTIMEVERSION,
        'out': './build',
        'icon': iconPath,
        'appBundleId': config.APP_ID, // OS X only
        //'appVersion': config.PACKAGE.VERSION,  //CFBundleShortVersionString
        //'build-version': config.MAC.CF_BUNDLE_VERSION,  //CFBundleVersion
        //'helper-bundle-id': config.MAC.HELPER_BUNDLE_ID, // OS X only
        'ignore': ignoreRegexp,
        'overwrite': true,
        'prune': true,
        'appCopyright': config.PACKAGE.COPYRIGHT,
        'osxSign': {
            'identity': 'Developer ID Application: Beijing Rong Cloud Network Technology CO., LTD (CQJSB93Y3D)'
        },
        'extendInfo': './assets/info.plist',
        // 'all': true,
        'protocols': [{
            name: config.PROTOCAL,
            schemes: [config.PROTOCAL]
        }],
        'win32metadata': {
            'CompanyName': config.PACKAGE.AUTHOR,
            'FileDescription': config.PACKAGE.DESCRIPTION,
            'OriginalFilename': 'atom.exe',
            'ProductName': config.PACKAGE.PRODUCTNAME,
            'InternalName': config.PACKAGE.PRODUCTNAME
        }
    }, function(error, appPaths) {
        if (error) {
            console.log(error);
            process.exit(1);
        } else {
            // TODO
            // we should support to build all platforms at once later !
            // something like [ 'build/Kaku-darwin-x64' ]
            finalAppPaths = appPaths;
            done();
        }
    });
});
gulp.task('post-package', function(done) {
    var currentLicenseFile = path.join(__dirname, 'LICENSE');
    var promises = finalAppPaths.map(function(appPath) {
        var targetLicenseFile = path.join(appPath, 'LICENSE');
        var promise = new Promise(function(resolve, reject) {
            fs.copy(currentLicenseFile, targetLicenseFile, function(error) {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
        return promise;
    });
    Promise.all(promises)
        .then(function() {
            done();
        })
        .catch(function(error) {
            console.log(error)
            process.exit(1);
        });
});
gulp.task('build', function(callback) {
    var osInfo = getOSInfo();
    var tasks = ['cleanup:build', 'package', 'post-package'];
    // if(osInfo.platform == 'darwin'){
    //   tasks.push('zip')
    // }
    sequence(tasks)(callback);
});
//暂时未用
gulp.task('createWindowsInstaller', function(done) {
    var osInfo = getOSInfo();
    var appDirectory = './build/' + config.PACKAGE.PRODUCTNAME + '-win32-' + osInfo.arch;
    var outputDirectory = './dist/installer_' + osInfo.arch;
    var resultPromise = electronInstaller.createWindowsInstaller({
        appDirectory: appDirectory,
        outputDirectory: outputDirectory,
        authors: config.PACKAGE.AUTHOR,
        exe: config.PACKAGE.PRODUCTNAME + '.exe',
        setupIcon: './res/app.ico',
        setupExe: config.PACKAGE.PRODUCTNAME + '_by_' + config.PACKAGE.AUTHOR + '_' + config.PACKAGE.VERSION + '.exe',
        noMsi: 'true',
        iconUrl: config.PACKAGE.WIN.ICON_URL,
        loadingGif: config.PACKAGE.WIN.LOADING_GIF
    });
    resultPromise.then(() => console.log("It worked!"), (e) => console.log(`No dice: ${e.message}`));
});

function getOSInfo() {
    var arch = process.arch || 'ia32';
    var platform = argv.platform || process.platform;
    platform = platform.toLowerCase();
    switch (platform) {
        case 'mac':
        case 'darwin':
            platform = 'darwin';
            arch = 'x64';
            break;
        case 'freebsd':
        case 'linux':
            platform = 'linux';
            break;
        case 'linux32':
            platform = 'linux';
            arch = 'ia32';
            break;
        case 'linux64':
            platform = 'linux';
            arch = 'x64';
            break;
        case 'win':
        case 'win32':
        case 'windows':
            platform = 'win32';
            arch = 'ia32';
            break;
        case 'win64':
            platform = 'win32';
            arch = 'x64';
            break;
        default:
            console.log('We don\'t support your platform ' + platform);
            process.exit(1);
            break;
    }
    return {
        platform: platform,
        arch: arch
    };
}
//未用
function installerMac() {
    return new Promise((resolve, reject) => {
        console.log('begin make installerMac')
        var cmd = 'rm -rf ./dist/osx/SealTalk_Ent.dmg && electron-builder \"build/SealTalk_Ent-darwin-x64/SealTalk_Ent.app\" --platform=osx --out=\"dist/osx\" --config=builder.json --overwrite'
        childProcess.exec(cmd, (error, stdout, stderr) => {
            if (error) {
                reject('installerMac failed' + error)
            } else {
                resolve()
            }
        })
    })
}
//未用
gulp.task('installerMac', function(cb) {
    var cmd = 'rm -rf ./dist/osx/SealTalk_Ent.dmg && electron-builder \"build/SealTalk_Ent-darwin-x64/SealTalk_Ent.app\" --platform=osx --out=\"dist/osx\" --config=builder.json --overwrite'
    childProcess.exec(cmd, (err, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
})
gulp.task('installerLinux', function(cb) {
    var options = {
        src: 'build/RCE-linux-ia32/',
        dest: 'dist/installers/',
        arch: 'ia32'
    }
    debianInstaller(options, function(err) {
        if (err) {
            console.error(err, err.stack)
            process.exit(1)
        }
        console.log('Successfully created package at ' + options.dest)
    })
})

gulp.task('copyPlatforms', function(cb) {
    var osInfo = getOSInfo();
    var arch = osInfo.arch;
    var platform = osInfo.platform;
    var platformDll = {
        win32: 'platforms/qwindows.dll',
        darwin: 'platforms/libqcocoa.dylib'
    }
    var currentPlatform = path.join(__dirname, platformDll[platform]);
    var targetPlatform = path.join(__dirname, 'build', config.PACKAGE.PRODUCTNAME + '-' + platform + '-' + arch);
    if (platform == 'darwin') {
        targetPlatform = path.join(targetPlatform, config.PACKAGE.PRODUCTNAME + '.app', 'Contents', 'MacOS', platformDll[platform]);
    } else if (platform == 'win32') {
        targetPlatform = path.join(targetPlatform, platformDll[platform]);
    }
    fs.copy(currentPlatform, targetPlatform, function(error) {
        if (error) {
            console.log(error);
        } else {
            console.log('copy platforms finished');
        }
    });
})
gulp.task('modifylibPath', function(callback) {
    var osInfo = getOSInfo();
    var arch = osInfo.arch;
    var platform = osInfo.platform;
    var basePath = '';
    if (platform == 'darwin') {
        basePath = path.join(__dirname, 'build', config.PACKAGE.PRODUCTNAME + '-' + platform + '-' + arch, config.PACKAGE.PRODUCTNAME + '.app', 'Contents', 'Resources', 'app', 'modules', 'screenshot', platform, 'screencapture.node');
    }
    childProcess.spawnSync('install_name_tool', ['-change', './modules/screenshot/darwin/lib/QtCore', '@executable_path/../Resources/app/modules/screenshot/darwin/lib/QtCore', basePath])
    childProcess.spawnSync('install_name_tool', ['-change', './modules/screenshot/darwin/lib/QtGui', '@executable_path/../Resources/app/modules/screenshot/darwin/lib/QtGui', basePath])
    childProcess.spawnSync('install_name_tool', ['-change', './modules/screenshot/darwin/lib/QtWidgets', '@executable_path/../Resources/app/modules/screenshot/darwin/lib/QtWidgets', basePath])
    childProcess.spawnSync('install_name_tool', ['-change', './modules/screenshot/darwin/lib/QtDBus', '@executable_path/../Resources/app/modules/screenshot/darwin/lib/QtDBus', basePath])
    childProcess.spawnSync('install_name_tool', ['-change', './modules/screenshot/darwin/lib/QtPrintSupport', '@executable_path/../Resources/app/modules/screenshot/darwin/lib/QtPrintSupport', basePath])
    childProcess.spawnSync('install_name_tool', ['-change', './modules/screenshot/darwin/lib/QtMacExtras', '@executable_path/../Resources/app/modules/screenshot/darwin/lib/QtMacExtras', basePath])
    childProcess.spawnSync('otool', ['-L', basePath])
});
gulp.task('modifylibPathDebug', function(callback) {
    var osInfo = getOSInfo();
    var arch = osInfo.arch;
    var platform = osInfo.platform;
    var basePath = '';
    if (platform == 'darwin') {
        basePath = path.join(__dirname, 'modules', 'screenshot', platform, 'screencapture.node');
    }
    childProcess.spawnSync('install_name_tool', ['-change', '@executable_path/../Resources/app/dynamiclibrary/darwin/lib/QtCore', './modules/screenshot/darwin/lib/QtCore', basePath])
    childProcess.spawnSync('install_name_tool', ['-change', '@executable_path/../Resources/app/dynamiclibrary/darwin/lib/QtGui', './modules/screenshot/darwin/lib/QtGui', basePath])
    childProcess.spawnSync('install_name_tool', ['-change', '@executable_path/../Resources/app/dynamiclibrary/darwin/lib/QtWidgets', './modules/screenshot/darwin/lib/QtWidgets', basePath])
    childProcess.spawnSync('install_name_tool', ['-change', '@executable_path/../Resources/app/dynamiclibrary/darwin/lib/QtDBus', './modules/screenshot/darwin/lib/QtDBus', basePath])
    childProcess.spawnSync('install_name_tool', ['-change', '@executable_path/../Resources/app/dynamiclibrary/darwin/lib/QtPrintSupport', './modules/screenshot/darwin/lib/QtPrintSupport', basePath])
    childProcess.spawnSync('install_name_tool', ['-change', '@executable_path/../Resources/app/dynamiclibrary/darwin/lib/QtMacExtras', './modules/screenshot/darwin/lib/QtMacExtras', basePath])
    childProcess.spawnSync('otool', ['-L', basePath])
});
gulp.task('modifylibPathDebug2', function(callback) {
    var osInfo = getOSInfo();
    var arch = osInfo.arch;
    var platform = osInfo.platform;
    var basePath = '';
    if (platform == 'darwin') {
        basePath = path.join(__dirname, 'modules', 'screenshot', platform, 'screencapture.node');
    }
    childProcess.spawnSync('install_name_tool', ['-change', './dynamiclibrary/darwin/lib/QtCore', './modules/screenshot/darwin/lib/QtCore', basePath])
    childProcess.spawnSync('install_name_tool', ['-change', './dynamiclibrary/darwin/lib/QtGui', './modules/screenshot/darwin/lib/QtGui', basePath])
    childProcess.spawnSync('install_name_tool', ['-change', './dynamiclibrary/darwin/lib/QtWidgets', './modules/screenshot/darwin/lib/QtWidgets', basePath])
    childProcess.spawnSync('install_name_tool', ['-change', './dynamiclibrary/darwin/lib/QtDBus', './modules/screenshot/darwin/lib/QtDBus', basePath])
    childProcess.spawnSync('install_name_tool', ['-change', './dynamiclibrary/darwin/lib/QtPrintSupport', './modules/screenshot/darwin/lib/QtPrintSupport', basePath])
    childProcess.spawnSync('install_name_tool', ['-change', './dynamiclibrary/darwin/lib/QtMacExtras', './modules/screenshot/darwin/lib/QtMacExtras', basePath])
    childProcess.spawnSync('otool', ['-L', basePath])
});