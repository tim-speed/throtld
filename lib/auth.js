// TODO: Async auth / JWT operations

const crypto = require('crypto');
const jws = require('jws');
const db = require('./db');
const validate = require('./validate');
const logger = require('./logger')('auth');

// Lazy wait for config
let config; require('./config').then(cfg => config = cfg);

const auth = module.exports = {

  /**
   * Simple hash checker
   */
  checkHash(secret, key, hash) {
    var hmac = crypto.createHmac(config.auth.algorithm, secret);
    hmac.update(key);
    return hmac.digest('hex') === hash.toLowerCase();
  },

  /**
   * Middleware to handle user authentication, using a shared secret key.
   */
  authHandler(req, res, next) {
    const authToken = req.headers[config.auth.strategy + '-token'];
    const authHash = req.headers[config.auth.strategy + '-hash'];
    const authParts = new Buffer(authToken || '', 'base64').toString('utf8')
      .split(':');
    const authUser = authParts[0];
    const authKey = authParts[1];

    db.account.getByName(authUser).then((account) => {
      // Validate and lookup users
      logger.trace('Checking hash: user="%s",key="%s",hash="%s"', authUser,
        authKey, authHash);
      if (!authUser || !authHash || !authKey || !account ||
        !auth.checkHash(account.secret, authKey, authHash)) {
        logger.warn('Invalid auth: user="%s",key="%s",hash="%s"', authUser,
          authKey, authHash);
        return res.status(401).send('Incorrect or missing auth headers.');
      }
      // Allow the next express middleware to execute, and make our user known to
      //  the "session"
      (req.session = (req.session || {})).account = account;
      next();
    }, (err) => {
      logger.error(`Failed to query accounts collection. ` +
        `accountName="${authUser}", authKey="${authKey}"`);
      res.status(500).send('Failed to check auth, please try again later.');
    });
  },

  /**
   * Encrypt a message with the specified key based on the encryption specified
   *  in config.
   */
  encryptMessage(message = '', key = '', encryption = config.auth.encryption) {
    const cipher = crypto.createCipher(encryption, key);
    const encrypted = cipher.update(message, 'utf8', config.auth.encoding);
    return encrypted + cipher.final(config.auth.encoding);
  },

  /**
   * Decrypt a message with the specified key based on the encryption specified
   *  in config.
   */
  decryptMessage(message = '', key = '', outputEncoding = 'utf8',
   encryption = config.auth.encryption) {
    if (message instanceof Buffer) {
      message = message.toString('utf8');
    }
    const decipher = crypto.createDecipher(encryption, key);
    const decrypted = decipher.update(message, config.auth.encoding,
      outputEncoding);
    return decrypted + decipher.final(outputEncoding);
  },

  /**
   * Middleware that decrypts the request body using the current user's private
   *  key.
   */
  decryptBodyHandler(req, res, next) {
    // Decrypt
    try {
      // Decrypt the message as a buffer, with the secret
      req._buffer = auth.decryptMessage(req._buffer,
        req.session.account.secret, null);
      next();
    } catch (ex) {
      logger.error(`Failed to decrypt encrypted message body: ${ex}`);
      res.status(500).send('Failed to decrypt message body.');
    }
  },

  /**
   * Middleware to parse out and handle JSON web tokens
   */
  processJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400)
        .send('Missing JSON Web Token in Authorization header');
    }
    // Parse token
    const authHeaderParts = authHeader.split(' ');
    const tokenString = authHeaderParts[1];
    let token;
    try {
      token = jws.decode(tokenString);
    } catch (ex) {
      logger.error(`Failed to parse JSON web token: ${ex}`);
      return res.status(500).send('Invalid JSON in JSON Web token payload, ' +
        'please refrain from using "JWT" as the "typ" in header when ' +
        'encrypting the token payload with the secret.');
    }
    if (!token) {
      return res.status(400).send('Invalid JSON Web token, could not decode.');
    }
    // Verify app
    const appId = token.header.app;
    if (!appId || !validate.isMongoObjectID(appId)) {
      return res.status(400).send('Missing valid App id "app" in JWT header.');
    }
    db.app.get(appId).then(app => {
      if (!app) {
        return res.status(400)
          .send('App defined in JWT header does not exist.');
      }
      // Verify web token
      try {
        if (!jws.verify(tokenString, token.header.alg, app.secret)) {
          return res.status(400)
            .send('JWT has an incorrect signature.');
        }
      } catch (ex) {
        logger.error(`Failed to verify JSON web token: ${ex}`);
        return res.status(500)
          .send('Failed to verify JSON web token, you may ' +
          'have provided an invalid "alg" value in the header.');
      }
      // Attempt to decrypt the token body with the secret
      if (typeof token.payload !== 'object') {
        try {
          token.payload = auth.decryptMessage(token.payload, app.secret);
          token.payload = JSON.parse(token.payload);
        } catch (ex) {
          logger.error(
            `Failed to parse encrypted JSON web token payload: ${ex}`);
          return res.status(500).send('Bad payload in JSON web token, either ' +
            'it was not encrypted properly, or after decryption it contained ' +
            'invalid JSON.');
        }
      }
      const subject = token.payload.sub = token.payload.sub || token.header.sub;
      if (!subject) {
        return res.status(400)
          .send('JWT is missing its "sub" property in its ' +
          'payload and header. This is required to identify the subject/user ' +
          'of the JWT. Please provide it in either the payload or header.');
      }
      let expiry = token.payload.exp = Number(token.payload.exp ||
        token.header.exp);
      if (isNaN(expiry)) {
        return res.status(400)
          .send('JWT is missing its "exp" property in its ' +
          'payload and header. This is requred to define an end time for ' +
          'which the JWT becomes invalid.');
      }
      const now = Date.now();
      expiry = Number(expiry);
      if (expiry <= now) {
        // TODO: Check for user in DB and clear it.
        return res.status(400).send('JWT has expired.');
      }
      const maxExpiry = config.auth.jwt.maxExpiryTimeMS;
      if (maxExpiry && expiry > now + maxExpiry) {
        return res.status(400).send('JWT expiry is set too far in the future.');
      }
      // Set the token on request, and continue
      req.jwt = token;
      next();
    }, err => {
      logger.error(`Failed to find app. id="${appId}"`);
      res.status(500).send('Failed to find app specified in JWT.');
    });
  }
};
