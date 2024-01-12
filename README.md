# stateful-electron-window

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
