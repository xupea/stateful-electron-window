import {
  app,
  screen,
  BrowserWindow,
  BrowserWindowConstructorOptions,
  Rectangle,
} from "electron";
import path from "path";
import jsonfile from "jsonfile";
import { mkdirp } from "mkdirp";

interface ExtraOptions {
  /** The path where the state file should be written to. Defaults to `app.getPath('userData')`. */
  configFilePath?: string;
  /** The name of file. Defaults to `window-state.json`. */
  configFileName?: string;
  /** Should we automatically maximize the window, if it was last closed maximized. Defaults to `true`. */
  supportMaximize?: boolean;
}

interface State {
  displayBounds?: Rectangle;
  /** The saved height of loaded state. `defaultHeight` if the state has not been saved yet. */
  height: number;
  /** `true` if the window state was saved while the window was maximized. `undefined` if the state has not been saved yet. */
  isMaximized?: boolean;
  /** The saved width of loaded state. `defaultWidth` if the state has not been saved yet. */
  width: number;
  /** The saved x coordinate of the loaded state. `undefined` if the state has not been saved yet. */
  x?: number;
  /** The saved y coordinate of the loaded state. `undefined` if the state has not been saved yet. */
  y?: number;
}

const eventHandlingDelay = 100;

function hasBounds(state: State) {
  return (
    state &&
    Number.isInteger(state.x) &&
    Number.isInteger(state.y) &&
    Number.isInteger(state.width) &&
    state.width > 0 &&
    Number.isInteger(state.height) &&
    state.height > 0
  );
}

function validateState(state: State) {
  const isValid = state && (hasBounds(state) || state.isMaximized);
  if (!isValid) {
    return null;
  }

  if (hasBounds(state) && state.displayBounds) {
    return ensureWindowVisibleOnSomeDisplay(state);
  }

  return state;
}

function ensureWindowVisibleOnSomeDisplay(state: State) {
  const visible = screen.getAllDisplays().some((display) => {
    return windowWithinBounds(state, display.bounds);
  });

  if (!visible) {
    // Window is partially or fully not visible now.
    // Reset it to safe defaults.
    return null;
  }

  // for multi monitor support and scaling (devicePixelRatio)
  const display = screen.getDisplayMatching({
    x: state.x!,
    y: state.y!,
    width: state.displayBounds!.width,
    height: state.displayBounds!.height,
  });

  const newWidth = ~~(state.width / display.scaleFactor);
  const newHeight = ~~(state.height / display.scaleFactor);

  return { ...state, width: newWidth, height: newHeight };
}

function windowWithinBounds(state: State, bounds: Rectangle) {
  return (
    state.x! >= bounds.x &&
    state.y! >= bounds.y &&
    state.x! + state.width <= bounds.x + bounds.width &&
    state.y! + state.height <= bounds.y + bounds.height
  );
}

function refineOptionsAndState(
  options: BrowserWindowConstructorOptions & ExtraOptions,
): BrowserWindowConstructorOptions & { isMaximized?: boolean } {
  const {
    configFilePath = app.getPath("userData"),
    configFileName = "window-state.json",
    supportMaximize,
    ...restOriginalOptions
  } = options;

  let savedState = null;

  try {
    savedState = jsonfile.readFileSync(
      path.join(configFilePath, configFileName),
    );
  } catch (err) {
    // Don't care
  }

  savedState = validateState(savedState);

  if (!savedState) {
    return restOriginalOptions;
  }

  const { x, y, width, height, isMaximized } = savedState;

  return { ...restOriginalOptions, x, y, width, height, isMaximized };
}

export class StatefulBrowserWindow extends BrowserWindow {
  private stateChangeTimer?: ReturnType<typeof setTimeout>;

  private state: State | null = null;

  private fullStoreFileName: string;

  constructor(options: BrowserWindowConstructorOptions & ExtraOptions) {
    const {
      configFilePath = app.getPath("userData"),
      configFileName = "window-state.json",
      supportMaximize,
    } = options;

    const newOptions = refineOptionsAndState(options);

    super(newOptions);

    const { x, y, width = 800, height = 600, isMaximized } = newOptions;

    this.state = { x, y, width, height, isMaximized };

    this.fullStoreFileName = path.join(configFilePath, configFileName);

    this.manage(supportMaximize);
  }

  private manage(supportMaximize?: boolean) {
    if (supportMaximize && this.state?.isMaximized) {
      this.maximize();
    }

    this.on("resize", this.stateChangeHandler);
    this.on("move", this.stateChangeHandler);
    this.on("close", this.closeHandler);
    this.on("closed", this.closedHandler);
  }

  private unmanage() {
    this.removeListener("resize", this.stateChangeHandler);
    this.removeListener("move", this.stateChangeHandler);
    clearTimeout(this.stateChangeTimer);
    this.removeListener("close", this.closeHandler);
    this.removeListener("closed", this.closedHandler);
  }

  private stateChangeHandler() {
    // Handles both 'resize' and 'move'
    clearTimeout(this.stateChangeTimer);
    this.stateChangeTimer = setTimeout(this.updateState, eventHandlingDelay);
  }

  private closedHandler() {
    // Unregister listeners and save state
    this.unmanage();
    this.saveState();
  }

  private closeHandler() {
    this.updateState();
  }

  private updateState() {
    try {
      const winBounds = this.getBounds();
      if (this.isNormal()) {
        this.state!.x = winBounds.x;
        this.state!.y = winBounds.y;
        this.state!.width = winBounds.width;
        this.state!.height = winBounds.height;
      }
      this.state!.isMaximized = this.isMaximized();
      this.state!.displayBounds = screen.getDisplayMatching(winBounds).bounds;
    } catch (err) {}
  }

  private saveState() {
    // Save state
    try {
      mkdirp.sync(path.dirname(this.fullStoreFileName));
      jsonfile.writeFileSync(this.fullStoreFileName, this.state);
    } catch (err) {
      // Don't care
      console.log(err);
    }
  }
}
