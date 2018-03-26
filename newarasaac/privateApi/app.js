const express = require('express')
const app = express()

const port = process.env.port || 4000

/* bbdd config */
require('./db')

app.use(cors())
app.set('etag', false)

var router = require('./routes')
app.use('/api', router)

app.post('/materials', (req, res, next) => {})

app.listen(3001, () => {
  console.log(`App running on port ${port}`)
})

module.exports = app // for testing
