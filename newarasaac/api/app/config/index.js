const development = require('./env/development')
const path = require('path')
const test = require('./env/test')
const production = require('./env/production')

const defaults = {
  port: process.env.PORT || 8100,
  materialsDir: path.join(process.cwd(), 'materials')
}

/**
 * Expose
 */

module.exports = {
  development: Object.assign({}, defaults, development),
  test: Object.assign({}, defaults, test),
  production: Object.assign({}, defaults, production)
}[process.env.NODE_ENV || 'development']
