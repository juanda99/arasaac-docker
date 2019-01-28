const router = require('express').Router()
const pictogramsController = require('../controllers/pictogramsController')

router.get('/:locale/searchId/:searchText', (req, res) => {
  pictogramsController.getPictogramsIdBySearch(req, res)
})

router.get('/custom/:fileName', (req, res) => {
  pictogramsController.getCustomPictogramByName(req, res)
})

router.post('/custom/base64', (req, res) => {
  pictogramsController.postCustomPictogramFromBase64(req, res)
})

router.get('/keywords/:locale/:id', (req, res) => {
  pictogramsController.getKeywordsById(req, res)
})

router.get('/:id/locutions/:locale/:text', (req, res) => {
  pictogramsController.getLocutionById(req, res)
})

/* we get all Data, could create same endpoint on publicAPI but with less fields info */
router.get('/:locale', (req, res) => {
  pictogramsController.getAll(req, res)
})

/* pictograms created or modified later than lastUpdated parameter */
router.get('/:locale/:lastUpdated', (req, res) => {
  pictogramsController.getPictogramsFromDate(req, res)
})

module.exports = router
