const router = require('express').Router()
const wordsController = require('../controllers/wordsController')

router.get('/conjugations/:language/:word', (req, res) => {
  wordsController.getConjugations(req, res)
})

router.get('/synsets/:idSynset', (req, res) => {
  wordsController.getWordnetById(req, res)
})

router.get('/keywords/:language', (req, res) => {
  wordsController.updateKeywords(req, res)
})

module.exports = router
