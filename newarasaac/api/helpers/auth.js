import passport from 'passport'
import { authorization } from '../config'
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
  if (accessToken === null) throw new Error('No token')
  const authUrl = authorization.tokeninfoURL + accessToken
  request.get(authUrl, (error, response/*, body*/)=>{
    if (error) done(null, false)
    else if (response.statusCode !== 200) done(null, false)
    done(null, accessToken)
  })
}))

module.exports = {
  // curl -v -H "Authorization: Bearer 123456789" endpoint
  // curl -v http://endpoint/?access_token=123456789  
  login: (req, res, next) => {
    passport.authenticate('bearer', { session: false })(req, res, next)
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
