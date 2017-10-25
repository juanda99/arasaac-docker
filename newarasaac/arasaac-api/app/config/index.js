require('babel-polyfill')
const path = require('path')

const development = require('./env/development')
const test = require('./env/test')
const production = require('./env/production')


const defaults = {
  host: process.env.HOST || 'mongodb',
  port: process.env.PORT || 8100,
  materialsDir: path.join( process.cwd(), 'materials' ),
  jwtSecret: 'asdfgASDFG12345'
}

/**
 * Expose
 */

module.exports = {
  development: Object.assign({}, defaults, development),
  test: Object.assign({}, defaults, test),
  production: Object.assign({}, defaults, production)
}[process.env.NODE_ENV || 'development']
