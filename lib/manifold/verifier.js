const Verifier = require('@manifoldco/signature').Verifier;
const logger = require('../logger')('manifold-verifier');
// Lazyload verifier, dependant on config, this should be okay because we only
//  export middleware
let verifier;
require('../config').then(config => {
  verifier = new Verifier(process.env.MASTER_KEY || config.manifold.masterKey);
});

module.exports = {
  /**
   * Middleware to verify that the request was from Manifold
   */
  verifyManifoldRequest(req, res, next) {
    verifier.test(req, req._buffer.toString('utf8')).then(next, err => {
      // Verification issue
      logger.warn(`Failed to verify manifold request: %s`, err);
      // Response taken from ruby-sinatra-example:
      res.status(401).send({
        message: 'bad signature'
      });
    });
  }
};
