const router = require('express').Router()
// const passport = require('passport')
// const { hasRole } = require('../middlewares')
const sitemapController = require('../controllers/sitemapController')

router.get('/', 
  // passport.authenticate('bearer', { session: false }),
  // hasRole('admin'),
  (req, res) => {
    sitemapController.get(req, res)
  }
)

module.exports = router
