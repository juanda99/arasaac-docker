"use strict";

var _jwtDecode = _interopRequireDefault(require("jwt-decode"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var User = require('../models/User');

var auth = require('../helpers/auth');

module.exports = {
  getProfile: function getProfile(req, res) {
    console.log('kkkkkkkkkkkkkkkkkkkk'); //console.log(req)
    // we obtain the user id from token to get his profile

    var token = req.headers.authorization.split(' ').pop();
    console.log(token);
    var decoded = (0, _jwtDecode.default)(token);
    var id = decoded.sub;
    console.log('xxxxxxxxxsssxxxxx');
    console.log(id);
    console.log('xxxxxxxxxxxxxxxx');
    User.findOne({
      _id: id
    }, {
      _id: 0,
      password: 0,
      authToken: 0
    }, function (err, user) {
      if (err) {
        return res.status(500).json({
          message: 'Error getting user profile. ' + err
        });
      }

      if (!user) {
        return res.status(404).json({
          message: 'User does not exist. User Id: ' + id
        });
      }

      return res.status(200).json(user);
    });
  },
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