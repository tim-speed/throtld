// get '/v1/sso' do
//   begin
//     token = oac.auth_code.get_token(params[:code])
//   rescue OAuth2::Error => err
//     return 401, "This is a page that the user would see"
//   end
//
//   session[:token] = token.to_hash
//   session[:resource] = params[:resource_id]
//
//   redirect to '/dashboard'
// end

const oauth = require('../../../lib/manifold/oauth');
const middleware = require('../../../lib/middleware');

module.exports = {
  middleware: [
    oauth.verifyOAuth,
    middleware.provideSession
  ],
  handler(req, res) {
    // TODO: Handle req.oauth ( token ) and store info in session then redirect
    res.send();
  }
};
