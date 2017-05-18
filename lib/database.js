const uuid = require('uuid');
const logger = require('./logger')('database');

Promise.all([
  require('./config'),
]).then(([config]) => {
  logger.info('database loaded');
});

const apps = {};

const database = module.exports = {
  createApp(ownerId, secret) {
    const appId = uuid.v4();
    apps[appId] = {
      appId,
      ownerId,
      secret
    };
    return appId;
  },
  deleteApp(ownerId, appId) {
    const app = apps[appId];
    if (app && app.ownerId === ownerId) {
      delete apps[appId];
      return true;
    }
    // TODO: Handle multiple error cases, not found, not owner
    return false;
  },
  getApps(ownerId) {
    // TODO: Maintain an index by ownerId
    return Object.values(apps).filter(app => app.ownerId === ownerId)
      .map(app => app.appId);
  },
  setFeature(ownerId, appId, feature) {
    const app = apps[appId];
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
    const app = apps[appId];
    if (app && app.ownerId === ownerId && app.features && app.features[key]) {
      delete app.features[key];
      // TODO: Consider modifying existing users based on feature change?
      return true;
    }
    // TODO: Handle multiple error cases, not found, not owner, no feature
    return false;
  },
  getFeatures(appId, userId, expiry) {
    const app = apps[appId];
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
