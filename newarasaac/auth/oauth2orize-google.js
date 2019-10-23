"use strict";

var AuthorizationError = require("oauth2orize").AuthorizationError;
var request = require("request");
var objectAssign = require("object-assign");

// var getGoogleProfile = require('./oauth2orize-google-utils').getGoogleProfile;

module.exports = function(opts, issue) {
  if (typeof opts === "function") {
    issue = opts;
    opts = null;
  }

  if (typeof issue !== "function") {
    throw new Error(
      "OAuth 2.0 password exchange middleware " + "requires an issue function."
    );
  }

  opts = opts || {};

  var userProperty = opts.userProperty || "user";
  var separators = opts.scopeSeparator || " ";
  var googleConfig = opts.googleConfig || {};

  if (!Array.isArray(separators)) {
    separators = [separators];
  }

  return function google(req, res, next) {
    if (!req.body) {
      return next(
        new Error("Request body not parsed. " + "Use bodyParser middleware.")
      );
    }

    // The `user` property of `req` holds the authenticated user. In the case
    // of the token end-point, this property will contain the OAuth 2.0 client.
    var client = req[userProperty];

    var token = req.body.token;
    var locale = req.body.locale;
    var scope = req.body.scope;
    if (!token) {
      return next(
        new AuthorizationError("Missing Google token!", "invalid_request")
      );
    }

    // googleConfig.redirect_uri = req.get('origin') || googleConfig.redirect_uri
    getGoogleProfile(token, locale, function(err, profile) {
      if (err) {
        return next(
          new AuthorizationError(
            err.message || "Could not get Google profile using provided token.",
            "invalid_request"
          )
        );
      }

      // change google profile locale for our own locale:

      profile.locale = locale;
      if (scope) {
        for (var i = 0, len = separators.length; i < len; i++) {
          // Only separates on the first matching separator.
          // This allows for a sort of separator "priority"
          // (ie, favors spaces then fallback to commas).
          var separated = scope.split(separators[i]);

          if (separated.length > 1) {
            scope = separated;
            break;
          }
        }

        if (!Array.isArray(scope)) {
          scope = [scope];
        }
      }

      var issued = function(err, accessToken, refreshToken, params) {
        if (err) {
          return next(err);
        }

        if (!accessToken) {
          return next(
            new AuthorizationError(
              "Permissions was not granted.",
              "invalid_grant"
            )
          );
        }

        var json = { access_token: accessToken };

        if (refreshToken) {
          json["refresh_token"] = refreshToken;
        }

        if (params) {
          objectAssign(json, params);
        }

        json["token_type"] = json["token_type"] || "bearer";
        json = JSON.stringify(json);

        res.setHeader("Content-Type", "application/json");
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Pragma", "no-cache");
        res.end(json);
      };

      issue(client, profile, scope, issued);
    });
  };
};

function getGoogleProfile(accessToken, locale, cb) {
  request(
    {
      url:
        "https://www.googleapis.com/oauth2/v3/userinfo?access_token=" +
        accessToken,
      json: true
    },
    function(err, res, body) {
      if (err) {
        return cb(err);
      }

      if (body && body.error) {
        var msg = body.error.message || "Could not get Google profile.";
        return cb(new Error(msg));
      }

      cb(null, body);
    }
  );
}
