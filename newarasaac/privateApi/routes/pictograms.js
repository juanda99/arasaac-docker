const router = require('express').Router()
const pictogramsController = require('../controllers/pictogramsController')
const passport = require('passport')
const { hasRole } = require('../middlewares')

router.get('/keywords/:locale/:id', (req, res) => {
  pictogramsController.getKeywordsById(req, res)
})

router.get('/types/:id', (req, res) => {
  pictogramsController.getTypesById(req, res)
})

router.get('/custom/:fileName', (req, res) => {
  pictogramsController.getCustomPictogramByName(req, res)
})

router.post('/custom/base64', (req, res) => {
  pictogramsController.postCustomPictogramFromBase64(req, res)
})

router.get('/:locale/searchId/:searchText', (req, res) => {
  pictogramsController.getPictogramsIdBySearch(req, res)
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

router.put(
  '/',
  passport.authenticate('bearer', { session: false }),
  hasRole('admin'),
  (req, res) => {
    pictogramsController.update(req, res)
  }
)

router.post(
  '/',
  passport.authenticate('bearer', { session: false }),
  hasRole('admin'),
  (req, res) => {
    pictogramsController.upload(req, res)
  }
)

module.exports = router
