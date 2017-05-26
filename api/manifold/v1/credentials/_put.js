const db = require('../../../../lib/db');
const verifier = require('../../../../lib/manifold/verifier');
const middleware = require('../../../../lib/middleware');
const validate = require('../../../../lib/validate');
const util = require('../../../../lib/util');
const logger = require('../../../../lib/logger')
  ('PUT /manifold/v1/credentials/:id');

module.exports = {
  middleware: [
    middleware.checkParams({
      id: val => validate.isManifoldID(val) || 'invalid credential id'
    }),
    verifier.verifyManifoldRequest,
    middleware.buildJSONBody,
    middleware.checkJSON({
      id: val => validate.isManifoldID(val) || 'invalid credential id',
      resource_id: val => validate.isManifoldID(val) || 'invalid resource id'
    })
  ],
  handler(req, res) {
    // Look for app
    db.resource.get(req.body.resource_id).then(resource => {
      // Make sure the resource exists
      if (!resource) {
        return res.status(404).send({
          message: 'no such resource'
        });
      }
      return Promise.all([
        util.generateBase64Code(64),
        util.generateBase64Code(256)
      ]).then(([key, secret]) => {
        return db.account.create(key, secret, req.body.id, req.body.resource_id)
         .then(accountId => {
          res.status(201).send({
            message: 'your throtld credentials are ready',
            credentials: {
              key,
              secret
            }
          });
        });
      });
    }).catch(err => {
      logger.error(`Failed to create new throtld credentials. ` +
        `id="${req.body.id}", resource_id="${req.body.resource_id}": ${err}`);
      res.status(500).send({
        message: 'failed to create throtld credentials'
      });
    });
  }
};
