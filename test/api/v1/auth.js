// Wait and hoist supertest request, Mocha is blocked from execution until this
//  completes
let request; require('../../../lib/testhelper').then(req => request = req);

describe('GET /v1/apps', function() {
  it('should return 200 using helper auth setup', function(done) {
    request.get('/v1/apps')
      .auth()
      .expect(200, done);
  });
});
