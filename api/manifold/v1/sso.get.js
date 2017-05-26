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
