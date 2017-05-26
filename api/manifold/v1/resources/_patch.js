const db = require('../../../../lib/db');
const verifier = require('../../../../lib/manifold/verifier');
const middleware = require('../../../../lib/middleware');
const validate = require('../../../../lib/validate');
const logger = require('../../../../lib/logger')
  ('PATCH /manifold/v1/resources/:id');

module.exports = require('../../../../lib/config').then(config => Object({
  middleware: [
    middleware.checkParams({
      id: val => validate.isManifoldID(val) || 'invalid resource id'
    }),
    verifier.verifyManifoldRequest,
    middleware.buildJSONBody,
    middleware.checkJSON({
      plan: val => config.manifold.plans.includes(val) || 'bad plan'
    })
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
      return db.resource.update(req.params.id, req.body.plan).then(() => {
        res.status(200).send({
          message: 'your throtld test plan has been updated'
        });
      });
    }).catch(err => {
      logger.error(`Failed to update manifold resource. ` +
        `id="${req.params.id}", plan="${req.body.plan}": ${err}`);
      res.status(500).send({
        message: 'failed to update throtld test plan'
      });
    });
  }
}));
