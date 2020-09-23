const router = require('express').Router()
const materialsController = require('../controllers/materialsController')

const passport = require('passport')
const { hasRole } = require('../middlewares')

router.get('/new/:numItems',
  passport.authenticate(['bearer', 'anonymous'], { session: false }),
  (req, res) => {
    materialsController.getLastMaterials(req, res)
  })

router.get('/unpublished',
  passport.authenticate(['bearer'], { session: false }),
  hasRole('admin'),
  (req, res) => {
    materialsController.getUnpublished(req, res)
  })

router.get('/:locale/:searchType/:searchText',
  passport.authenticate(['bearer', 'anonymous'], { session: false }),
  (req, res) => {
    materialsController.searchMaterials(req, res)
  })

router.get('/:id',
  passport.authenticate(['bearer', 'anonymous'], { session: false }),
  (req, res) => {
    materialsController.getMaterialById(req, res)
  })

router.post('/',
  passport.authenticate('bearer', { session: false }),
  (req, res) => {
    materialsController.create(req, res)
  })

router.post('/translations/:idMaterial',
  passport.authenticate('bearer', { session: false }),
  (req, res) => {
    materialsController.addTranslation(req, res)
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

module.exports = router
