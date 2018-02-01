var User = require('../models/User')
const oauth2orize = require('oauth2orize')

import passport from 'passport'
const { Strategy: LocalStrategy } = require('passport-local')

passport.use(new LocalStrategy((username, password, done) => {
  console.log('***********************************')
  console.log(username)
  console.log(password)
  done(null, {})
  /*
  db.users.findByUsername(username)
    .then(user => validate.user(user, password))
    .then(user => done(null, user))
    .catch(() => done(null, false));
  */
}))

/*
passport.use(new BasicStrategy((clientId, clientSecret, done) => {
  db.clients.findByClientId(clientId)
    .then(client => validate.client(client, clientSecret))
    .then(client => done(null, client))
    .catch(() => done(null, false));
}));
*/

// create OAuth 2.0 server
const server = oauth2orize.createServer()


module.exports = {
  login2: (req, res, next) => {
    console.log('estamos en login....')
    passport.authenticate('local', { session: false }, (err, user, info) => {
      if (err) { return next(err) }
      if (!user) { 
        return res.status(401).json({
          message: 'Invalid credentials'
        })
      }
      res.status(200).json(user)
    })(req, res, next)
  },
  login: (req, res, next) => 
    [
      passport.authenticate(['local'], { session: false }),
      server.token(),
      server.errorHandler()
    ]
}
