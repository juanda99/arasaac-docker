const logger = require('./utils/logger')
const hasRole = role => (req, res, next) => {
  const currentRole = req.user.role
  if (currentRole === role || currentRole === 'admin') {
    logger.debug(`Role auth ok. Needs ${role} role and has ${currentRole} role`)
    return next()
  } else {
    logger.debug(
      `Role auth failed! Needs ${role} role and has ${currentRole} role`
    )
    return res.status(403).json({
      message: 'Error getting user data',
      error: `Need the admin role. Current role: ${req.user.role}`
    })
  }
}

module.exports = {
  hasRole
}
