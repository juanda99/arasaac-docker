const router = require('express').Router()
const catalogsController = require('../controllers/catalogsController')

const returnRouter = io => {
  router.post('/', (req, res) =>
    catalogsController.createAllCatalogs(req, res, io)
  )
  router.post('/:locale', (req, res) =>
    catalogsController.createCatalogByLanguage(req, res, io)
  )
  return router
}

module.exports = returnRouter
