"use strict";

const fs = require("fs");
const path = require("path");
const uuid = require("uuid/v4");
const jwt = require("jsonwebtoken");

var PrettyError = require("pretty-error");
var pe = new PrettyError();

/** Suppress tracing for things like unit testing */
const DEBUG = process.env.DEBUG === true;

/** Private certificate used for signing JSON WebTokens */
const privateKey = fs.readFileSync(
  path.join(__dirname, "certs/privatekey.pem")
);

/** Public certificate used for verification.  Note: you could also use the private key */
const publicKey = fs.readFileSync(
  path.join(__dirname, "certs/certificate.pem")
);

/**
 * Creates a signed JSON WebToken and returns it.  Utilizes the private certificate to create
 * the signed JWT.  For more options and other things you can change this to, please see:
 * https://github.com/auth0/node-jsonwebtoken
 *
 * @param  {Number} exp - The number of seconds for this token to expire.  By default it will be 60
 *                        minutes (3600 seconds) if nothing is passed in.
 * @param  {String} sub - The subject or identity of the token.
 * @return {String} The JWT Token
 */
const createToken = ({
  exp = 3600,
  sub = "",
  aud = "",
  scope = "",
  role = ""
} = {}) => {
  const token = jwt.sign(
    {
      jti: uuid(),
      iss: "auth.arasaac.org",
      sub,
      aud,
      role,
      exp: Math.floor(Date.now() / 1000) + exp,
      scope
    },
    privateKey,
    {
      algorithm: "RS256"
    }
  );
  console.log(`Token: ${token} ****************************************`);
  return token;
};

/**
 * Verifies the token through the jwt library using the public certificate.
 * @param   {String} token - The token to verify
 * @throws  {Error} Error if the token could not be verified
 * @returns {Object} The token decoded and verified
 */
const verifyToken = token => jwt.verify(token, publicKey);

const logAndThrow = msg => {
  // if (DEBUG) console.trace(msg)
  throw new Error(msg);
};

class CustomError extends Error {
  constructor(message, code) {
    super(message);
    this.httpCode = code;
    this.name = "Custom error";
  }
}

module.exports = {
  createToken,
  verifyToken,
  logAndThrow,
  CustomError
};
