const router = require('express').Router()
const materialsController = require('../controllers/materialsController')

router.post('/', (req, res) => {
  materialsController.create(req, res)
})
router.put('/:id', (req, res) => {
  materialsController.update(req, res)
})
router.delete('/:id', (req, res) => {
  materialsController.delete(req, res)
})
module.exports = router
