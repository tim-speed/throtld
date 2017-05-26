// require 'oauth2'
//
// # OAuth 2.0 client id and secret pair. Used to exchange a code for a user's
// # token during SSO.
// set :client_id, ENV['CLIENT_ID']
// set :client_secret, ENV['CLIENT_SECRET']
//
// # The URL of manifold's connector url, for completing SSO or making requests
// set :connector_url, ENV['CONNECTOR_URL']
//
// oac = OAuth2::Client.new(settings.client_id, settings.client_secret,
//                          :site => settings.connector_url,
//                          :token_url => '/v1/oauth/tokens'
//                         )

// TODO: use passport to faciliate oauth and http / https to make requests
// This is for manifold sso
const passport = require('passport');
const http = require('http');
const https = require('https');
