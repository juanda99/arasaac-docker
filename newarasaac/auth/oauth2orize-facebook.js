var AuthorizationError = require("oauth2orize").AuthorizationError;
var objectAssign = require("object-assign");
var request = require("request");

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

  if (!Array.isArray(separators)) {
    separators = [separators];
  }

  return function facebook(req, res, next) {
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
        new AuthorizationError(
          "Missing Facebook access token!",
          "invalid_request"
        )
      );
    }

    getFacebookProfile(token, locale, function(err, profile) {
      if (err) {
        return next(
          new AuthorizationError(
            "Could not get Facebook profile using provided access token.",
            "invalid_request"
          )
        );
      }

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

function getFacebookProfile(accessToken, locale, cb) {
  // TODO: add to doc: check permissions facebook token: https://developers.facebook.com/tools/debug/access_token?q=user_token
  // TODO: dashboard facebook app: https://developers.facebook.com/apps/1687810071473822/dashboard/
  request(
    {
      // url: 'https://graph.facebook.com/me?fields=name,email,picture,&access_token=' + accessToken,
      // we get picture by https://graph.facebook.com/user_id/picture?type=large
      // url: 'https://graph.facebook.com/me?access_token=' + accessToken,
      url:
        "https://graph.facebook.com/me?fields=name,email,picture,birthday,hometown&access_token=" +
        accessToken,
      json: true
    },
    function(err, res, body) {
      if (err) {
        return cb(err);
      }

      if (body && body.error) {
        var msg = body.error.message || "Could not get Facebook profile.";
        return cb(new Error(msg));
      }

      cb(null, body);
    }
  );
}
