"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var fs = require('fs-extra');

var path = require('path');

var imagemin = require('imagemin');

var imageminPngquant = require('imagemin-pngquant'); // we load pictos model for all languages


var setPictogramModel = require('../models/Pictograms');

var stopWords = require('../utils/stopWords');

var _require = require('../config'),
    IMAGE_DIR = _require.IMAGE_DIR,
    SVG_DIR = _require.SVG_DIR,
    IMAGE_URL = _require.IMAGE_URL;

var languages = require('../utils/languages');

var _require2 = require('../utils/svg'),
    convertSVG = _require2.convertSVG,
    getPNGFileName = _require2.getPNGFileName,
    modifySVG = _require2.modifySVG;

var Pictograms = languages.reduce(function (dict, language) {
  dict[language] = setPictogramModel(language);
  return dict;
}, {});

var getPictogramById =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(req, res) {
    var id, locale, pictogram;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            id = req.swagger.params.idPictogram.value;
            locale = req.swagger.params.locale.value;
            _context.prev = 2;
            _context.next = 5;
            return Pictograms[locale].findOne({
              idPictogram: id
            }).populate('authors', '_id name');

          case 5:
            pictogram = _context.sent;

            if (pictogram) {
              _context.next = 8;
              break;
            }

            return _context.abrupt("return", res.status(404).json());

          case 8:
            return _context.abrupt("return", res.json(pictogram));

          case 11:
            _context.prev = 11;
            _context.t0 = _context["catch"](2);
            return _context.abrupt("return", res.status(500).json({
              message: 'Error getting pictograms. See error field for detail',
              error: _context.t0
            }));

          case 14:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[2, 11]]);
  }));

  return function getPictogramById(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var getPictogramFileById =
/*#__PURE__*/
function () {
  var _ref2 = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2(req, res) {
    var file, url, options, download, fileName, exists, svgContent, newSVGContent;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            console.log('kkkkkkk');
            file = "".concat(req.swagger.params.idPictogram.value, ".svg");
            /* eslint-disable multiline-ternary */

            url = req.swagger.params.url.value === true;
            options = {
              plural: req.swagger.params.plural.value || false,
              color: req.swagger.params.color.value === false ? req.swagger.params.color.value : true,
              backgroundColor: req.swagger.params.backgroundColor.value || false,
              action: req.swagger.params.action.value || 'present',
              resolution: req.swagger.params.resolution.value || 500,
              skin: req.swagger.params.skin.value || false,
              hair: req.swagger.params.hair.value || false,
              identifier: req.swagger.params.identifier.value,
              identifierPosition: req.swagger.params.identifierPosition.value
            };
            download = req.swagger.params.download.value || false;
            /* eslint-enable multiline-ternary */

            _context2.prev = 5;
            _context2.next = 8;
            return getPNGFileName(file, options);

          case 8:
            fileName = _context2.sent;
            _context2.next = 11;
            return fs.pathExists(fileName);

          case 11:
            exists = _context2.sent;
            console.log(exists);
            console.log("Download: ".concat(JSON.stringify(download)));

            if (!exists) {
              _context2.next = 20;
              break;
            }

            if (!url) {
              _context2.next = 17;
              break;
            }

            return _context2.abrupt("return", res.json({
              image: fileName.replace(IMAGE_DIR, IMAGE_URL)
            }));

          case 17:
            if (download) {
              _context2.next = 19;
              break;
            }

            return _context2.abrupt("return", res.sendFile(fileName));

          case 19:
            return _context2.abrupt("return", res.download(fileName));

          case 20:
            _context2.next = 22;
            return fs.readFile(path.resolve(SVG_DIR, file), 'utf-8');

          case 22:
            svgContent = _context2.sent;
            newSVGContent = modifySVG(svgContent, options);
            convertSVG(newSVGContent, options.resolution).then(function (buffer) {
              return imagemin.buffer(buffer, {
                plugins: [imageminPngquant({
                  quality: '65-80',
                  speed: 10
                })]
              });
            }).then(function (buffer) {
              fs.open(fileName, 'w', function (err, fd) {
                if (err) {
                  throw 'could not open file: ' + err;
                } // write the contents of the buffer, from position 0 to the end, to the file descriptor returned in opening our file


                fs.write(fd, buffer, 0, buffer.length, null, function (err) {
                  if (err) throw 'error writing file: ' + err;
                  fs.close(fd, function () {
                    console.log("IMAGE GENERATED: ".concat(fileName));
                    if (url) res.json({
                      image: fileName.replace(IMAGE_DIR, IMAGE_URL)
                    });else if (download) res.download(fileName);else res.sendFile(fileName);
                  });
                });
              });
            });
            _context2.next = 31;
            break;

          case 27:
            _context2.prev = 27;
            _context2.t0 = _context2["catch"](5);
            console.log(_context2.t0);
            return _context2.abrupt("return", res.status(500).json({
              message: 'Error generating pictogram. See error field for details',
              error: _context2.t0
            }));

          case 31:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, null, [[5, 27]]);
  }));

  return function getPictogramFileById(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

var searchPictograms =
/*#__PURE__*/
function () {
  var _ref3 = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee3(req, res) {
    var locale, searchText, pictograms;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            locale = req.swagger.params.locale.value;
            searchText = stopWords(req.swagger.params.searchText.value, locale);
            console.log("searchText filtered:  ".concat(searchText));
            _context3.prev = 3;
            _context3.next = 6;
            return Pictograms[locale].find({
              $text: {
                $search: searchText,
                $language: 'none',
                $diacriticSensitive: false
              }
            }, {
              score: {
                $meta: 'textScore'
              }
            }).populate('authors', '_id name').sort({
              score: {
                $meta: 'textScore'
              }
            });

          case 6:
            pictograms = _context3.sent;

            if (!(pictograms.length === 0)) {
              _context3.next = 9;
              break;
            }

            return _context3.abrupt("return", res.status(404).json([]));

          case 9:
            return _context3.abrupt("return", res.json(pictograms));

          case 12:
            _context3.prev = 12;
            _context3.t0 = _context3["catch"](3);
            console.log(_context3.t0);
            return _context3.abrupt("return", res.status(500).json({
              message: 'Error getting pictograms. See error field for detail',
              error: _context3.t0
            }));

          case 16:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, null, [[3, 12]]);
  }));

  return function searchPictograms(_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}();

var getNewPictograms =
/*#__PURE__*/
function () {
  var _ref4 = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee4(req, res) {
    var days, locale, startDate, pictograms;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            days = req.swagger.params.days.value;
            locale = req.swagger.params.locale.value;
            startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            _context4.prev = 4;
            _context4.next = 7;
            return Pictograms[locale].find({
              lastUpdated: {
                $gt: startDate
              }
            }).sort({
              lastUpdated: -1
            }).populate('authors', '_id name');

          case 7:
            pictograms = _context4.sent;

            if (!(pictograms.length === 0)) {
              _context4.next = 10;
              break;
            }

            return _context4.abrupt("return", res.status(404).json([]));

          case 10:
            return _context4.abrupt("return", res.json(pictograms));

          case 13:
            _context4.prev = 13;
            _context4.t0 = _context4["catch"](4);
            return _context4.abrupt("return", res.status(500).json({
              message: 'Error searching pictogram. See error field for detail',
              error: _context4.t0
            }));

          case 16:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, null, [[4, 13]]);
  }));

  return function getNewPictograms(_x7, _x8) {
    return _ref4.apply(this, arguments);
  };
}();

var getLastPictograms =
/*#__PURE__*/
function () {
  var _ref5 = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee5(req, res) {
    var numItems, locale, pictograms;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            numItems = req.swagger.params.numItems.value;
            locale = req.swagger.params.locale.value;
            _context5.prev = 2;
            _context5.next = 5;
            return Pictograms[locale].find().sort({
              lastUpdated: -1
            }).limit(numItems).populate('authors', '_id name');

          case 5:
            pictograms = _context5.sent;

            if (!(pictograms.length === 0)) {
              _context5.next = 8;
              break;
            }

            return _context5.abrupt("return", res.status(404).json([]));

          case 8:
            return _context5.abrupt("return", res.json(pictograms));

          case 11:
            _context5.prev = 11;
            _context5.t0 = _context5["catch"](2);
            return _context5.abrupt("return", res.status(500).json({
              message: 'Error searching pictogram. See error field for detail',
              error: _context5.t0
            }));

          case 14:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, null, [[2, 11]]);
  }));

  return function getLastPictograms(_x9, _x10) {
    return _ref5.apply(this, arguments);
  };
}();

module.exports = {
  getPictogramById: getPictogramById,
  getPictogramFileById: getPictogramFileById,
  searchPictograms: searchPictograms,
  getNewPictograms: getNewPictograms,
  getLastPictograms: getLastPictograms
};