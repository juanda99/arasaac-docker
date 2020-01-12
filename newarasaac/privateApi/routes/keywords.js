const router = require('express').Router()
const passport = require('passport')
const { hasRole } = require('../middlewares')
const keywordsController = require('../controllers/keywordsController')

router.get(
  '/',
  passport.authenticate('bearer', { session: false }),
  hasRole('translator'),
  (req, res) => {
    keywordsController.getAll(req, res)
  })

router.get('/:language', (req, res) => {
  keywordsController.updateKeywords(req, res)
})

module.exports = router
