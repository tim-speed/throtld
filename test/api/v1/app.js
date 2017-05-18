// Wait and hoist supertest request, Mocha is blocked from execution until this
//  completes
let request; require('../../../lib/testhelper').then(req => request = req);
const validate = require('../../../lib/validate');

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
        if (!validate.isUUID(res.body.id)) {
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
        if (!res.body || !validate.isUUID(res.body[0]) ||
         res.body[0] !== createdAppId) {
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
      .expect(500, done);
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
