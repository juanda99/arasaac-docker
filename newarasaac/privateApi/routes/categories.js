const router = require('express').Router()
const categoriesController = require('../controllers/categoriesController')

router.get('/:locale/:date?', (req, res) => {
  categoriesController.get(req, res)
})

router.put('/update/date/:date?', (req, res) => {
  categoriesController.update(req, res)
})

router.put('/update/all/:date?', (req, res) => {
  categoriesController.updateAll(req, res)
})

module.exports = router
