const db = require('../../../../lib/db');
const verifier = require('../../../../lib/manifold/verifier');
const middleware = require('../../../../lib/middleware');
const validate = require('../../../../lib/validate');
const logger = require('../../../../lib/logger')
  ('DELETE /manifold/v1/credentials/:id');

module.exports = {
  middleware: [
    middleware.checkParams({
      id: val => validate.isManifoldID(val) || 'invalid credential id'
    }),
    verifier.verifyManifoldRequest
  ],
  handler(req, res) {
    // Look for app
    db.account.getByManifoldId(req.params.id).then(credential => {
      // Make sure the credential exists
      if (!credential) {
        return res.status(404).send({
          message: 'no such credential'
        });
      }
      return db.account.deleteByManifoldId(req.params.id).then(() => {
        res.status(204).send();
      });
    }).catch(err => {
      logger.error(`Failed to delete throtld credentials. ` +
        `id="${req.params.id}": ${err}`);
      res.status(500).send({
        message: 'failed to delete throtld credentials'
      });
    });
  }
};
