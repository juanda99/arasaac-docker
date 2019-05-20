"use strict";

var _require = require('../config'),
    authorization = _require.authorization;

var logger = require('../utils/logger');

var jwtDecode = require('jwt-decode');

var passport = require('passport');

var BearerStrategy = require('passport-http-bearer').Strategy;

var request = require('request');
/**
 * BearerStrategy
 *
 * This strategy is used to authenticate either users or clients based on an access token
 * (aka a bearer token).  If a user, they must have previously authorized a client
 * application, which is issued an access token to make requests on behalf of
 * the authorizing user.
 */


passport.use(new BearerStrategy(function (accessToken, done) {
  if (accessToken === null) {
    logger.debug('No token present in the resquest');
    throw new Error('No token');
  }

  var authUrl = authorization.tokeninfoURL + accessToken;
  request.get(authUrl, function (error, response
  /*, body*/
  ) {
    if (error) done(null, false);else if (response.statusCode !== 200) {
      logger.debug("Error verifying token: ".concat(response.body.error));
      done(null, false);
    } else {
      // get scope from token
      var decoded = jwtDecode(accessToken);
      logger.debug("Token ok with scope: ".concat(decoded.scope));
      done(null, accessToken, {
        scopes: decoded.scope
      });
    }
  });
}));
module.exports = {
  login: function login(req, res, next) {
    var scopeRequired = req.swagger.operation.security[0].login;
    passport.authenticate('bearer', {
      session: false
    }, function (err, user, info) {
      if (err) return res.status(500).send('Error');
      if (!user) return res.status(401).send('Unauthorized!');
      var userScopes = info.scopes;

      if (scopeRequired.some(function (r) {
        return userScopes.includes(r);
      })) {
        next();
      } else {
        res.status(401).send("Token valid but not enough priviledges. User scopes: ".concat(userScopes, ". Endpoint scopes: ").concat(scopeRequired));
      }
    })(req, res, next);
  }
};