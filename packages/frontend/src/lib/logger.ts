// utils/console-wrapper.js
const version = __APP_VERSION__;

const originalConsole = { ...console };

const wrapConsoleMethod = (method: string) => {
  return function (...args) {
    originalConsole[method](`[${version}]`, ...args);
  };
};

// Wrap common console methods
console.log = wrapConsoleMethod('log');
console.info = wrapConsoleMethod('info');
console.warn = wrapConsoleMethod('warn');
console.warn = wrapConsoleMethod('table');
console.error = wrapConsoleMethod('error');
console.debug = wrapConsoleMethod('debug');
console.trace = wrapConsoleMethod('trace');
