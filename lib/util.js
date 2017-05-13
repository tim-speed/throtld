const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

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
    if (!obj || typeof obj !== 'object') {
      return obj;
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

};
