const development = require('./env/development')
const test = require('./env/test')
const production = require('./env/production')

const defaults = {}

/**
 * Expose
 */

module.exports = {
  development: Object.assign({}, defaults, development),
  test: Object.assign({}, defaults, test),
  production: Object.assign({}, defaults, production)
}[process.env.NODE_ENV || 'development']
