const database = require('../../lib/database');

module.exports = {
  auth: true,
  handler(req, res) {
    // Get all app ids for the authed user
    res.send(database.getApps(req.session.user));
  }
};
