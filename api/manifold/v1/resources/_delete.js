const db = require('../../../../lib/db');
const verifier = require('../../../../lib/manifold/verifier');
const middleware = require('../../../../lib/middleware');
const validate = require('../../../../lib/validate');
const logger = require('../../../../lib/logger')
  ('DELETE /manifold/v1/resources/:id');

module.exports = {
  middleware: [
    middleware.checkParams({
      id: val => validate.isManifoldID(val) || 'invalid resource id'
    }),
    verifier.verifyManifoldRequest
  ],
  handler(req, res) {
    // Look for app
    db.resource.get(req.params.id).then(resource => {
      // Check if the resource exists
      if (!resource) {
        return res.status(404).send({
          message: 'no such resource'
        });
      }
      return db.resource.delete(req.params.id).then(() => {
        res.status(204).send();
      });
    }).catch(err => {
      logger.error(`Failed to delete manifold resource. ` +
        `id="${req.params.id}": ${err}`);
      res.status(500).send({
        message: 'failed to delete throtld test plan'
      });
    });
  }
};
