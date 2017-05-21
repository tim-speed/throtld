const db = require('../../lib/db');
const logger = require('../../lib/logger')('GET /v1/apps');

module.exports = {
  auth: true,
  handler(req, res) {
    // Get all app ids for the authed user
    db.app.all(req.session.account._id).then((apps) => {
      res.send(apps.map(app => Object({
        id: app._id,
        accountId: app.account
      })));
    }, (err) => {
      logger.error(`Failed to get apps. account="${req.session.account._id}`);
      res.status(500).send('Failed to get apps from db.');
    });
  }
};
