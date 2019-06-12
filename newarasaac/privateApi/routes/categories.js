const router = require('express').Router()
const categoriesController = require('../controllers/categoriesController')

router.get('/:locale', (req, res) => {
  categoriesController.get(req, res)
})

router.put('/update', (req, res) => {
  categoriesController.update(req, res)
})

router.put('/update/all', (req, res) => {
  categoriesController.updateAll(req, res)
})

module.exports = router
