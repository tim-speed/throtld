const db = require('../../lib/db');
const auth = require('../../lib/auth');

module.exports = {
  middleware: [
    auth.processJWT
  ],
  handler(req, res) {
    // Get features for the user based on JWT subject
    db.feature.getForUser(req.jwt.header.app, req.jwt.payload.sub,
      req.jwt.payload.exp).then((features) => {
        res.send(features);
      }, (err) => {
        res.status(500).send('Failed to get features');
      });
  }
};
