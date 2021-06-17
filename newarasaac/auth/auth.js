"use strict";

const db = require("./db");
const User = require("./db/users");
const Client = require("./db/clients");
const passport = require("passport");
const { Strategy: LocalStrategy } = require("passport-local");
const { BasicStrategy } = require("passport-http");
const {
  Strategy: ClientPasswordStrategy,
} = require("passport-oauth2-client-password");
const { Strategy: BearerStrategy } = require("passport-http-bearer");
const validate = require("./validate");
const ObjectID = require("mongodb").ObjectID;
const { logAndThrow } = require("./utils");

/**
 * LocalStrategy
 *
 * This strategy is used to authenticate users based on a username and password.
 * Anytime a request is made to authorize an application, we must ensure that
 * a user is logged in before asking them to approve the request.
 */
passport.use(
  new LocalStrategy((username, password, done) => {
    User.findOne({ email: username.toLowerCase(), verifyToken: "" })
      .then((user) =>
        user
          ? user.validate(password)
          : logAndThrow(`User ${username} not found`)
      )
      .then((user) => done(null, user))
      .catch((error) => {
        console.log(`Login error: ${error.message}`);
        done(null, false);
      });
  })
);

/**
 * BasicStrategy & ClientPasswordStrategy
 *
 * These strategies are used to authenticate registered OAuth clients.  They are
 * employed to protect the `token` endpoint, which consumers use to obtain
 * access tokens.  The OAuth 2.0 specification suggests that clients use the
 * HTTP Basic scheme to authenticate.  Use of the client password strategy
 * allows clients to send the same credentials in the request body (as opposed
 * to the `Authorization` header).  While this approach is not recommended by
 * the specification, in practice it is quite common.
 */
passport.use(
  new BasicStrategy((clientId, clientSecret, done) => {
    Client.findOne({ clientId: clientId })
      .then((client) =>
        client
          ? client.validate(clientSecret)
          : logAndThrow(`Client with id ${clientId} not found`)
      )
      .then((client) => done(null, client))
      .catch((error) => {
        console.log(`Login error: ${error.message}`);
        done(null, false);
      });
  })
);
/*
  console.log('enter client login....')
  Client.findOne({ clientId: clientId }, (err, client) => {
    if (err) { return done(err) }
    if (!client) {
      console.log(`Login: clientId ${clientId} does not exist`)
      return done(null, false)
    }
    if (client.clientSecret !== clientSecret) {
      console.log(`Login: Client secret does not match for client ${clientId}`)
      return done(null, false)
    }
    console.log(`Login successful: client ${clientId}`)
    return done(null, client)
  })
  */

/**
 * Client Password strategy
 *
 * The OAuth 2.0 client password authentication strategy authenticates clients
 * using a client ID and client secret. The strategy requires a verify callback,
 * which accepts those credentials and calls done providing a client.
 */
passport.use(
  new ClientPasswordStrategy((clientId, clientSecret, done) => {
    Client.findOne({ clientId: clientId })
      .then((client) =>
        client
          ? client.validate(clientSecret)
          : logAndThrow(`Client with id ${clientId} not2 found`)
      )
      .then((client) => done(null, client))
      .catch((error) => {
        console.log(`Login error: ${error.message}`);
        done(null, false);
      });
  })
);

/**
 * BearerStrategy
 *
 * This strategy is used to authenticate either users or clients based on an access token
 * (aka a bearer token).  If a user, they must have previously authorized a client
 * application, which is issued an access token to make requests on behalf of
 * the authorizing user.
 *
 * To keep this example simple, restricted scopes are not implemented, and this is just for
 * illustrative purposes
 */
passport.use(
  new BearerStrategy((accessToken, done) => {
    db.accessTokens
      .find(accessToken)
      .then((token) => validate.token(token, accessToken))
      .then((token) => done(null, token, { scope: "*" }))
      .catch(() => done(null, false));
  })
);

// Register serialialization and deserialization functions.
//
// When a client redirects a user to user authorization endpoint, an
// authorization transaction is initiated.  To complete the transaction, the
// user must authenticate and approve the authorization request.  Because this
// may involve multiple HTTPS request/response exchanges, the transaction is
// stored in the session.
//
// An application must supply serialization functions, which determine how the
// client object is serialized into the session.  Typically this will be a
// simple matter of serializing the client's ID, and deserializing by finding
// the client by ID from the database.

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  User.findOne({ _id: ObjectID(id) }, (err, user) => {
    if (err) done(err);
    if (!user) done(null, null);
    done(null, user);
  });
});
