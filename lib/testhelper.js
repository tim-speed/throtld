const crypto = require('crypto');
const supertest = require('supertest');
const jws = require('jws');
const util = require('./util');
const auth = require('./auth');
const validate = require('./validate');
const logger = require('./logger')('test-helper');

logger.info(`Setting up Mocha test helper: running node ${process.version}`);

// Block Mocha once available
let _hasMochaRelease_resolve;
const hasMochaRelease = new Promise((resolve) => {
  _hasMochaRelease_resolve = resolve;
});
before((done) => {
  // Wait for MochaRelease promise
  util.conditionalTimeoutLoop(() => {
    if (typeof _hasMochaRelease_resolve === 'function') {
      _hasMochaRelease_resolve(done);
      return true;
    }
    return false;
  }, 3);
});

module.exports = Promise.all([
  require('./config'),
  require('./db').promise
]).then(
  // Drop all collections specified in the config
  ([config, db]) => Promise.all(config.test.clearCollections
    .map(collection => db.connection.collection(collection).drop())
  ).then(() => [config, db], () => [config, db])
).then(
  // Populate the DB with test accounts
  ([config, db]) => Promise.all(Object.keys(config.test.accounts)
    .map(account => {
      // Returns a promise that returns the account id
      const secret = config.test.accounts[account];
      return db.account.create(account, secret).then(id => {
        return {
          id,
          name: account,
          secret
        };
      });
    })
  ).then(testAccounts => [config, db, testAccounts])
).then(([config, db, testAccounts]) => {
  return new Promise((resolve, reject) => {
    // For the sake of simplicity, for now we'll just use the first test account
    const testAccount = testAccounts[0];
    // Setup our supertest request object
    const request = supertest(`http://localhost:${config.server.port}`);
    if (!global.describe) {
      logger.fatal('Mocha not running; describe undefined, this module is ' +
        'meant to provide API testing support to mocha tests.');
      return reject(new Error('Mocha not running!'));
    }
    // Hijack supertest request methods with extra functions
    const methods = ['get', 'post', 'head', 'update', 'delete', 'put'];
    var extraFuncs = {
      auth() {
        // Build auth token
        const key = 'IAmRandomData';
        const token = testAccount.name + ':' + key;
        const encodedToken = new Buffer(token, 'utf8').toString('base64');
        const secret = testAccount.secret;
        const hmac = crypto.createHmac(config.auth.algorithm, secret);
        hmac.update(key);
        const hash = hmac.digest('hex');

        return this.set(config.auth.strategy + '-token', encodedToken)
          .set(config.auth.strategy + '-hash', hash);
      },
      setJWT(header, payload) {
        // Hijack expect so we can do async things before it is really called
        const setJWTHeader = (secret) => {
          if (header.typ !== 'JWT') {
            if (validate.isObject(payload)) {
              payload = JSON.stringify(payload);
            }
            payload = auth.encryptMessage(payload, secret);
          }
          const encodedJWT = jws.sign({
            header,
            payload,
            secret
          });
          return this.set('Authorization', `Bearer ${encodedJWT}`);
        };
        if (header.app) {
          this.expect = util.delayedFunction(this, 'expect',
           db.app.get(header.app).then(app => setJWTHeader(app.secret)));
          return this;
        } else {
          // Use dummy header
          return setJWTHeader('waffles');
        }
      },
      sendEncrypted(data) {
        // TODO: This currently only works for JSON, but if we want to do form
        //  data then we also need to handle that as a content type
        // SEE: https://github.com/visionmedia/superagent
        //  .../blob/074bca4d64ac7fe90801d1ff67fb996364925c4a/lib/client.js#L751
        // First reduce to a string
        if (typeof data !== 'string') {
          data = JSON.stringify(data, null, 2);
        }
        return this.send(auth.encryptMessage(data, testAccount.secret));
      }
    };
    function hijackMethod(method) {
      const original = request[method];
      request[method] = function hijack(...args) {
        const ret = original.apply(this, args);
        for (const funcName in extraFuncs) {
          ret[funcName] = extraFuncs[funcName];
        }
        return ret;
      };
    }
    for (var method of methods) {
      hijackMethod(method);
    }

    /**
     * Helper to unblock mocha and
     */
    function resolveAndUnblockMocha() {
      // Unblock Mocha and resolve
      hasMochaRelease.then((done) => {
        // We return our modified supertest request object
        resolve(request);
        // Then unblock Mocha
        done();
      });
    }

    request.get('/v1/healthcheck')
      .expect(200, function healthCheckResponse(err, body) {
        if (err) {
          console.info(
            '    TestHelper - Could not detect running service, starting...');
          require('../index').then(function serviceStarted() {
            console.info('    TestHelper - Service started, starting tests.');
            resolveAndUnblockMocha();
          });
        } else {
          console.info(
            '    TestHelper - Using running service, starting tests.');
          resolveAndUnblockMocha();
        }
    });
  });
});
