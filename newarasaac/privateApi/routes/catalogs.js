const router = require('express').Router()
const catalogsController = require('../controllers/catalogsController')

const returnRouter = io => {
  router.post('/', (req, res) =>
    catalogsController.createAllCatalogsAsync(req, res, io)
  )
  router.post('/:locale', (req, res) =>
    catalogsController.createCatalogByLanguage(req, res, io)
  )
  router.get('/', (req, res) => catalogsController.getAllCatalogs(req, res))
  router.get('/:locale', (req, res) =>
    catalogsController.getCatalogsByLanguage(req, res)
  )
  return router
}

module.exports = returnRouter
