const validate = require('../../../lib/validate');
const logger = require('../../../lib/logger')('test-api-v1-app');
// Wait and hoist supertest request, Mocha is blocked from execution until this
//  completes
let request; require('../../../lib/testhelper').then(req => request = req);

let createdAppId;

describe('POST /v1/app', function() {
  it('should return app id', function(done) {
    request.post('/v1/app')
      .auth()
      .sendEncrypted({
        secret: 'IAmSecret'
      })
      .expect(200)
      .then(res => {
        if (!validate.isMongoObjectID(res.body.id)) {
          logger.debug(`Bad return: ${JSON.stringify(res.body, null, 2)}`);
          return done('Route did not return a valid App Id.');
        }
        createdAppId = res.body.id;
        done();
      }, done);
  });
});

describe('GET /v1/apps', function() {
  it('should return a list of apps', function(done) {
    request.get('/v1/apps')
      .auth()
      .expect(200)
      .then(res => {
        if (!res.body || !validate.isMongoObjectID(res.body[0].id) ||
         res.body[0].id !== createdAppId) {
          logger.debug(`Bad return: ${JSON.stringify(res.body, null, 2)}`);
          return done('Route did not return an array with our App Id.');
        }
        done();
      }, done);
  });
});

describe('DELETE /v1/app', function() {
  it('should remove our app', function(done) {
    request.delete('/v1/app')
      .auth()
      .sendEncrypted({
        id: createdAppId
      })
      .expect(200, done);
  });
  it('should fail to remove our app now that its gone', function(done) {
    request.delete('/v1/app')
      .auth()
      .sendEncrypted({
        id: createdAppId
      })
      .expect(403, done);
  });
});

describe('GET /v1/apps', function() {
  it('should no longer list our app', function(done) {
    request.get('/v1/apps')
      .auth()
      .expect(200)
      .then(res => {
        if (!res.body || res.body.length !== 0) {
          return done('Route did not return an empty array without our App.');
        }
        done();
      }, done);
  });
});
