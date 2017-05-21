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
    // Delete the feature in the database
    // TODO: Establish ownership of the app, before setting the feature
    db.feature.delete(req.body.id, req.body.feature.key)
      .then(() => {
        res.send(true);
      }, (err) => {
        res.status(500).send('Failed to delete feature, does not exist?');
      });
  }
};
