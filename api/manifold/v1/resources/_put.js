const db = require('../../../../lib/db');
const verifier = require('../../../../lib/manifold/verifier');
const middleware = require('../../../../lib/middleware');
const validate = require('../../../../lib/validate');
const logger = require('../../../../lib/logger')
  ('PUT /manifold/v1/resources/:id');

module.exports = require('../../../../lib/config').then(config => Object({
  middleware: [
    middleware.checkParams({
      id: val => validate.isManifoldID(val) || 'invalid resource id'
    }),
    verifier.verifyManifoldRequest,
    middleware.buildJSONBody,
    middleware.checkJSON({
      product: val => config.manifold.products.includes(val) || 'bad product',
      plan: val => config.manifold.plans.includes(val) || 'bad plan',
      region: val => config.manifold.regions.includes(val) || 'bad region'
    })
  ],
  handler(req, res) {
    // Look for app
    db.resource.get(req.params.id).then(resource => {
      // Check if the resource exists, and any property differs
      if (resource) {
        if (resource.product !== req.body.product ||
         resource.plan !== req.body.plan ||
         resource.region !== req.body.region) {
          return res.status(409).send({
            message: 'resource already exists'
          });
        } else {
          return res.status(201).send({
            message: 'your throtld test plan is now active'
          });
        }
      }
      return db.resource.create(req.params.id, req.body.product, req.body.plan,
       req.body.region).then(resourceId => {
        res.status(201).send({
          message: 'your throtld test plan is nowactive'
        });
      });
    }).catch(err => {
      logger.error(`Failed to provision new manifold resource. ` +
        `id="${req.params.id}", product="${req.body.product}", ` +
        `plan="${req.body.plan}", region="${req.body.region}": ${err}`);
      res.status(500).send({
        message: 'failed to provision throtld test plan'
      });
    });
  }
}));
