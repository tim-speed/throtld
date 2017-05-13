const util = require('./util');
const logger = require('./logger')('config');

/**
 * Helper used for merging config objects
 */
function recursiveObjectTreeApply(objDefault, objOverride) {
  for (const prop in objOverride) {
    const val = objOverride[prop];
      if (typeof val === 'object' && val) {
        let valDefault = objDefault[prop];
        // Default to empty obj when undefined
        if (valDefault === undefined) {
          objDefault[prop] = valDefault = {};
        }
        recursiveObjectTreeApply(valDefault, val);
      } else {
        objDefault[prop] = val;
      }
  }
}

module.exports = new Promise((resolve, reject) => {
  // Read default config
  util.readYamlFile('../config.default.yml').then((defaultConfig) => {
    // Read user config
    util.readYamlFile('../config.yml').then(userConfig => {
      // Merge then resolve
      const config = util.deepClone(defaultConfig);
      recursiveObjectTreeApply(config, userConfig);
      resolve(config);
    }, err => {
      // Warn and resolve
      logger.warn('Error while reading config.yaml: %s', err);
      resolve(defaultConfig);
    });
  }, err => {
    // Fatal, could not read default config
    throw err;
  });
});
