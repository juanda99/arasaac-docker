const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const cors = require('cors')
const router = require('./routes')(io)
const { loadLocutionsFiles } = require('./controllers/utils')

const bodyParser = require('body-parser')

// check all variables are defined
require('./checkEnv.js')

const port = process.env.port || 80

// whenever we receive a `connection` event
// our async function is then called
io.on('connection', async socket => {
  console.log('Client Successfully Connected')
})

/* bbdd config */
require('./db')

/* crontab config */
require('./crontab')

// Passport configuration
require('./auth')

app.use(cors())
io.set('origins', '*:*')
app.set('etag', false)

// const locutionsFiles = loadLocutionsFiles()

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

app.use(bodyParser.json({ limit: '50mb', type: 'application/json' }))

app.use('/api', router)

// not express but http server so socket-io can work
server.listen(port, () => {
  console.log(`App running on port ${port}`)
})

app.set('locutionsFiles', loadLocutionsFiles())
module.exports = app // for testing
