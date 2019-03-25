const router = require('express').Router()
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
router.get('/', (req, res) => {
  usersController.getAll(req, res)
})

router.get('/:id/favorites/', (req, res) => {
  usersController.getFavorites(req, res)
})

router.post('/:id/favorites/:list', (req, res) => {
  usersController.addFavorites(req, res)
})

module.exports = router
