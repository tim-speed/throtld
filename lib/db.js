const mongodb = require('mongodb');
const fs = require('fs');
const path = require('path');
const logger = require('./logger')('db');

const dbObj = module.exports = {
  promise: require('./config').then(config => {
    const mongoURI = global.describe ? config.test.mongoURI :
      config.db.mongoURI;
    logger.debug(`Connecting to Mongo. URI="${mongoURI}"`);
    return new Promise((resolve, reject) => {
      mongodb.connect(mongoURI, (connectErr, mongoConnection) => {
        if (connectErr) {
          logger.error(
            `Failed to connect to db. URI="${mongoURI}" : ${connectErr}`);
          return reject(connectErr);
        }
        dbObj.connection = mongoConnection;
        logger.info(`Connected to database. URI="${mongoURI}"`);
        // Load DB Models
        const modelDir = path.join(__dirname, 'models');
        fs.readdir(modelDir, (err, files) => {
          if (err) {
            logger.error(`Failed to read db model dir: ${err}`);
            reject(err);
          }
          for (const fileName of files) {
            const modelPath = path.join(modelDir, fileName);
            require(modelPath)(dbObj, mongoConnection, mongodb);
          }
          logger.debug(`Database models loaded`);
          resolve(dbObj);
        });
      });
    });
  })
};
