"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

// habrá que concatenar dos funciones asíncronas,
// Una para recibir los ficheros (imagenes de materiales) del dir correspondiente
// Otra que lee los datos en la bbdd
// mandar json cuandto todo acabe:
// https://stackoverflow.com/questions/2727167/how-do-you-get-a-list-of-the-names-of-all-files-present-in-a-directory-in-node-j/37532027#37532027
var Materials = require('../models/Materials');

var config = require('../config');

var recursive = require('recursive-readdir');

var path = require('path');

var _Promise = require('bluebird');

module.exports = {
  getMaterialById: function getMaterialById(req, res) {
    var id = req.swagger.params.idMaterial.value; // Use lean to get a plain JS object to modify it, instead of a full model instance
    // Materials.findOne({idMaterial: id}, function(err, material){

    Materials.findOne({
      idMaterial: id
    }).lean().exec(
    /*#__PURE__*/
    function () {
      var _ref = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee(err, material) {
        var response;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!err) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt("return", res.status(500).json({
                  message: 'Se ha producido un error al obtener el material',
                  error: err
                }));

              case 2:
                if (material) {
                  _context.next = 4;
                  break;
                }

                return _context.abrupt("return", res.status(404).json({
                  message: 'No tenemos este material',
                  err: err
                }));

              case 4:
                _context.next = 6;
                return getFiles(material);

              case 6:
                response = _context.sent;
                return _context.abrupt("return", res.json(response));

              case 8:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      return function (_x, _x2) {
        return _ref.apply(this, arguments);
      };
    }());
  },
  // Materials.find({ $text: { $search: searchText, $language: locale } }, {score: {$meta: 'textScore'}}).sort({score:{$meta:'textScore'}}, function(err, materials) {
  // https://docs.mongodb.com/v3.0/reference/operator/query/text/
  // more complex search: http://stackoverflow.com/questions/28891165/using-weights-for-searching-in-mongoose
  searchMaterials: function searchMaterials(req, res) {
    var locale = req.swagger.params.locale.value;
    var searchText = req.swagger.params.searchText.value;
    Materials.find({
      $text: {
        $search: searchText,
        $language: locale
      }
    }, {
      score: {
        $meta: 'textScore'
      }
    }).sort({
      'score': {
        '$meta': 'textScore'
      }
    }).lean().exec(
    /*#__PURE__*/
    function () {
      var _ref2 = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee3(err, materials) {
        var response;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (!err) {
                  _context3.next = 2;
                  break;
                }

                return _context3.abrupt("return", res.status(500).json({
                  message: 'Error buscando el material',
                  error: err
                }));

              case 2:
                if (!(materials.length === 0)) {
                  _context3.next = 4;
                  break;
                }

                return _context3.abrupt("return", res.status(404).json([]));

              case 4:
                _context3.next = 6;
                return _Promise.all(materials.map(
                /*#__PURE__*/
                function () {
                  var _ref3 = _asyncToGenerator(
                  /*#__PURE__*/
                  regeneratorRuntime.mark(function _callee2(material) {
                    return regeneratorRuntime.wrap(function _callee2$(_context2) {
                      while (1) {
                        switch (_context2.prev = _context2.next) {
                          case 0:
                            _context2.next = 2;
                            return getFiles(material);

                          case 2:
                            return _context2.abrupt("return", _context2.sent);

                          case 3:
                          case "end":
                            return _context2.stop();
                        }
                      }
                    }, _callee2);
                  }));

                  return function (_x5) {
                    return _ref3.apply(this, arguments);
                  };
                }()));

              case 6:
                response = _context3.sent;
                return _context3.abrupt("return", res.json(response));

              case 8:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }));

      return function (_x3, _x4) {
        return _ref2.apply(this, arguments);
      };
    }());
  },
  getNewMaterials: function getNewMaterials(req, res) {
    var days = req.swagger.params.days.value;
    var startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    Materials.find({
      lastUpdate: {
        $gt: startDate
      }
    }).sort({
      lastUpdate: -1
    }).lean().exec(
    /*#__PURE__*/
    function () {
      var _ref4 = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee4(err, materials) {
        var response;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (!err) {
                  _context4.next = 2;
                  break;
                }

                return _context4.abrupt("return", res.status(500).json({
                  message: 'Error buscando el material',
                  error: err
                }));

              case 2:
                if (!(materials.length === 0)) {
                  _context4.next = 4;
                  break;
                }

                return _context4.abrupt("return", res.status(404).json([]));

              case 4:
                _context4.next = 6;
                return _Promise.all(materials.map(function (material) {
                  return getFiles(material);
                }));

              case 6:
                response = _context4.sent;
                return _context4.abrupt("return", res.json(response));

              case 8:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4);
      }));

      return function (_x6, _x7) {
        return _ref4.apply(this, arguments);
      };
    }());
  },
  getLastMaterials: function getLastMaterials(req, res) {
    var numItems = req.swagger.params.numItems.value;
    Materials.find().sort({
      lastUpdate: -1
    }).limit(numItems).lean().exec(
    /*#__PURE__*/
    function () {
      var _ref5 = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee5(err, materials) {
        var response;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if (!err) {
                  _context5.next = 2;
                  break;
                }

                return _context5.abrupt("return", res.status(500).json({
                  message: 'Error buscando el material',
                  error: err
                }));

              case 2:
                if (!(materials.length === 0)) {
                  _context5.next = 4;
                  break;
                }

                return _context5.abrupt("return", res.status(404).json([]));

              case 4:
                _context5.next = 6;
                return _Promise.all(materials.map(function (material) {
                  return getFiles(material);
                }));

              case 6:
                response = _context5.sent;
                return _context5.abrupt("return", res.json(response));

              case 8:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5);
      }));

      return function (_x8, _x9) {
        return _ref5.apply(this, arguments);
      };
    }());
  },
  createMaterials: function createMaterials(req, res) {
    var material = new Materials(req.body);
    material.save(function (err, material) {
      if (err) {
        return res.status(500).json({
          message: 'Error al guardar el material',
          error: err
        });
      }

      return res.status(201).json({
        message: 'saved',
        _id: material._id
      });
    });
  },
  updateMaterials: function updateMaterials(req, res) {
    var id = req.params.id;
    Materials.findOne({
      _id: id
    }, function (err, material) {
      if (err) {
        return res.status(500).json({
          message: 'Se ha producido un error al guardar el material',
          error: err
        });
      }

      if (!material) {
        return res.status(404).json({
          message: 'No hemos encontrado el material'
        });
      }

      material.Nombre = req.body.nombre;
      material.Descripción = req.body.descripcion;
      material.Graduacion = req.body.graduacion;
      material.Envase = req.body.envase;
      material.Precio = req.body.precio;
      material.save(function (err, material) {
        if (err) {
          return res.status(500).json({
            message: 'Error al guardar el material'
          });
        }

        if (!material) {
          return res.status(404).json({
            message: 'No hemos encontrado el material'
          });
        }

        return res.json(material);
      });
    });
  },
  removeMaterials: function removeMaterials(req, res) {
    var id = req.params.id;
    Materials.findByIdAndRemove(id, function (err, material) {
      if (err) {
        return res.json(500, {
          message: 'No hemos encontrado el  material',
          error: err
        });
      }

      return res.json(material);
    });
  }
};

var initMaterial = function initMaterial(material) {
  material.commonFiles = [];
  material.screenshots = {};
  material.commonScreenshots = [];
  material.files = {};
  material.file = {};
};

var getFiles = function getFiles(material) {
  initMaterial(material);
  return new _Promise(function (resolve) {
    var materialLocales = [material.lang];
    var baseDir = "".concat(config.materialsDir).concat(path.sep).concat(material.idMaterial).concat(path.sep);
    material.translations.map(function (translation) {
      return materialLocales.push(translation.lang);
    });
    recursive(baseDir, function (err, files) {
      // if err return material, if err is different from no screenshots dir, warning through console
      if (err) err.code !== 'ENOENT' && console.warn(err);

      if (files) {
        console.log("Files: ".concat(files));
        files.map(function (file) {
          var relativeFile = file.replace(baseDir, '');
          var fileName = path.basename(file);
          if (fileName === 'index.html') return; // extra files from previous app

          var dir = path.dirname(relativeFile);
          var subdir = path.dirname(relativeFile).split(path.sep).pop();

          if (dir === '.') {
            //if file is tar.gz, put it inside file json  {es: xxx-es.tgz, fr: xxx.fr.tgz...}
            var filePattern = new RegExp('^index-[A-z]{2,3}-[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}.tgz$', 'i');

            if (filePattern.test(fileName)) {
              var fileLocale = fileName.split('-')[1];
              material.file[fileLocale] = fileName;
            } else material.commonFiles.push(fileName);
          } else if (dir.match(/screenshots_300$/)) material.commonScreenshots.push(fileName);else if (dir.match(/screenshots_300\/[A-z]{2,3}$/)) {
            material.screenshots[subdir] ? material.screenshots[subdir].push(fileName) : material.screenshots[subdir] = [fileName];
          } else if (dir.match(/^[A-z]{2,3}$/)) {
            material.files[subdir] ? material.files[subdir].push(fileName) : material.files[subdir] = [fileName];
          }
        });
      }

      resolve(material);
    });
  });
};