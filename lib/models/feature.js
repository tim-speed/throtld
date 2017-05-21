/**
 * Model for describing and managing features in the database.
 */
module.exports = function feature(db, conn, mongodb) {
  const appCollection = conn.collection('app');
  db.feature = {
    put(appId = '', key = '', segments = []) {
      // Get app
      return db.app.get(appId).then((app) => {
        if (!app) {
          throw new Error('App does not exist!');
        }
        // Modify
        const features = app.features = app.features || {};
        features[key] = {
          key,
          segments
        };
        // TODO: Consider modifying existing users based on feature change?
        // Update
        delete app._id;
        return appCollection.update({
          _id: new mongodb.ObjectID(appId)
        }, app);
      });
    },
    delete(appId = '', key = '') {
      // Get app
      return db.app.get(appId).then((app) => {
        if (!app) {
          throw new Error('App does not exist!');
        }
        // Modify
        const features = app.features = app.features || {};
        if (!features[key]){
          throw new Error('Feature does not exist!');
        }
        delete features[key];
        // TODO: Consider modifying existing users based on feature change?
        // Update
        delete app._id;
        return appCollection.update({
          _id: new mongodb.ObjectID(appId)
        }, app);
      });
    },
    getForUser(appId = '', subjectId = '', expiry = 0) {
      // Get app
      return db.app.get(appId).then((app) => {
        if (!app) {
          throw new Error('App does not exist!');
        }
        return Promise.all([app, db.user.getBySubjectId(subjectId)]);
      }).then(([app, user]) => {
        if (!user) {
          user = {
            app: appId,
            subject: subjectId,
            expiry
          };
          // Calculate features from app
          user.features = Object.values(app.features).reduce((map, feat) => {
            const totalWeight = feat.segments
              .reduce((sum, seg) => sum + seg.weight, 0);
            const targetWeight = Math.random() * totalWeight;
            let currentWeight = 0;
            // Accumulate weight until we find the item
            // TODO: Optimize search,
            //  though these will probably be pretty small lists
            for (const seg of feat.segments) {
              currentWeight += seg.weight;
              if (targetWeight <= currentWeight) {
                map[feat.key] = seg.value;
                return map;
              }
            }
            throw new Error(`Failed to calculate feature values for: ` +
              `app="${appId}", user="${subjectId}", feature="${feat.key}"`);
          }, {});
          // And create new user
          return db.user.create(user).then(() => user.features);
        }
        // Else update user expiry and return features
        user.expiry = expiry;
        return db.user.update(user).then(() => user.features);
      });
    }
  };
};
