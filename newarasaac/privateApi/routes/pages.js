const router = require('express').Router()
const pagesController = require('../controllers/pagesController')

router.get(
  '/materials/:language/:idMaterial',
  (req, res) => {
    pagesController.getMaterial(req, res)
  })

module.exports = router
