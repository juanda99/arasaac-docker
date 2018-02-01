import passport from 'passport'
const { Strategy: LocalStrategy } = require('passport-local')
const { BasicStrategy } = require('passport-http');


/**
 * LocalStrategy
 *
 * This strategy is used to authenticate users based on a username and password.
 * Anytime a request is made to authorize an application, we must ensure that
 * a user is logged in before asking them to approve the request.
 */

 
passport.use(new BasicStrategy((clientId, clientSecret, done) => {
  db.clients.findByClientId(clientId)
    .then(client => validate.client(client, clientSecret))
    .then(client => done(null, client))
    .catch(() => done(null, false));
}));

passport.use(new LocalStrategy((username, password, done) => {
  console.log('***********************************')
  console.log(username)
  console.log(password)
  done (null, {})
  /*
  db.users.findByUsername(username)
    .then(user => validate.user(user, password))
    .then(user => done(null, user))
    .catch(() => done(null, false));
  */
}));

module.exports = {
  login: (req, res, next) => {
    passport.authenticate('basic', { session: false })
  }


    /*
    {
    var currentScopes = req.swagger.operation['x-security-scopes']
    console.log (req)
    const sendError = () => res.status(403).json({ message: 'Error: Access Denied' })

    /*
    //validate the 'Authorization' header. it should have the following format:
    //'Bearer tokenString'
    if (token && token.indexOf("Bearer ") === 0) {
      var tokenString = token.split(" ")[1];

      jwt.verify(tokenString, sharedSecret, function (
        verificationError,
        decodedToken
      ) {
        //check if the JWT was verified correctly
        if (
          verificationError == null &&
          Array.isArray(currentScopes) &&
          decodedToken &&
          decodedToken.role
        ) {
          // check if the role is valid for this endpoint
          var roleMatch = currentScopes.indexOf(decodedToken.role) !== -1;
          // check if the issuer matches
          var issuerMatch = decodedToken.iss == issuer;

          // you can add more verification checks for the
          // token here if necessary, such as checking if
          // the username belongs to an active user

          if (roleMatch && issuerMatch) {
            //add the token to the request so that we
            //can access it in the endpoint code if necessary
            req.auth = decodedToken;
            //if there is no error, just return null in the callback
            return callback(null);
          } else {
            //return the error in the callback if there is one
            return callback(sendError());
          }
        } else {
          //return the error in the callback if the JWT was not verified
          return callback(sendError());
        }
      });
    } else {
      //return the error in the callback if the Authorization header doesn't have the correct format
      return callback(sendError());
    }

    if (req.headers.authorization === 'Scott') {
      return next()
    }
    return next(new Error('access denied!'))
  }]
  */
}
