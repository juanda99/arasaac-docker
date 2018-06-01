const path = require('path')
const dotenv = require('dotenv-safe')

dotenv.load()

const requireProcessEnv = name => {
  if (!process.env[name]) {
    throw new Error(`You must set the ${name} environment variable`)
  }
  return process.env[name]
}

const config = {
  port: process.env.PORT,
  authorization: {
    host: 'auth.arasaac.org',
    port: '443',
    url: 'https://auth.arasaac.org/',
    tokenURL: 'oauth/token',
    authorizeURL: 'https://auth.arasaac.org/dialog/authorize',
    tokeninfoURL: 'http://auth/api/tokeninfo?access_token=',
    redirectURL: 'https://api.arasaac.org/receivetoken'
  },
  databaseUrl: process.env.MONGO_URL || 'mongodb://mongodb/arasaac'
}
module.exports = config
