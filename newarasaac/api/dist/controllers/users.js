"use strict";

var _jwtDecode = _interopRequireDefault(require("jwt-decode"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var User = require('../models/User');

var auth = require('../helpers/auth');

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
              console.log(id);
              _context.prev = 4;
              _context.next = 7;
              return User.findOne({
                _id: id
              }, {
                _id: 0,
                name: 1,
                email: 1,
                locale: 1,
                role: 1,
                targetLanguages: 1,
                favorites: 1,
                lastLogin: 1,
                facebook: 1,
                google: 1
              });

            case 7:
              user = _context.sent;

              if (user) {
                _context.next = 10;
                break;
              }

              return _context.abrupt("return", res.status(404).json({
                message: 'User does not exist. User Id: ' + id
              }));

            case 10:
              return _context.abrupt("return", res.status(200).json(user));

            case 13:
              _context.prev = 13;
              _context.t0 = _context["catch"](4);
              return _context.abrupt("return", res.status(500).json({
                message: 'Error getting user profile. ' + _context.t0
              }));

            case 16:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, null, [[4, 13]]);
    }));

    function getProfile(_x, _x2) {
      return _getProfile.apply(this, arguments);
    }

    return getProfile;
  }(),
  updateUser: function updateUser(req, res) {
    var id = req.swagger.params.id.value;
    User.findOne({
      _id: id
    }, function (err, users) {
      if (err) {
        return res.status(500).json({
          message: 'Error updating user. ' + err
        });
      }

      if (!users) {
        return res.status(404).json({
          message: 'Unable to find user. User Id: ' + id
        });
      }

      users.name = req.body.name;
      users.username = req.body.username;
      users.email = req.body.email;
      users.locale = req.body.locale;
      users.save(function (err, users) {
        if (err) {
          return res.status(500).json({
            message: 'Error saving user ' + err
          });
        }

        if (!users) {
          return res.status(404).json({
            message: 'Unable to find user. User id: ' + id
          });
        }
      });
      return res.status(200).json(users);
    });
  },
  loginUser: function loginUser(args, res) {
    var role = args.swagger.params.role.value;
    var username = args.body.username;
    var password = args.body.password;
    console.log(role + username + password);

    if (role !== 'user' && role !== 'admin') {
      return res.status(400).json({
        message: 'Error: Role must be either "admin" or "user"'
      });
    }

    if (username === 'username' && password === 'password' && role) {
      var tokenString = auth.issueToken(username, role);
      res.status(200).json({
        token: tokenString,
        message: 'User successfully authenticated'
      });
    } else {
      res.status(403).json({
        message: 'Error: Credentials incorrect'
      });
    }
  }
};