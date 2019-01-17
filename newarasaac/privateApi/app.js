const express = require('express')
const cors = require('cors')
const router = require('./routes')
const bodyParser = require('body-parser')

const app = express()
const port = process.env.port || 80

/* bbdd config */
require('./db')

app.use(cors())
app.set('etag', false)

app.use(bodyParser.json({limit: '50mb', type: 'application/json'}))

app.use('/api', router)

app.listen(port, () => {
  console.log(`App running on port ${port}`)
})

module.exports = app // for testing
