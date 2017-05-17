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
    // Create app with secret
    // And return AppId
    res.send({
      id: database.createApp(req.session.user, req.body.secret)
    });
  }
};
