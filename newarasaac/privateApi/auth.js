const axios = require('axios')
const passport = require('passport')
const Strategy = require('passport-http-bearer').Strategy
const jwt = require('jsonwebtoken')
const logger = require('./utils/logger')

// see https://gist.github.com/fgilio/230ccd514e9381fafa51608fcf137253 for axios catch errors

/*
 We verify our token with our auth server endpoint
*/

passport.use(
  new Strategy(async (token, cb) => {
    const url = `http://auth/api/tokeninfo?access_token=${token}`
    try {
      if (!token) {
        logger.debug('Authentication failed: No token!!')
        return cb(null, false)
      }
      await axios.get(url) // no error (20X code), go on
      const { iss, sub, aud, role, exp, scope, targetLanguages } = jwt.decode(
        token
      )
      const user = { user: sub, role, scope, iss, aud, exp, targetLanguages }
      logger.debug(`Authentication ok for user ${sub}`)
      return cb(null, user)
    } catch (error) {
      logger.debug(`Authentication failed ${error.message}`)
      if (error.response) {
        const { status } = error.response
        // const { data, status, headers } = error.response
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (status === 400) return cb(null, false) // bad request, invalid token
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        return cb(error)
      } else {
        // Something happened in setting up the request that triggered an Error
        return cb(error)
      }
      return cb(error)
    }
  })
)
