// TODO: remove this config file

const requireProcessEnv = name => {
  if (!process.env[name]) {
    throw new Error('You must set the ' + name + ' environment variable')
  }
  return process.env[name]
}

const config = {
  port: process.env.PORT || 8100, // port 80 by default, defined in api-dockerfile.yml
  materialsDir: '/materials',
  // masterKey: requireProcessEnv('MASTER_KEY'),
  // jwtSecret: requireProcessEnv('JWT_SECRET'),
  // inside docker http instead of https and auth as docker container instead of domain name
  authorization: {
    host: 'auth.arasaac.org',
    port: '443',
    url: 'https://auth.arasaac.org/',
    tokenURL: 'oauth/token',
    authorizeURL: 'https://auth.arasaac.org/dialog/authorize',
    tokeninfoURL: 'http://auth/api/tokeninfo?access_token=',
    redirectURL: 'https://api.arasaac.org/receivetoken'
  },
  IMAGE_DIR: '/pictograms',
  SVG_DIR: '/svg',
  IMAGE_URL: 'https://static.arasaac.org/pictograms'
}

/**
 * Expose
 */

module.exports = config
