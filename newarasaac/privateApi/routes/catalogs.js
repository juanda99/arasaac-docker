const router = require('express').Router()
const catalogsController = require('../controllers/catalogsController')

const passport = require('passport')
const { hasRole } = require('../middlewares')

const returnRouter = io => {
  router.post('/',
    passport.authenticate('bearer', { session: false }),
    hasRole('admin'),
    (req, res) => {
      catalogsController.createAllCatalogs(req, res, io)
    })

  router.post('/:locale',
    passport.authenticate('bearer', { session: false }),
    hasRole('admin'),
    (req, res) => {
      catalogsController.createCatalogByLanguage(req, res, io)
    })

  router.get('/',
    passport.authenticate('bearer', { session: false }),
    hasRole('admin'),
    (req, res) => {
      catalogsController.getAllCatalogs(req, res)
    })

  router.get('/:locale',
    passport.authenticate('bearer', { session: false }),
    hasRole('admin'),
    (req, res) => {
      catalogsController.getCatalogsByLanguage(req, res)
    })
  return router
}

module.exports = returnRouter
