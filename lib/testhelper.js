const crypto = require('crypto');
const supertest = require('supertest');
const util = require('./util');
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

module.exports = new Promise((resolve, reject) => {
  require('./config').then(config => {
    const request = supertest(`http://localhost:${config.server.port}`);
    if (!global.describe) {
      logger.fatal('Mocha not running; describe undefined, this module is ' +
        'meant to provide API testing support to mocha tests.');
      return reject(new Error('Mocha not running!'));
    }
    // Hijack supertest request methods with extra functions
    const methods = ['get', 'post', 'head', 'update', 'delete', 'put'];
    var extraFuncs = {
      // auth() {
      //   // TODO: Redo this
      //   // Build auth token
      //   var key = 'authAutoTestKey';
      //   var user = 'j90h530h853H903g923Rf1';
      //   var token = user + ':' + key;
      //   var encodedToken = new Buffer(token, 'utf8').toString('base64');
      //   var secret = config.auth.users[user];
      //   var hmac = crypto.createHmac(config.auth.algorithm, secret);
      //   hmac.update(key);
      //   var hash = hmac.digest('hex');
      //
      //   return this.set(config.auth.strategy + '-token', encodedToken)
      //     .set(config.auth.strategy + '-hash', hash);
      // }
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

    request.get('/healthcheck')
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