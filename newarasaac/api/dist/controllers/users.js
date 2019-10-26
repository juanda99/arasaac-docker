"use strict";

var _jwtDecode = _interopRequireDefault(require("jwt-decode"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var User = require('../models/User');

module.exports = {
  getProfile: function () {
    var _getProfile = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee(req, res) {
      var token, decoded, id, user;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              //console.log(req)
              // we obtain the user id from token to get his profile
              token = req.headers.authorization.split(' ').pop();
              decoded = (0, _jwtDecode.default)(token);
              id = decoded.sub;
              _context.prev = 3;
              _context.next = 6;
              return User.findOne({
                _id: id
              }, {
                _id: 0,
                verifyToken: 0,
                verifyDate: 0,
                password: 0,
                __v: 0
              });

            case 6:
              user = _context.sent;

              if (user) {
                _context.next = 9;
                break;
              }

              return _context.abrupt("return", res.status(404).json({
                message: "User does not exist. User Id:  ".concat(id)
              }));

            case 9:
              return _context.abrupt("return", res.status(200).json(user));

            case 12:
              _context.prev = 12;
              _context.t0 = _context["catch"](3);
              return _context.abrupt("return", res.status(500).json({
                message: "Error getting user profile:  ".concat(_context.t0)
              }));

            case 15:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, null, [[3, 12]]);
    }));

    function getProfile(_x, _x2) {
      return _getProfile.apply(this, arguments);
    }

    return getProfile;
  }()
};