"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var sharp = require('sharp');

var path = require('path');

var fs = require('fs-extra');

var _require = require('../config'),
    IMAGE_DIR = _require.IMAGE_DIR;

var _require2 = require('../utils/svgCodes'),
    pluralSVGCode = _require2.pluralSVGCode,
    pastSVGCode = _require2.pastSVGCode,
    futureSVGCode = _require2.futureSVGCode,
    identitySVGCode = _require2.identitySVGCode,
    identityBNSVGCode = _require2.identityBNSVGCode;

var skin = {
  white: '#F5E5DE',
  black: '#A65C17',
  assian: '#F4ECAD',
  mulatto: '#E3AB72',
  aztec: '#CF9D7C',
  schematic: '#FEFEFE'
};
var hair = {
  brown: '#A65E26',
  blonde: '#FDD700',
  red: '#ED4120',
  black: '#020100',
  gray: '#EFEFEF',
  darkGray: '#AAABAB',
  darkBrown: '#6A2703'
};

var getNextLayer = function getNextLayer(layer) {
  var layers = ['Fondo', 'contorno2', 'relleno', 'contorno'];
  var layerIndex = layers.indexOf(layer) + 1;

  if (layerIndex < 4) {
    return "<g id=\"".concat(layers[layerIndex], "\">");
  }

  return '</svg>';
};

var identifierCode = function identifierCode(type) {
  var position = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'right';
  var color = arguments.length > 2 ? arguments[2] : undefined;
  return color ? identitySVGCode[type][position] : identityBNSVGCode[type][position];
};

var modifyLayer = function modifyLayer(fileContent, layer, layerText) {
  var startAt = "<g id=\"".concat(layer, "\">");
  var finishAt = getNextLayer(layer);
  var s = fileContent.indexOf(startAt);
  var f = fileContent.indexOf(finishAt);
  return "".concat(fileContent.substr(0, s), "<g id=\"").concat(layer, "\">").concat(layerText, "</g>\n").concat(fileContent.substr(f));
};

var addLayer = function addLayer(fileContent, layer, layerText) {
  var s = fileContent.indexOf('</svg>');
  return "".concat(fileContent.substr(0, s), "<g id=\"").concat(layer, "\">").concat(layerText, "</g>\n</svg>");
};

var getPNGFileName =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(file, options) {
    var plural, color, backgroundColor, action, resolution, identifier, identifierPosition, idFile, fileName;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            plural = options.plural, color = options.color, backgroundColor = options.backgroundColor, action = options.action, resolution = options.resolution, identifier = options.identifier, identifierPosition = options.identifierPosition;
            idFile = path.basename(file, '.svg');
            fileName = idFile;
            if (plural) fileName = "".concat(fileName, "_plural");
            if (!color) fileName = "".concat(fileName, "_nocolor");
            if (backgroundColor) fileName = "".concat(fileName, "_backgroundColor-").concat(backgroundColor.replace('#', '').toUpperCase());
            if (action !== 'present') fileName = "".concat(fileName, "_action-").concat(action);
            if (options.hair) fileName = "".concat(fileName, "_hair-").concat(hair[options.hair].substr(1, 6));
            if (options.skin) fileName = "".concat(fileName, "_skin-").concat(skin[options.skin].substr(1, 6));
            fileName = "".concat(fileName, "_").concat(resolution);

            if (identifier) {
              fileName = "".concat(fileName, "_identifier-").concat(identifier);
              if (identifierPosition === 'left') fileName = "".concat(fileName, "-").concat(identifierPosition);
            }

            _context.next = 13;
            return fs.ensureDir(path.resolve(IMAGE_DIR, idFile));

          case 13:
            return _context.abrupt("return", path.resolve(IMAGE_DIR, idFile, "".concat(fileName, ".png")));

          case 14:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function getPNGFileName(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var skinsToRemove = "".concat(skin.white, "|").concat(skin.schematic);
var reSkin = new RegExp(skinsToRemove, 'gim');

var modifySkin = function modifySkin(fileContent, key) {
  return fileContent.replace(reSkin, skin[key]);
};

var hairToRemove = function hairToRemove() {
  var value = '';
  Object.keys(hair).forEach(function (key) {
    value += "".concat(hair[key], "|");
  });
  return value.slice(0, -1);
};

var reHair = new RegExp(hairToRemove(), 'gim');

var modifyHair = function modifyHair(fileContent, key) {
  return fileContent.replace(reHair, hair[key]);
};

var modifySVG = function modifySVG(fileContent, options) {
  var content = fileContent;
  var plural = options.plural,
      color = options.color,
      backgroundColor = options.backgroundColor,
      action = options.action,
      hair = options.hair,
      skin = options.skin,
      identifier = options.identifier,
      identifierPosition = options.identifierPosition;
  if (plural) content = addLayer(content, 'plural', pluralSVGCode);
  if (backgroundColor) content = modifyLayer(content, 'Fondo', "<rect x=\"-55\" y=\"147\" style=\"fill:".concat(backgroundColor, ";\" width=\"500\" height=\"500\"/>"));
  if (!color) content = modifyLayer(content, 'relleno', '');
  if (action === 'future') content = addLayer(content, 'action', futureSVGCode);else if (action === 'past') content = addLayer(content, 'action', pastSVGCode);
  if (hair) content = modifyHair(content, hair);
  if (skin) content = modifySkin(content, skin);

  if (identifier) {
    content = addLayer(content, 'identifier', identifierCode(identifier, identifierPosition, color));
  }
  /* eslint-enable no-param-reassign */


  return content;
};

var convertSVG = function convertSVG(fileContent, resolution) {
  // density 450p is for 3125x image
  var density = parseInt(0.144 * resolution, 10);
  var fileBuffer = Buffer.from(fileContent);
  return sharp(fileBuffer, {
    density: density
  }).png().toBuffer();
};

module.exports = {
  convertSVG: convertSVG,
  getPNGFileName: getPNGFileName,
  modifySVG: modifySVG
};