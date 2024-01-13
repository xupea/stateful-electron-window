# stateful-electron-window

[![Tests](https://github.com/xupea/stateful-electron-window/actions/workflows/tests.yml/badge.svg)](https://github.com/xupea/stateful-electron-window/actions/workflows/tests.yml)
[![NPM version](https://badge.fury.io/js/stateful-electron-window.svg)](https://badge.fury.io/js/stateful-electron-window)
[![Downloads](https://img.shields.io/npm/dw/stateful-electron-window)](https://img.shields.io/npm/dw/stateful-electron-window)

A library to store and restore window sizes and positions for your Electron app

## Installation

Install with [npm](https://npmjs.org/package/stateful-electron-window):

    npm install stateful-electron-window

## Usage

```
import { StatefullBrowserWindow } from 'stateful-electron-window'
const mainWindow = new StatefullBrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
        preload: path.join(__dirname, 'preload.js')
    }
})
```

## API

#### new StatefullBrowserWindow(options)

StatefullBrowserWindow extends BrowserWindow.

##### options

`configFilePath` - _String_

The path where the state file should be written to. Defaults to
`app.getPath('userData')`

`configFileName` - _String_

The name of file. Defaults to `window-state.json`. This is usefull if you want to support multiple windows.

`supportMaximize` - _Boolean_

Should we automatically maximize the window, if it was last closed
maximized. Defaults to `false`
