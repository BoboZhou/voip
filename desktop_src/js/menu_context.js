'use strict'

const electron = require('electron')
const app = electron.app
const i18n = require("i18n")

module.exports = function(lang, isEditable) {
  i18n.setLocale(lang)
  let inputMenu = [
    // {label: app.__('context.Undo'), role: 'undo'},
    // {label: app.__('context.Redo'), role: 'redo'},
    // {type: 'separator'},
    {label: app.__('context.Cut'), role: 'cut'},
    {label: app.__('context.Copy'), accelerator: 'Command+C', role: 'copy'},
    {label: app.__('context.Paste'), accelerator: 'Command+V', role: 'paste'},
    {type: 'separator'},
    {label: app.__('context.SelectAll'), role: 'selectall'},
  ]
  let selectionMenu = [
    {label: app.__('context.Copy'), role: 'copy'},
    {type: 'separator'},
    {label: app.__('context.SelectAll'), role: 'selectall'},
  ]
  return isEditable ? inputMenu : selectionMenu
}
