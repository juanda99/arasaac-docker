const hasRole = role => (req, res, next) => {
  if (req.user.role === role || req.user.role === 'admin') return next()
  else {
    return res.status(403).json({
      message: 'Error getting user data',
      error: `Need the admin role. Current role: ${req.user.role}`
    })
  }
}

module.exports = {
  hasRole
}
