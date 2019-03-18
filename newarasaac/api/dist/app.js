"use strict";

var _cors = _interopRequireDefault(require("cors"));

var _express = _interopRequireDefault(require("express"));

var _fs = _interopRequireDefault(require("fs"));

var _jsYaml = _interopRequireDefault(require("js-yaml"));

var _morgan = _interopRequireDefault(require("morgan"));

var _passport = _interopRequireDefault(require("passport"));

var _path = _interopRequireDefault(require("path"));

var _swaggerExpressMw = _interopRequireDefault(require("swagger-express-mw"));

var _config = require("./config");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express.default)(); // generate json for swagger-ui

try {
  // eslint-disable-next-line
  var swaggerDocument = _jsYaml.default.safeLoad(_fs.default.readFileSync(_path.default.join(__dirname, './swagger/swagger.yaml'), 'utf8'));

  var swaggerJSON = JSON.stringify(swaggerDocument, null, 4);

  var fileName = _path.default.join(__dirname, './public/arasaac.json');

  _fs.default.writeFile(fileName, swaggerJSON, function (err) {
    if (err) return console.log(err);
    console.log("arasaac.json file generated at ".concat(fileName));
  });
} catch (e) {
  console.log(e);
}

var swaggerConfig = {
  appRoot: __dirname,
  // required config
  configDir: _path.default.resolve(__dirname, 'config'),
  swaggerFile: "".concat(__dirname, "/swagger/swagger.yaml")
  /*bbdd configuration in its own file*/

};

require('./db');

app.use(_passport.default.initialize());
app.use((0, _cors.default)());
app.set('etag', false);
app.use((0, _morgan.default)('dev'));
app.use(_express.default.static('./public')); // we serve swagger-ui from our frontend, but it could be done from here, enabling next line
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

_swaggerExpressMw.default.create(swaggerConfig, function (err, swaggerExpress) {
  if (err) {
    throw err;
  }

  swaggerExpress.register(app);
  app.listen(_config.port);
  console.log('App running on port ' + _config.port);
});

module.exports = app; // for testing