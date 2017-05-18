const database = require('../../lib/database');
const auth = require('../../lib/auth');
const middleware = require('../../lib/middleware');

module.exports = {
  auth: true,
  middleware: [
    auth.decryptBodyHandler,
    middleware.buildJSONBody
  ],
  handler(req, res) {
    // Delete app
    if (database.deleteApp(req.session.user, req.body.id)) {
      res.send();
    } else {
      res.status(500).send('Failed to delete app, does not exist?');
    }
  }
};
