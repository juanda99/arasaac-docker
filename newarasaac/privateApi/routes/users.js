const router = require('express').Router()
const passport = require('passport')
const usersController = require('../controllers/usersController')

router.post('/', (req, res) => {
  usersController.create(req, res)
})
router.delete('/:id', (req, res) => {
  usersController.delete(req, res)
})
router.get('/activate/:code', (req, res) => {
  usersController.activate(req, res)
})
router.get(
  '/',
  (req, res, next) => {
    console.log('pruebarrrrrr')
    next()
  },
  passport.authenticate('bearer', { session: false }),
  (req, res) => {
    usersController.getAll(req, res)
  }
)

router.get('/:id/favorites/', (req, res) => {
  usersController.getFavorites(req, res)
})

router.post('/:id/favorites/', (req, res) => {
  usersController.addFavorite(req, res)
})

router.delete('/:id/favorites/', (req, res) => {
  usersController.deleteFavorite(req, res)
})

module.exports = router
