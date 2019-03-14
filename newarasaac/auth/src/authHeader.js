/*!
 * changeHeaderAuthSecret
 * Oauth2 resource own
 * MIT Licensed
 */

/**
 * Module dependencies.
 * @private
 */
var Base64 = require('js-base64').Base64;

/**
 * Module exports.
*/

module.exports = changeHeaderAuthSecret


function changeHeaderAuthSecret(options) {
  const opts = options || {}
  // options
  const clientId = opts.clientId || ''
  const secretId = opts.secretId || ''
  const debug = opts.debug || false
  return function(req, res, next) {
    const userAuth = req.headers.authorization.split(' ').pop();
    const userAuthDecoded = Base64.decode(userAuth);
    if (debug) console.log(`Authorization header: ${userAuthDecoded}`)
    const parts = userAuthDecoded.split(':', 2);
    if (parts[0] === clientId) {
      const newUserAuth = `${clientId}:${secretId}`;
      if (debug) console.log(`Change auth: ${userAuthDecoded}`)
      req.headers.authorization = `Basic ${Base64.encode(newUserAuth)}`;
    }
    else if (debug)  console.log(`Authorization header: ${userAuthDecoded}`)
    next()
  }
}