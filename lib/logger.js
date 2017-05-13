/*******************************************************************************
* DISCLAIMER: This code is pretty old, there may be better ways to do some of
*  this, but it works :)
*******************************************************************************/

/* jshint noarg:false */

/**
 * Stores a list of all logger objects ( console, files, ... )
 */
const loggers = [];

/**
 * Important variable, that holds the name prefix for the log messages
 * ( Class / Type / Module )
 */
let typeName;

/**
 * The following function is used as a string, modified and eval'd to create
 *  dynamic log functions
 */
function LogTemplateFunction(message) {
  let args = Array.prototype.slice.call(arguments, 1),
    i = 0,
    len = loggers.length,
    caller = arguments.callee.caller,
    callerName = (caller && caller.name) || '',
    outArgs;

  if (callerName === typeName) {
    callerName = '(constructor)';
  } else if (!callerName) {
    while (caller = (caller && caller.caller)) {
      callerName = (caller.name || '(anon)') + '->' + callerName;
      if (caller.name)
        break;
    }
    if (!callerName) {
      callerName += '(anon)';
    } else {
      callerName = '(root)';
    }
  }

  // toString needed args
  args = args.map(function(val) {
    switch (typeof val)
    {
      case 'string':
      case 'number': {
        return val;
      }
      default: {
        return (val || '[null]').toString().replace(/\"/g, '`');
      }
    }
  });

  outArgs = ['[%s]=>%s ' + message, typeName, callerName].concat(args);

  for (; i < len; i++) {
    let logCategory = loggers[i];
    logCategory.LogTemplateFunction.apply(logCategory, outArgs);
  }
}

/**
 * This is the core function we export, that builds a logger object specific to
 *  each item provided
 */
function BuildLogger(typeOrInstance = 'default') {
  // jshint shadow:false
  const typeName = typeof typeOrInstance === 'string' ? typeOrInstance :
    (typeOrInstance.constructor ? typeOrInstance.constructor.name :
      typeOrInstance.name);

  // Function builder to send log to each file category
  function buildLogFunc(logType) {
    return eval('(' + LogTemplateFunction
      .toString().replace(/LogTemplateFunction/g, logType) + ')');
  }

  const logger = {
    trace: buildLogFunc('trace'),
    debug: buildLogFunc('debug'),
    info: buildLogFunc('info'),
    log: buildLogFunc('info'),
    warn: buildLogFunc('warn'),
    error: buildLogFunc('error'),
    fatal: buildLogFunc('fatal'),
    typeName: typeName
  };
  return logger;
}

// Export early because the following code is async
module.exports = BuildLogger;

// INIT
const log4js = require('log4js');
const path = require('path');
const util = require('./util');

// Configure console appender
log4js.configure({
  appenders: [
    {
      type: 'console', category: 'console',
      layout: {
        type: 'pattern',
        pattern: '[%d] [%[%p%]] %m'
      }
    }
  ],
  replaceConsole: false
});
const consoleLogger = log4js.getLogger('console');
consoleLogger.setLevel('trace');
loggers.push(consoleLogger);

if (global.describe) {
  console.info('Logger - Mocha detected, no logs will be saved to the log paths and dropping log level to FATAL.');
  consoleLogger.setLevel('fatal');
  // Don't write logs in mocha mode
  return;
}

// Configure file appenders based on config
log4js.loadAppender('file');

const defaultLogger = log4js.getLogger();
defaultLogger.setLevel('trace');

// This is async, so we've established that there will already be console
//  logging, this just creates some log output files, based on config
require('./config').then((config) => {
  // Create log files for each log category and set their filter level
  for (const logLevel in config.log) {
    let logPath = config.log[logLevel];
    if (!logPath || typeof logPath !== 'string')
      continue;
    // Else resolve path
    logPath = path.resolve(logPath);
    // Make sure the parent dir tree exists
    util.makeDirAndParentsSync(path.dirname(logPath));
    log4js.addAppender(log4js.appenders.file(logPath), logLevel);
    // Set the log
    const fileLogger = log4js.getLogger(logLevel);
    fileLogger.setLevel(logLevel);
    loggers.push(fileLogger);
  }
});