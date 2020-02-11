const router = require('express').Router()
const materialsController = require('../controllers/materialsController')

const passport = require('passport')
const { hasRole } = require('../middlewares')

const returnRouter = io => {
  router.post('/',
    passport.authenticate('bearer', { session: false }),
    hasRole('admin'),
    (req, res) => {
      materialsController.create(req, res, io)
    })

  router.put('/:id',
    passport.authenticate('bearer', { session: false }),
    hasRole('admin'),
    (req, res) => {
      materialsController.update(req, res)
    })

  router.delete('/:id',
    passport.authenticate('bearer', { session: false }),
    hasRole('admin'),
    (req, res) => {
      materialsController.remove(req, res)
    })
  return router
}

module.exports = returnRouter
