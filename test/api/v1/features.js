const assert = require('assert');
const logger = require('../../../lib/logger')('test-api-v1--features');
// Wait and hoist supertest request, Mocha is blocked from execution until this
//  completes
let request; require('../../../lib/testhelper').then(req => request = req);

const FEATURE_KEY_1 = 'test_Feature-1';
const FEATURE_KEY_2 = 'test_Feature-2';
const FEATURE_KEY_3 = 'test_Feature-3';

let createdAppId;

describe('GET /v1/features', function() {
  before((done) => {
    request.post('/v1/app')
      .auth()
      .sendEncrypted({
        secret: 'IAmSecret?'
      })
      .expect(200)
      .then(res => {
        createdAppId = res.body.id;
        done();
      }, done);
  });
  before((done) => {
    request.put('/v1/app/feature')
      .auth()
      .sendEncrypted({
        id: createdAppId,
        feature: {
          key: FEATURE_KEY_1,
          segments: [
            {
              value: 'yes',
              weight: 3
            }, {
              value: 'no',
              weight: 6
            }, {
              value: 'maybe',
              weight: 9
            }
          ]
        }
      }).expect(200, done);
  });
  before((done) => {
    request.put('/v1/app/feature')
      .auth()
      .sendEncrypted({
        id: createdAppId,
        feature: {
          key: FEATURE_KEY_2,
          segments: [
            {
              value: 'purple',
              weight: 0.3
            }, {
              value: 'brown',
              weight: 0.2
            }
          ]
        }
      }).expect(200, done);
  });
  before((done) => {
    request.put('/v1/app/feature')
      .auth()
      .sendEncrypted({
        id: createdAppId,
        feature: {
          key: FEATURE_KEY_3,
          segments: [
            {
              value: 1,
              weight: 0.3
            }
          ]
        }
      }).expect(200, done);
  });

  it('should fail to get features for user from JWT without app',
   function(done) {
    request.get('/v1/features')
      .setJWT({
        alg: 'HS256'
      }, {})
      .expect(400, done);
  });
  it('should fail to get features for user from JWT without expiry',
   function(done) {
    request.get('/v1/features')
      .setJWT({
        app: createdAppId,
        alg: 'HS256'
      }, {})
      .expect(400)
      .then(() => done(), done);
  });
  it('should fail to get features for user from JWT without subject',
   function(done) {
    request.get('/v1/features')
      .setJWT({
        app: createdAppId,
        alg: 'HS256'
      }, {
        exp: Date.now() + (60 * 1000)
      })
      .expect(400)
      .then(() => done(), done);
  });
  let features;
  it('should get features for user from JWT', function(done) {
    request.get('/v1/features')
      .setJWT({
        app: createdAppId,
        alg: 'HS256'
      }, {
        exp: Date.now() + (60 * 1000),
        sub: 'Bob Smith'
      })
      .expect(200)
      .then(res => {
        features = res.body;
        done();
      }, done);
  });
  it('features should contain our three test keys', function() {
    const keys = Object.keys(features);
    assert.equal(keys.length, 3);
    assert(~keys.indexOf(FEATURE_KEY_1));
    assert(~keys.indexOf(FEATURE_KEY_2));
    assert(~keys.indexOf(FEATURE_KEY_3));
    logger.debug(JSON.stringify(features, null, 2));
  });
});
