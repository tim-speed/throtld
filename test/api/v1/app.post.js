// Wait and hoist supertest request, Mocha is blocked from execution until this
//  completes
let request; require('../../../lib/testhelper').then(req => request = req);

describe('POST /v1/app', function() {
  it('should return app id', function(done) {
    request.post('/v1/app')
      .auth()
      .sendEncrypted({
        secret: 'IAmSecret'
      })
      .expect(200)
      .then(res => {
        if (typeof res.body.id !== 'number') {
          return done('Route did not return a valid App id.');
        }
        done();
      }, done);
  });
});
