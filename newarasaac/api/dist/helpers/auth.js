"use strict";

var _passport = _interopRequireDefault(require("passport"));

var _config = require("../config");

var _util = require("util");

var _jwtDecode = _interopRequireDefault(require("jwt-decode"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
_passport.default.use(new BearerStrategy(function (accessToken, done) {
  console.log('KKKKKKKKKKKKKKKKKKKKKK');
  if (accessToken === null) throw new Error('No token');
  var authUrl = _config.authorization.tokeninfoURL + accessToken;
  request.get(authUrl, function (error, response
  /*, body*/
  ) {
    if (error) done(null, false);else if (response.statusCode !== 200) {
      console.log(response.body.error);
      done(null, false);
    } else {
      // get scope from token
      var decoded = (0, _jwtDecode.default)(accessToken);
      done(null, accessToken, {
        scopes: decoded.scope
      });
    }
  });
}));

module.exports = {
  login: function login(req, res, next) {
    console.log('YYYYYYYYYYYYYYYYYYYYYYYYYY');
    console.log(req.headers.authorization);
    var scopeRequired = req.swagger.operation.security[0].login;

    _passport.default.authenticate('bearer', {
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