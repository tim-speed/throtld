// Wait and hoist supertest request, Mocha is blocked from execution until this
//  completes
let request; require('../../../lib/testhelper').then(req => request = req);

describe('GET /v1/healthcheck', function describeHealthcheckGet() {
  it('respond: I am well', function testHealthcheckIsWell(done) {
    request.get('/v1/healthcheck')
        .expect('I am alive!', done);
  });
});
