const router = require('express').Router()
const passport = require('passport')
const { hasRole } = require('../middlewares')
const categoriesController = require('../controllers/categoriesController')

router.get('/:locale/:lastUpdated?', (req, res) => {
  categoriesController.get(req, res)
})

router.put(
  '/',
  passport.authenticate('bearer', { session: false }),
  hasRole('translator'),
  (req, res) => {
    categoriesController.update(req, res)
  }
)

router.put(
  '/add',
  passport.authenticate('bearer', { session: false }),
  hasRole('admin'),
  (req, res) => {
    categoriesController.add(req, res)
  }
)
router.put(
  '/remove',
  passport.authenticate('bearer', { session: false }),
  hasRole('admin'),
  (req, res) => {
    categoriesController.remove(req, res)
  }
)

module.exports = router
