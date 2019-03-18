import cors from 'cors'
import express from 'express'
import fs from 'fs'
import yaml from 'js-yaml'
import morgan from 'morgan'
import passport from 'passport'
import path from 'path'
import SwaggerExpress from 'swagger-express-mw'

import { port } from './config'
var app = express()

// generate json for swagger-ui
try {
  // eslint-disable-next-line
  var swaggerDocument = yaml.safeLoad(
    fs.readFileSync(path.join(__dirname, './swagger/swagger.yaml'), 'utf8'))
  const swaggerJSON = JSON.stringify(swaggerDocument, null, 4)
  const fileName = path.join(__dirname, './public/arasaac.json')
  fs.writeFile(fileName, swaggerJSON, function(err) {
    if (err) return console.log(err)
    console.log(`arasaac.json file generated at ${fileName}`)
  })
} catch (e) {
  console.log(e)
}

const swaggerConfig = {
  appRoot: __dirname, // required config
  configDir: path.resolve(__dirname, 'config'),
  swaggerFile: `${__dirname}/swagger/swagger.yaml`
}

/*bbdd configuration in its own file*/
require('./db')
app.use(passport.initialize())
app.use(cors())
app.set('etag', false)
app.use(morgan('dev'))
app.use(express.static('./public'))

// we serve swagger-ui from our frontend, but it could be done from here, enabling next line
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

SwaggerExpress.create(swaggerConfig, function(err, swaggerExpress) {
  if (err) {
    throw err
  }
  swaggerExpress.register(app)
  app.listen(port)
  console.log('App running on port ' + port)
})

module.exports = app // for testing
