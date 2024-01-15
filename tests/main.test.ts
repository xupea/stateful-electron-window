import path from "path";
import { readFileSync } from "jsonfile";

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
  };
});

beforeEach(() => {
  (readFileSync as any).mockClear();
});

test("tries to read state file from the default location", () => {
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
  expect(readFileSync).toHaveBeenCalledWith(
    "/path/to/user/data/window-state.json",
  );
});

test("tries to read state file from the configured source", () => {
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
  expect(readFileSync).toHaveBeenCalledWith("/path/custom/data/state.json");
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
    configFilePath: "/path/custom/data",
    configFileName: "state.json",
  });

  expect(win.getBounds().width).not.toBe(100);
});
