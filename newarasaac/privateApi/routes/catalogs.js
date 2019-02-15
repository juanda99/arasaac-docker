const router = require('express').Router()
const catalogsController = require('../controllers/catalogsController')

router.post('/', (req, res) => catalogsController.createAllCatalogs(req, res))

router.post('/:locale', (req, res) => catalogsController.createCatalogByLanguage(req, res))

module.exports = router
