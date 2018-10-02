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
module.exports = router
