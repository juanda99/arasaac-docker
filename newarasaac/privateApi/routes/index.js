const router = require('express').Router()
const materials = require('./materials')

router.use('/materials', materials)

router.get('/', (req, res) => {
  res.status(200).json({ message: 'Connected to ARASAAC private API' })
})

module.exports = router
