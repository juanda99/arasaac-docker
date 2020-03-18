const router = require('express').Router()
const passport = require('passport')
const usersController = require('../controllers/usersController')
const { hasRole, ownThisData } = require('../middlewares')

router.post('/', (req, res) => {
  usersController.create(req, res)
})

// just for the contact form
router.post('/contact/:_id?', (req, res) => {
  usersController.sendContactForm(req, res)
})

router.put(
  '/password',
  passport.authenticate('bearer', { session: false }),
  (req, res) => {
    usersController.changePassword(req, res)
  }
)

router.put(
  '/:id',
  passport.authenticate('bearer', { session: false }),
  // use for user management but also for its own user profile
  ownThisData(),
  (req, res) => {
    usersController.update(req, res)
  }
)

router.get('/activate/:code', (req, res) => {
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
  '/email/:email',
  passport.authenticate('bearer', { session: false }),
  (req, res) => {
    usersController.getUserByEmail(req, res)
  }
)

router.get(
  '/date/:date?',
  passport.authenticate('bearer', { session: false }),
  hasRole('admin'),
  (req, res) => {
    usersController.getAllByDate(req, res)
  }
)

router.get(
  '/:id',
  passport.authenticate('bearer', { session: false }),
  hasRole('admin'),
  (req, res) => {
    usersController.findOne(req, res)
  }
)

router.get(
  '/favorites',
  passport.authenticate('bearer', { session: false }),
  hasRole('user'),
  (req, res) => {
    usersController.getFavorites(req, res)
  }
)

router.post(
  '/favorites',
  passport.authenticate('bearer', { session: false }),
  hasRole('user'),
  (req, res) => {
    usersController.addFavorite(req, res)
  }
)

router.delete(
  '/favorites',
  passport.authenticate('bearer', { session: false }),
  hasRole('user'),
  (req, res) => {
    usersController.deleteFavorite(req, res)
  }
)

router.post(
  '/favorites/list/:listName',
  passport.authenticate('bearer', { session: false }),
  hasRole('user'),
  (req, res) => {
    usersController.addFavoriteList(req, res)
  }
)

router.delete(
  '/favorites/list/:listName',
  passport.authenticate('bearer', { session: false }),
  hasRole('user'),
  (req, res) => {
    usersController.deleteFavoriteList(req, res)
  }
)

router.put(
  '/favorites/list/:listName',
  passport.authenticate('bearer', { session: false }),
  hasRole('user'),
  (req, res) => {
    usersController.renameFavoriteList(req, res)
  }
)

/* set passwordlessToken so user then can get a token */
// router.post('/:id/passwordless/', (req, res) => {
//   usersController.createPasswordlessToken(req, res)
// })

/* set passwordlessToken so user then can get a token */
router.post('/password/', (req, res) => {
  usersController.resetPassword(req, res)
})

// router.delete('/:id', (req, res) => {
//   usersController.delete(req, res)
// })

module.exports = router
