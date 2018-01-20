const SwaggerExpress = require('swagger-express-mw')
// var swaggerTools = require('swagger-tools')
const path = require('path')
var express = require('express')
var cors = require('cors')
var app = express()
const morgan = require('morgan')
var auth = require('./helpers/auth') 

// private conf and envirnoment specific
// see .env file, must rename .env-sample to .env
require('dotenv').config()

const config = require('./config')
const yaml = require('js-yaml')
const fs = require('fs')
const swaggerDocument = yaml.safeLoad(fs.readFileSync(path.join(__dirname, './swagger/swagger.yaml'), 'utf8'))

const swaggerConfig = {
  appRoot: __dirname, // required config
  configDir: path.resolve(__dirname, 'config'),
  swaggerFile: `${__dirname}/swagger/swagger.yaml` 
}


/*bbdd configuration in its own file*/
require('./db')

app.use(cors())
app.set('etag', false)
app.use(morgan('dev'))
app.use(express.static('./public'))



// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

SwaggerExpress.create(swaggerConfig, function (err, swaggerExpress) {
  if (err) {throw err}
  // install middleware
  swaggerExpress.register(app)

  const port = process.env.PORT
  app.listen(port)
  console.log('App running on port ' + port)

})


module.exports = app // for testing
