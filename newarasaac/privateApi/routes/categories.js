const router = require('express').Router()
const categoriesController = require('../controllers/categoriesController')

router.get('/:locale/:lastUpdated?', (req, res) => {
  categoriesController.get(req, res)
})

router.put('/', (req, res) => {
  categoriesController.update(req, res)
})

router.put('/add', (req, res) => {
  categoriesController.add(req, res)
})
router.put('/remove', (req, res) => {
  categoriesController.remove(req, res)
})

module.exports = router
