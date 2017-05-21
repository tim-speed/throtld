const db = require('../../lib/db');
const auth = require('../../lib/auth');
const middleware = require('../../lib/middleware');
const logger = require('../../lib/logger')('DELETE /v1/app');

module.exports = {
  auth: true,
  middleware: [
    auth.decryptBodyHandler,
    middleware.buildJSONBody
  ],
  handler(req, res) {
    // Delete app
    logger.trace(`User attempting to delete app. ` +
      `account="${req.session.account._id}",appId="${req.body.id}"`);
    db.app.get(req.body.id).then((app) => {
      if (!app ||
       app.account.toString() !== req.session.account._id.toString()) {
        if (!app) {
          logger.warn(`User attempted to delete non-existant app. ` +
            `account="${req.session.account._id}",appId="${req.body.id}"`);
        } else {
          logger.warn(`User attempted to delete an app they didn't own. ` +
            `account="${req.session.account._id}",appId="${req.body.id}"`);
        }
        return res.status(403).send('You do not have access to this app.');
      }
      db.app.delete(req.body.id).then(() => {
        res.send();
      }, (err) => {
        logger.error(
          `Failed to delete app. account="${req.session.account._id}",` +
          `appId="${req.body.id}"`);
        res.status(500).send('Failed to delete app from database.');
      });
    }, (err) => {
      logger.error(
        `Failed to find app to delete. account="${req.session.account._id}",` +
        `appId="${req.body.id}"`);
      res.status(500).send('Failed to find app to delete.');
    });
  }
};
