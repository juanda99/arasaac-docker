const router = require('express').Router()
const passport = require('passport')
const usersController = require('../controllers/usersController')
const { hasRole } = require('../middlewares')

router.post('/', (req, res) => {
  usersController.create(req, res)
})
router.delete('/:id', (req, res) => {
  usersController.delete(req, res)
})
router.get('/activate/:code', (req, res) => {
  console.log('activating...')
  usersController.activate(req, res)
})
router.get(
  '/',
  passport.authenticate('bearer', { session: false }),
  hasRole('admin'),
  (req, res) => {
    usersController.getAll(req, res)
  }
)

router.get(
  '/:id',
  (req, res, next) => {
    console.log('ha entrado')
    next()
  },
  // passport.authenticate('bearer', { session: false }),
  // hasRole('admin'),
  (req, res) => {
    usersController.findOne(req, res)
  }
)

router.get('/:id/favorites/', (req, res) => {
  usersController.getFavorites(req, res)
})

router.post('/:id/favorites/', (req, res) => {
  usersController.addFavorite(req, res)
})

/* set passwordlessToken so user then can get a token */
// router.post('/:id/passwordless/', (req, res) => {
//   usersController.createPasswordlessToken(req, res)
// })

/* set passwordlessToken so user then can get a token */
router.post('/password/', (req, res) => {
  usersController.resetPassword(req, res)
})

router.delete('/:id/favorites/', (req, res) => {
  usersController.deleteFavorite(req, res)
})

module.exports = router
