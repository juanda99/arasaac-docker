const router = require('express').Router()
const translationsController = require('../controllers/translationsController')

router.post('/status/:language', (req, res) => {
  translationsController.postTranslationStatus(req, res)
})

router.get('/status/:language', (req, res) => {
  translationsController.getTranslationStatus(req, res)
})

module.exports = router
