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
    // Delete the feature in the database
    if (database.deleteFeature(req.session.user, req.body.id,
     req.body.feature.key)) {
      res.send(true);
    } else {
      res.status(500).send('Failed to delete feature, does not exist?');
    }
  }
};
