// get '/dashboard' do
//   halt 401, 'you must be logged in with Manifold'  unless session[:token]
//
//   token = OAuth2::AccessToken.from_hash oac, session[:token]
//
//   profile = token.get '/v1/self'
//   resource = token.get "/v1/resources/#{session[:resource]}"
//
//   <<-HTML
//   <body>
//   <p> hi #{profile.parsed['target']['name']}, you are logged in</p>
//
//   <p>your resource: #{resource.parsed['name']}</p>
//   HTML
// end
