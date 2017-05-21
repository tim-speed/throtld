const db = require('../../lib/db');
const auth = require('../../lib/auth');
const middleware = require('../../lib/middleware');
const logger = require('../../lib/logger')('POST /v1/app');

module.exports = {
  auth: true,
  middleware: [
    auth.decryptBodyHandler,
    middleware.buildJSONBody
  ],
  handler(req, res) {
    // Create app with secret
    // And return AppId
    db.app.create(req.session.account._id, req.body.secret).then((id) => {
      res.send({
        id
      });
    }, (err) => {
      logger.error(
        `Failed to create new app for account="${req.session.account._id}"`);
      res.status(500).send('Failed to add account to the database.');
    });
  }
};
