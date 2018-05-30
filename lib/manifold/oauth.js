const ClientOAuth2 = require('client-oauth2');
const logger = require('../logger')('manifold-oauth');
let oauth;
let authorizationUri;
let accessTokenUri;
require('../config').then(config => {
  const oauthCfg = config.manifold.oauth || {};
  authorizationUri = process.env.CONNECTOR_URL || oauthCfg.connectorUrl || '';
  accessTokenUri = authorizationUri[authorizationUri.length - 1] === '/' ?
    (authorizationUri + 'oauth/tokens') : authorizationUri + '/oauth/tokens';
  oauth = new ClientOAuth2({
    clientId: process.env.CLIENT_ID || oauthCfg.clientId,
    clientSecret: process.env.CLIENT_SECRET || oauthCfg.clientSecret,
    authorizationUri,
    accessTokenUri
  });
});

module.exports = {
  /**
   * Middleware to verify that the request has valid oauth credentials
   */
  verifyOAuth(req, res, next) {
    // This expects and takes req.query.code
    oauth.code.getToken(req).then(token => {
      // Store token
      req.oauth = token;
      next();
    }).catch(err => {
      logger.warn(`Failed to verify oauth, code="${req.query.code}": ${err}`);
      res.status(401).send({
        message: 'oauth error'
      });
    });
  }
};
