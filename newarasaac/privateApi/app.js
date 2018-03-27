const express = require('express')
const cors = require('cors')
const router = require('./routes')

const app = express()
const port = process.env.port || 4000

/* bbdd config */
require('./db')

app.use(cors())
app.set('etag', false)

app.use('/api', router)

app.listen(port, () => {
  console.log(`App running on port ${port}`)
})

module.exports = app // for testing
