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

const database = {
  apps: {},
  setFeature(ownerId, appId, feature) {
    const app = database.apps[appId];
    if (app && app.ownerId === ownerId) {
      const features = app.features = app.features || {};
      features[feature.key] = {
        key: feature.key,
        segments: feature.segments
      };
      // TODO: Consider modifying existing users based on feature change?
      return true;
    }
    // TODO: Handle multiple error cases, not found, not owner
    return false;
  },
  deleteFeature(ownerId, appId, key) {
    const app = database.apps[appId];
    if (app && app.ownerId === ownerId && app.features && app.features[key]) {
      delete app.features[key];
      // TODO: Consider modifying existing users based on feature change?
      return true;
    }
    // TODO: Handle multiple error cases, not found, not owner, no feature
    return false;
  },
  getFeatures(appId, userId, expiry) {
    const app = database.apps[appId];
    if (app) {
      const users = app.users = app.users || {};
      let user = users[userId];
      if (user) {
        // Update expiry
        user.expiry = expiry;
        // TODO: consider checking for feature updates ( new features )
        // Return features
        return user.features;
      } else {
        user = users[userId] = {
          userId,
          appId,
          expiry
        };
        // Build features from app
        user.features = Object.values(app.features).reduce((map, feature) => {
          const totalWeight = feature.segments
            .reduce((sum, seg) => sum + seg.weight, 0);
          const targetWeight = Math.random() * totalWeight;
          let currentWeight = 0;
          // Accumulate weight until we find the item
          // TODO: Optimize search,
          //  though these will probably be pretty small lists
          for (const seg of feature.segments) {
            currentWeight += seg.weight;
            if (targetWeight <= currentWeight) {
              map[feature.key] = seg.value;
              return map;
            }
          }
          throw new Error(`Failed to calculate feature values for: ` +
            `app="${appId}", user="${userId}", feature="${feature.key}"`);
        }, {});
        return user.features;
      }
    }
    return false;
  }
};
