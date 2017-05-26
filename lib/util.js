const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const util = module.exports = {

  /**
   * Simple helper that takes in a string path, and provides a promise that
   *  resolves if the path is a file, returning the file stats object; else the
   *  promise is rejected and supplied the error.
   */
  fileExists(path = '') {
    return new Promise((resolve, reject) => {
      fs.stat(path, (err, stats) => {
        if (err) {
          return reject(err);
        }
        if (stats.isFile()) {
          return resolve(stats);
        }
        reject(new Error(
          `File system entry at path '${path}' exists, but is not a file.`));
      });
    });
  },

  /**
   * Reads a yaml file from a provided path, and returns a promise that resolves
   *  to a JavaScript object if the file was successfully parsed; else the
   *  promise is rejected and supplied the error.
   */
  readYamlFile(path = '') {
    return new Promise((resolve, reject) => {
      // Try read
      fs.readFile(path, 'utf8', (err, data) => {
        if (err) {
          return reject(err);
        }
        // Try parse
        let obj;
        try {
          obj = yaml.safeLoad(data);
        } catch (ex) {
          return reject(ex);
        }
        // Return
        resolve(obj);
      });
    });
  },

  /**
   * Simple object deep clone helper
   */
  deepClone(obj = {}) {
    // TODO: Implement infinite recursion prevention by maintaining and
    //  checking ancestry
    if (!obj || typeof obj !== 'object') {
      return obj;
    }
    if (obj instanceof Array) {
      return obj.map(util.deepClone);
    }
    return Object.keys(obj).reduce((newObj, key) => {
      newObj[key] = util.deepClone(obj[key]);
      return newObj;
    }, {});
  },

  /**
   * Synchronously creates all the directories in a path, USE ONLY IN APP INIT!
   */
  makeDirAndParentsSync(dirPath = '', mode = 0o0777) {
    // Resolve relative paths even
    dirPath = path.resolve(dirPath);
    try {
      fs.mkdirSync(dirPath, mode);
    } catch (mkdirErr) {
        if (mkdirErr.code === 'ENOENT') {
          return util.makeDirAndParentsSync(path.dirname(dirPath), mode);
        } else {
          try {
            const stat = fs.statSync(dirPath);
            if (!stat.isDirectory()) {
              return mkdirErr;
            }
          } catch (statErr) {
            // Fs entry not readable or fs read-only?
            return statErr;
          }
        }
    }
    return null;
  },

  /**
   * Runs a timeout loop, around a provided function that provides returns a
   *  falsey value if it wants to be rerun. Returns a function that can be
   *  called to cancel the timeout
   */
  conditionalTimeoutLoop(func, interval = 100) {
    let timeoutId;
    function startTimeout() {
      timeoutId = setTimeout(function conditionalTimeoutLoopExecutor() {
        if (!func()) {
          // Rerun after $interval
          startTimeout();
        }
      }, interval);
    }
    // Start the loop
    startTimeout();
    return function cancelLoop() {
      clearTimeout(timeoutId);
    };
  },

  /**
   * Injects a promise into the chain of a function that already is expected to
   *  return a promise like object.
   */
  delayedFunction(context, funcName, promise) {
    const originalFunction = context[funcName];
    return function delayed(...args) {
      return promise.then(val => {
        return originalFunction.apply(context, args);
      });
    };
  },

  /**
   * Generates a 256 byte secret key asynchronously as base64 string
   *  returns a promise
   */
  generateBase64Code(byteLength = 256) {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(byteLength, (err, bytes) => {
        if (err) {
          return reject(err);
        }
        resolve(bytes.toString('base64'));
      });
    });
  }

};
