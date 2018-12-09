const router = require('express').Router()
const pictogramsController = require('../controllers/pictogramsController')

/* we get all Data, could create same endpoint on publicAPI but with less fields info */
router.get('/:locale', (req, res) => {
  pictogramsController.getAll(req, res)
})

/* pictograms created or modified later than lastUpdated parameter */
router.get('/:locale/:lastUpdated', (req, res) => {
  pictogramsController.getPictogramsFromDate(req, res)
})

router.get('/:locale/:lastUpdated', (req, res) => {
  pictogramsController.getPictogramsFromDate(req, res)
})

router.get('/:locale/searchId/:searchText', (req, res) => {
  pictogramsController.getPictogramsIdBySearch(req, res)
})

module.exports = router
