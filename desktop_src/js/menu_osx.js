'use strict'

const electron = require('electron')
const app = electron.app
const i18n = require("i18n")
const BrowserWindow = electron.BrowserWindow;

module.exports = function(lang) {
  i18n.setLocale(lang)
  let menus = [{
    label: app.__('menus.Product'),
    submenu: [{
      label: app.__('menus.ProductSub.About'),
      click: () => app.emit('menu.help.about')
      // role: 'about'  // raw electron about menu
    }, 
    // {
    //   label: app.__('menus.ProductSub.CheckUpdate'),
    //   click() {
    //     app.emit('menu.checkUpdate')
    //   }
    // }, 
    {
      type: 'separator'
    }, {
      label: app.__('menus.ProductSub.Settings'),
      click() {
        app.emit('menu.main.account_settings')
      }
    }, {
      type: 'separator'
    }, {
      label: app.__('menus.ProductSub.Services'),
      role: 'services',
      submenu: []
    }, {
      type: 'separator'
    }, {
      label: app.__('menus.ProductSub.HSealTalk'),
      accelerator: 'Command+H',
      role: 'hide'
    }, {
      label: app.__('menus.ProductSub.HOthers'),
      accelerator: 'Command+Shift+H',
      role: 'hideothers'
    }, {
      label: app.__('menus.ProductSub.SAll'),
      role: 'unhide'
    }, {
      type: 'separator'
    }, {
      label: app.__('menus.ProductSub.Quit'),
      accelerator: 'Command+Q',
      click() {
        app.exit(0);
      }
    }]
  }, {
    label: app.__('menus.Edit'),
    submenu: [{
      label: app.__('menus.EditSub.SearchUser'),
      accelerator: 'Command+F',
      click() {
        app.emit('menu.edit.search')
      }
    }, {
      type: 'separator'
    }, {
      label: app.__('menus.EditSub.Undo'),
      accelerator: 'Command+Z',
      role: 'undo'
    }, {
      label: app.__('menus.EditSub.Redo'),
      accelerator: 'Shift+Command+Z',
      role: 'redo'
    }, {
      type: 'separator'
    }, {
      label: app.__('menus.EditSub.Cut'),
      accelerator: 'Command+X',
      role: 'cut'
    }, {
      label: app.__('menus.EditSub.Copy'),
      accelerator: 'Command+C',
      role: 'copy'
    }, {
      label: app.__('menus.EditSub.Paste'),
      accelerator: 'Command+V',
      role: 'paste'
    }, {
      label: app.__('menus.EditSub.SelectAll'),
      accelerator: 'Command+A',
      role: 'selectall'
    }]
  }, {
    label: app.__('menus.View'),
    submenu: [
      {
      label: app.__('menus.ViewSub.Languages'),
      enabled: false,
      submenu: [{
        label: '简体中文',
        type: 'checkbox',
        checked: lang == 'zh-CN',
        click() {
          app.emit('menu.view.languages', 'zh-CN')
        }
      }, {
        label: 'English',
        type: 'checkbox',
        checked: lang == 'en',
        click() {
          app.emit('menu.view.languages', 'en')
        }
      }]
    }, {
      type: 'separator'
    },
    // {
    //   label: app.__('menus.ViewSub.BringFront'),
    //   type: 'checkbox',
    //   checked: BrowserWindow.getFocusedWindow().isAlwaysOnTop == true,
    //   click() {
    //     app.emit('menu.view.bringFront', checked)
    //   }
    // },
    {
      label: app.__('menus.ViewSub.Reload'),
      accelerator: 'Command+R',
      click() {
        app.emit('menu.edit.reload')
      }
    }]
  }, {
    label: app.__('menus.Window'),
    role: 'window',
    submenu: [{
      label: app.__('menus.WindowSub.Minimize'),
      accelerator: 'Command+M',
      role: 'minimize'
    }, {
      label: app.__('menus.WindowSub.Close'),
      accelerator: 'Command+W',
      role: 'close'
    }, {
      type: 'separator'
    }, {
      label: app.__('menus.WindowSub.AllToFront'),
      role: 'front'
    }]
  }, {
    label: app.__('menus.Application'),
    submenu: [{
      label: app.__('menus.ApplicationSub.takeScreenshot'),
      accelerator: 'Command+Ctrl+S',
      enabled: false,
      click() {
        app.emit('menu.edit.takeScreenshot')
      }
    }]
  }, {
    label: app.__('menus.Help'),
    role: 'help',
    submenu: [{
      label: app.__('menus.HelpSub.Homepage'),
      click() {
        app.emit('menu.help.homepage')
      }
    },
    {
      label: app.__('menus.HelpSub.Purgecache'),
      click: () => app.emit('menu.help.purgecache')
    }]
  }]

  return menus
}
