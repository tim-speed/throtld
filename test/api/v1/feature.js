// Wait and hoist supertest request, Mocha is blocked from execution until this
//  completes
let request; require('../../../lib/testhelper').then(req => request = req);

const FEATURE_KEY = 'test_Feature-1';

let createdAppId;

describe('PUT /v1/app/feature', function() {
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

  it('should store a new feature', function(done) {
    request.put('/v1/app/feature')
      .auth()
      .sendEncrypted({
        id: createdAppId,
        feature: {
          key: FEATURE_KEY,
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
      })
      .expect(200, done);
  });
  it('should update an existing feature', function(done) {
    request.put('/v1/app/feature')
      .auth()
      .sendEncrypted({
        id: createdAppId,
        feature: {
          key: FEATURE_KEY,
          segments: [
            {
              value: 1,
              weight: 0.1
            }
          ]
        }
      })
      .expect(200, done);
  });
  it('should fail to set feature for non existant app', function(done) {
    request.put('/v1/app/feature')
      .auth()
      .sendEncrypted({
        id: '111111111111111111111111',
        feature: {
          key: FEATURE_KEY,
          segments: [
            {
              value: 1,
              weight: 0.1
            }
          ]
        }
      })
      .expect(500, done);
  });
});

describe('DELETE /v1/app/feature', function() {
  it('should delete an existing feature', function(done) {
    request.delete('/v1/app/feature')
      .auth()
      .sendEncrypted({
        id: createdAppId,
        feature: {
          key: FEATURE_KEY
        }
      })
      .expect(200, done);
  });
  it('should fail to delete an existing feature, now that its gone',
   function(done) {
    request.delete('/v1/app/feature')
      .auth()
      .sendEncrypted({
        id: createdAppId,
        feature: {
          key: FEATURE_KEY
        }
      })
      .expect(500, done);
  });
});
