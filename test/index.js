// TODO: Multi worker?

const fs = require('fs');
const path = require('path');
const logger = require('../lib/logger')('mocha-init');

let _loadedTests = {};
let _require = require;

// Promise debugging
process.on('unhandledRejection', function unhandledPromise(reason) {
  logger.fatal(`Unhandled promise rejection: ${reason.stack}`);
  process.exit(1);
});

/**
 * Simple require alternative that preserves scope
 */
function requireTest(testPath) {
  let test = _loadedTests[testPath];
  if (test) {
    return test;
  }
  console.log(`Loading test: ${testPath}`);
  // jshint unused:false
  let require = function requireHijack(modulePath) {
    let pathStart = modulePath.substr(0, 2);
    if (pathStart === './' || pathStart === '..') {
      return _require(path.resolve(path.dirname(testPath), modulePath));
    } else {
      // Global module
      return _require(modulePath);
    }
  };
  let module = {};
  eval(fs.readFileSync(testPath, { encoding: 'utf8' }));
  _loadedTests[testPath] = module.exports;
  return module.exports;
}

/**
 * Recursive function to describe tests in sub-dirs
 */
function recursiveDescribe(dirPath, filter) {
  let children = fs.readdirSync(dirPath);
  for (let child of children) {
    if (filter && ~filter.indexOf(child)) {
      // Skip filtered items
      continue;
    }
    let childPath = path.resolve(dirPath, child);
    let childStat = fs.statSync(childPath);
    if (childStat.isDirectory()) {
      // Describe tests in dir recursively
      describe(child, () => recursiveDescribe(childPath));
    } else if (childStat.isFile() && path.extname(child) === '.js') {
      // Load and setup test
      let childTest = requireTest(childPath);
      if (typeof childTest === 'function') {
        childTest();
      }
    }
  }
}

// Start
recursiveDescribe(__dirname, ['index.js', 'utils.js']);
