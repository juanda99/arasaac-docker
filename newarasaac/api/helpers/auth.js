const { authorization } = require('../config')
const logger = require('../utils/logger')
const jwtDecode = require('jwt-decode')
const passport = require('passport')
const BearerStrategy = require('passport-http-bearer').Strategy
const request = require('request')

/**
 * BearerStrategy
 *
 * This strategy is used to authenticate either users or clients based on an access token
 * (aka a bearer token).  If a user, they must have previously authorized a client
 * application, which is issued an access token to make requests on behalf of
 * the authorizing user.
 */
passport.use(new BearerStrategy((accessToken, done) => {
  if (accessToken === null) {
    logger.debug('No token present in the resquest')
    throw new Error('No token')
  }
  const authUrl = authorization.tokeninfoURL + accessToken
  request.get(authUrl, (error, response /*, body*/) => {
    if (error) done(null, false)
    else if (response.statusCode !== 200) {
      logger.debug(`Error verifying token: ${response.body.error}`)
      done(null, false)
    } else {
      // get scope from token
      const decoded = jwtDecode(accessToken)
      logger.debug(`Token ok with scope: ${decoded.scope}`)
      done(null, accessToken, { scopes: decoded.scope })
    }
  })
}))

module.exports = {
  login: (req, res, next) => {
    const scopeRequired = req.swagger.operation.security[0].login
    passport.authenticate('bearer', { session: false }, (err, user, info) => {
      if (err) return res.status(500).send('Error')
      if (!user) return res.status(401).send('Unauthorized!')
      const userScopes = info.scopes
      if (scopeRequired.some(r => userScopes.includes(r))) {
        next()
      } else {
        res
          .status(401)
          .send(`Token valid but not enough priviledges. User scopes: ${userScopes}. Endpoint scopes: ${scopeRequired}`)
      }
    })(req, res, next)
  }
}
