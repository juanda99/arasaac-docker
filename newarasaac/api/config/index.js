const development = require('./env/development')
const path = require('path')
const test = require('./env/test')
const production = require('./env/production')
const dotenv = require('dotenv-safe')

dotenv.load()

const requireProcessEnv = name => {
  if (!process.env[name]) {
    throw new Error('You must set the ' + name + ' environment variable')
  }
  return process.env[name]
}

const defaults = {
  port: process.env.PORT || 8100, // port 80 by default, defined in api-dockerfile.yml
  materialsDir: path.join(process.cwd(), 'materials'),
  masterKey: requireProcessEnv('MASTER_KEY'),
  jwtSecret: requireProcessEnv('JWT_SECRET'),
  // inside docker http instead of https and auth as docker container instead of domain name
  authorization: {
    host: 'auth.arasaac.org',
    port: '443',
    url: 'https://auth.arasaac.org/',
    tokenURL: 'oauth/token',
    authorizeURL: 'https://auth.arasaac.org/dialog/authorize',
    tokeninfoURL: 'http://auth/api/tokeninfo?access_token=',
    redirectURL: 'https://api.arasaac.org/receivetoken'
  }
}


/**
 * Expose
 */

module.exports = {
  development: Object.assign({}, defaults, development),
  test: Object.assign({}, defaults, test),
  production: Object.assign({}, defaults, production)
}[process.env.NODE_ENV || 'development']
