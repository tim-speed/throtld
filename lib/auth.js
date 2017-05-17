const crypto = require('crypto');
const logger = require('./logger')('auth');

// Lazy wait for config
let config; require('./config').then(cfg => config = cfg);

function checkHash(secret, key, hash) {
  var hmac = crypto.createHmac(config.auth.algorithm, secret);
  hmac.update(key);
  return hmac.digest('hex') === hash.toLowerCase();
}

const auth = module.exports = {
  authHandler(req, res, next) {
    const authToken = req.headers[config.auth.strategy + '-token'];
    const authHash = req.headers[config.auth.strategy + '-hash'];
    const authParts = new Buffer(authToken || '', 'base64').toString('utf8')
      .split(':');
    const authUser = authParts[0];
    const authKey = authParts[1];
    let authSecret;

    // Validate and lookup users
    logger.trace('Checking hash: user="%s",key="%s",hash="%s"', authUser,
      authKey, authHash);
    if (!authUser || !authHash || !authKey ||
      !(authSecret = config.auth.users[authUser]) ||
      !checkHash(authSecret, authKey, authHash)) {
      logger.warn('Invalid auth: user="%s",key="%s",hash="%s"', authUser,
        authKey, authHash);
      return res.status(401).send('Incorrect or missing auth headers.');
    }
    // Allow the next express middleware to execute, and make our user known to
    //  the "session"
    (req.session = req.session || {}).user = authUser;
    next();
  },
  encryptMessage(message, key) {
    const cipher = crypto.createCipher(config.auth.encryption, key);
    const encrypted = cipher.update(message, 'utf8', config.auth.encoding);
    return encrypted + cipher.final(config.auth.encoding);
  },
  decryptMessage(message, key, outputEncoding = 'utf8') {
    if (message instanceof Buffer) {
      message = message.toString('utf8');
    }
    const decipher = crypto.createDecipher(config.auth.encryption, key);
    const decrypted = decipher.update(message, config.auth.encoding,
      outputEncoding);
    return decrypted + decipher.final(outputEncoding);
  },
  decryptBodyHandler(req, res, next) {
    // Decrypt
    try {
      // Decrypt the message as a buffer, with the secret
      req._buffer = auth.decryptMessage(req._buffer,
        config.auth.users[req.session.user], null);
      next();
    } catch (ex) {
      logger.error(`Failed to decrypt encrypted message body: ${ex}`);
      res.status(500).send('Failed to decrypt message body.');
    }
  }
};
