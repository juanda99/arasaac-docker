const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const cors = require('cors')
const router = require('./routes')(io)
const bodyParser = require('body-parser')

const port = process.env.port || 80

// whenever we receive a `connection` event
// our async function is then called
io.on('connection', async socket => {
  // we should see this printed out whenever we have
  // a successful connection
  console.log('Client Successfully Connected')
  // we then send out a new message to the
  // `chat` channel with "Hello World"
  // Our clientside should be able to see
  // this and print it out in the console
  io.emit('backupPercent', 'hello world')
  console.log(io)
})

/* bbdd config */
require('./db')

app.use(cors())
io.set('origins', '*:*')
app.set('etag', false)

app.use(bodyParser.json({ limit: '50mb', type: 'application/json' }))

app.use('/api', router)

// not express but http server so socket-io can work
server.listen(port, () => {
  console.log(`App running on port ${port}`)
})

module.exports = app // for testing
