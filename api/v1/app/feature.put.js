const database = require('../../../lib/database');
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
    if (database.setFeature(req.session.user, req.body.id, req.body.feature)) {
      res.send();
    } else {
      res.status(500).send('Failed to set feature, app does not exist?');
    }
  }
};
