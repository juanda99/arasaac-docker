const router = require('express').Router()
const materiales = require('./materiales')

router.use('/materiales', materiales)

router.get('/', (req, res) => {
  res.status(200).json({ message: 'Estás conectado a nuestra API' })
})

module.exports = router
