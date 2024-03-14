import path from "path";
import os from "os";
import { readFileSync } from "jsonfile";
import { screen } from "electron";

import { StatefulBrowserWindow } from "../src/index";

jest.mock("jsonfile");

// Mocking BrowserWindow
jest.mock("electron", () => {
  const originalElectron = jest.requireActual("electron");
  return {
    ...originalElectron,
    app: {
      getPath: jest.fn(() => "/path/to/user/data"),
    },
    screen: {
      getAllDisplays: jest.fn(),
      getDisplayMatching: jest.fn(),
      getPrimaryDisplay: jest.fn(),
    },
  };
});

beforeEach(() => {
  (readFileSync as any).mockClear();
  (screen as any).getDisplayMatching.mockClear();
  (screen as any).getPrimaryDisplay.mockClear();
  (screen as any).getAllDisplays.mockClear();
});

test("tries to read state file from the default location", () => {
  const currentPlatform = os.platform();

  (readFileSync as any).mockImplementation(() => {
    return jest.fn();
  });

  new StatefulBrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  expect(readFileSync).toHaveBeenCalled();
  if (currentPlatform === "win32") {
    expect(readFileSync).toHaveBeenCalledWith(
      "\\path\\to\\user\\data\\window-state.json",
    );
  } else {
    expect(readFileSync).toHaveBeenCalledWith(
      "/path/to/user/data/window-state.json",
    );
  }
});

test("tries to read state file from the configured source", () => {
  const currentPlatform = os.platform();

  (readFileSync as any).mockImplementation(() => {
    return jest.fn();
  });

  new StatefulBrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    configFilePath: "/path/custom/data",
    configFileName: "state.json",
  });

  expect(readFileSync).toHaveBeenCalled();

  if (currentPlatform === "win32") {
    expect(readFileSync).toHaveBeenCalledWith(
      "\\path\\custom\\data\\state.json",
    );
  } else {
    expect(readFileSync).toHaveBeenCalledWith("/path/custom/data/state.json");
  }
});

test("considers the state invalid if without bounds", () => {
  (readFileSync as any).mockImplementation(() => {
    return () => ({ width: 100 });
  });

  const win = new StatefulBrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  expect(win.getBounds().width).not.toBe(100);
});

test("Reset state to default values if saved display is unavailable", () => {
  (readFileSync as any).mockImplementation(() => {
    return () => ({
      x: -2000,
      y: -1000,
      width: 800,
      height: 600,
      displayBounds: { x: -2560, y: -480, width: 2560, height: 1440 },
    });
  });

  const screenBounds = { x: 0, y: 0, width: 1680, height: 1050 };

  (screen as any).getDisplayMatching.mockReturnValue({ bounds: screenBounds });
  (screen as any).getPrimaryDisplay.mockReturnValue({ bounds: screenBounds });
  (screen as any).getAllDisplays.mockReturnValue([{ bounds: screenBounds }]);

  const win = new StatefulBrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  expect(win.getBounds().width).toBe(800);
  expect(win.getBounds().height).toBe(600);
  expect(win.getBounds().x).toBe(356);
  expect(win.getBounds().y).toBe(191);
});
