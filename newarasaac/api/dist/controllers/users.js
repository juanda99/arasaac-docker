"use strict";

var _jwtDecode = _interopRequireDefault(require("jwt-decode"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var User = require('../models/User');

var mailing = require('../mail');

var nev = mailing('en');

var auth = require('../helpers/auth');

module.exports = {
  createUser: function createUser(req, res) {
    var user = new User(req.body);
    nev.createTempUser(user, function (err, existingPersistentUser, newTempUser) {
      if (err) {
        return res.status(404).json({
          message: err
        });
      } // user already exists in persistent collection


      if (existingPersistentUser) {
        return res.status(409).json({
          message: 'You have already signed up and confirmed your account. Did you forget your password?'
        });
      } // new user created


      if (newTempUser) {
        console.log(newTempUser);
        var URL = newTempUser[nev.options.URLFieldName];
        nev.sendVerificationEmail(newTempUser.email, URL, function (err, info) {
          if (err) {
            return res.status(500).json({
              message: 'ERROR: sending verification email FAILED ' + info
            });
          }
        });
        return res.status(201).json({
          message: 'An email has been sent to you. Please check it to verify your account.',
          _id: newTempUser._id
        }); // user already exists in temporary collection!
      }

      return res.status(409).json({
        message: 'You have already signed up. Please check your email to verify your account.'
      });
    });
  },
  activateUser: function activateUser(req, res) {
    var url = req.swagger.params.url.value;
    nev.confirmTempUser(url, function (err, user) {
      if (user) {
        nev.sendConfirmationEmail(user.email, function (err, info) {
          if (err) {
            return res.status(500).json({
              message: 'ERROR: sending confirmation email FAILED ' + info
            });
          }

          res.status(201).json({
            message: 'User activated',
            _id: user._id,
            email: user.email,
            name: user.name,
            username: user.username,
            locale: user.locale
          });
        });
      } else {
        return res.status(404).json({
          message: 'ERROR: temporal user not found or expired'
        });
      }
    });
  },
  getUsers: function getUsers(req, res) {
    User.find({}, {
      password: 0,
      authToken: 0,
      GENERATED_VERIFYING_URL: 0,
      __v: 0
    }).sort({
      name: 1
    }).lean().exec(function (err, users) {
      if (err) {
        return res.status(500).json({
          message: 'Error getting users list: ' + err
        });
      } // if no items, return empty array


      if (users.length === 0) return res.status(404).json([]);
      return res.json(users);
    });
  },
  removeUser: function removeUser(req, res) {
    var id = req.swagger.params.id.value;
    User.findByIdAndRemove(id, function (err, users) {
      if (err) {
        return res.status(404).json({
          message: 'User not found. User Id: ' + id
        });
      }

      return res.status(200).json(users);
    });
  },
  getUser: function getUser(req, res) {
    var id = req.swagger.params.id.value;
    User.findOne({
      _id: id
    }, function (err, users) {
      if (err) {
        return res.status(500).json({
          message: 'Error getting user. ' + err
        });
      }

      if (!users) {
        return res.status(404).json({
          message: 'User does not exist. User Id: ' + id
        });
      }

      return res.status(200).json(users);
    });
  },
  getProfile: function getProfile(req, res) {
    //console.log(req)
    // we obtain the user id from token to get his profile
    var token = req.headers.authorization.split(' ').pop();
    console.log(token);
    var decoded = (0, _jwtDecode.default)(token);
    var id = decoded.sub;
    console.log('xxxxxxxxxxxxxx');
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