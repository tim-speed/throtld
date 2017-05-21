const db = require('../../../lib/db');
const auth = require('../../../lib/auth');
const middleware = require('../../../lib/middleware');

module.exports = {
  auth: true,
  middleware: [
    auth.decryptBodyHandler,
    middleware.buildJSONBody
  ],
  handler(req, res) {
    // Set the feature in the database
    // TODO: Establish ownership of the app, before setting the feature
    db.feature.put(req.body.id, req.body.feature.key, req.body.feature.segments)
      .then(() => {
        res.send();
      }, (err) => {
        res.status(500).send('Failed to set feature, app does not exist?');
      });
  }
};
