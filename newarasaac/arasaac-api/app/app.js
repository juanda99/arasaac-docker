const SwaggerExpress = require('swagger-express-mw')
const path = require('path')
var express = require('express')
var cors = require('cors')
var app = express()
const morgan = require('morgan')
// const swaggerUi = require('swagger-ui-express')

const config = require('./config')
// const errorhandler = require('errorhandler')  


const yaml = require('js-yaml')
const fs = require('fs')
try {
  var swaggerDocument = yaml.safeLoad(fs.readFileSync(path.join(__dirname, './api/swagger/swagger.yaml'), 'utf8'))
  const swaggerJSON = JSON.stringify(swaggerDocument, null, 4)
  fs.writeFile(path.join(__dirname,'./public/arasaac.json'), swaggerJSON, function (err) {
    if (err) return console.log(err)
    console.log('arasaac.json file generated')
  })
} catch (e) {
  console.log(e)
}

var swaggerConfig = {
  appRoot: __dirname, // required config
  configDir: path.resolve(__dirname, 'config')
  // swaggerFile: `${__dirname}/path/to/my/swagger.yaml`  
}


/*bbdd configuration in its own file*/
require('./db')

app.use(cors())
app.set('etag', false)
app.use(morgan('dev'))
app.use(express.static('./public'))



// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

SwaggerExpress.create(swaggerConfig, function (err, swaggerExpress) {
  if (err) { throw err }
  // install middleware
  swaggerExpress.register(app)

  var port = process.env.PORT || config.port
  app.listen(port)
  console.log('App running on port ' + port)

})


module.exports = app // for testing
