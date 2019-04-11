import jwtDecode from 'jwt-decode'
var User = require('../models/User')
var auth = require('../helpers/auth')

module.exports = {
  getProfile: async (req, res) => {
    //console.log(req)
    // we obtain the user id from token to get his profile
    const token = req.headers.authorization.split(' ').pop()
    const decoded = jwtDecode(token)
    const id = decoded.sub
    try {
      const user = await User.findOne(
        { _id: id },
        { _id: 0, password: 0, authToken: 0, verifyToken: 0, __v: 0 }
      )
      if (!user) {
        return res.status(404).json({
          message: 'User does not exist. User Id: ' + id
        })
      }
      return res.status(200).json(user)
    } catch (err) {
      return res.status(500).json({
        message: 'Error getting user profile. ' + err
      })
    }
  },

  updateUser: (req, res) => {
    var id = req.swagger.params.id.value
    User.findOne({ _id: id }, function(err, users) {
      if (err) {
        return res.status(500).json({
          message: 'Error updating user. ' + err
        })
      }
      if (!users) {
        return res.status(404).json({
          message: 'Unable to find user. User Id: ' + id
        })
      }
      users.name = req.body.name
      users.username = req.body.username
      users.email = req.body.email
      users.locale = req.body.locale
      users.save(function(err, users) {
        if (err) {
          return res.status(500).json({
            message: 'Error saving user ' + err
          })
        }
        if (!users) {
          return res.status(404).json({
            message: 'Unable to find user. User id: ' + id
          })
        }
      })
      return res.status(200).json(users)
    })
  },
  loginUser: (args, res) => {
    var role = args.swagger.params.role.value
    var username = args.body.username
    var password = args.body.password
    console.log(role + username + password)

    if (role !== 'user' && role !== 'admin') {
      return res.status(400).json({
        message: 'Error: Role must be either "admin" or "user"'
      })
    }

    if (username === 'username' && password === 'password' && role) {
      var tokenString = auth.issueToken(username, role)
      res.status(200).json({
        token: tokenString,
        message: 'User successfully authenticated'
      })
    } else {
      res.status(403).json({
        message: 'Error: Credentials incorrect'
      })
    }
  }
}
