import jwtDecode from 'jwt-decode'
var User = require('../models/User')

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
        {
          _id: 0,
          verifyToken: 0,
          verifyDate: 0,
          password: 0,
          __v: 0
        }
      )
      if (!user) {
        return res.status(404).json({
          message: `User does not exist. User Id:  ${id}`
        })
      }
      return res.status(200).json(user)
    } catch (err) {
      return res.status(500).json({
        message: `Error getting user profile:  ${err}`
      })
    }
  }
}
