const logger = require('./utils/logger')

const acl = {
  user: ['user', 'translator', 'admin'],
  translator: ['translator', 'admin'],
  admin: ['admin']
}

const hasRole = role => (req, res, next) => {
  const currentRole = req.user.role
  if (acl[role] && acl[role].indexOf(currentRole) !== -1) {
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

const ownThisData = () => (req, res, next) => {
  // current role and user
  const { role, id } = req.user
  const userId = req.params.id || req.params._id
  if (role === 'admin') return next()
  if (id && id === userId) return next()
  return res.status(403).json({
    message: 'Error getting user data',
    error: `Need the admin role. Current role: ${req.user.role}`
  })
}

module.exports = {
  hasRole,
  ownThisData
}
