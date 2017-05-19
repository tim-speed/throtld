module.exports = function(req, res) {
  res.send('I am alive!');
};
const database = require('../../lib/database');
const auth = require('../../lib/auth');

module.exports = {
  middleware: [
    auth.processJWT
  ],
  handler(req, res) {
    // Get features for the user based on JWT subject
    res.send(database.getFeatures(req.jwt.header.app, req.jwt.payload.sub,
      req.jwt.payload.exp));
  }
};
