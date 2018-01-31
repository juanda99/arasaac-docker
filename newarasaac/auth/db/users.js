var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var validate = require('../validate');

var UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
  }
});

UserSchema.methods = {
  validPassword: function (plainText) {
    return bcrypt.compareSync(password, user.password)
  }
}
/*
//authenticate input against database
UserSchema.statics.authenticate = function (email, password, cb) {
  console.log('ha entrado....')
  return User.findOne({ email: email })
    .exec(function (err, user) {
      if (err) {
        console.log('***************************');
        console.log(err);
        console.log('**************************+');
        validate.logAndThrow(err);
      } else if (!user) {
        validate.logAndThrow('User does not exist');
      }
      bcrypt.compare(password, user.password, function (err, result) {
        if (result === true) {
          return user;
        } else {
          validate.logAndThrow('User password does not match');
        }
      })
    });
}
*/


var User = mongoose.model('User', UserSchema);


const users = [{
  id       : '1',
  username : 'bob',
  password : 'secret',
  name     : 'Bob Smith',
}, {
  id       : '2',
  username : 'joe',
  password : 'password',
  name     : 'Joe Davis',
}];

/**
 * Returns a user if it finds one, otherwise returns null if a user is not found.
 * @param   {String}   id - The unique id of the user to find
 * @returns {Promise} resolved user if found, otherwise resolves undefined
 */
User.find = id => Promise.resolve(users.find(user => user.id === id));

/**
 * Returns a user if it finds one, otherwise returns null if a user is not found.
 * @param   {String}   username - The unique user name to find
 * @param   {Function} done     - The user if found, otherwise returns undefined
 * @returns {Promise} resolved user if found, otherwise resolves undefined
 */
User.findByUsername = username =>
  Promise.resolve(users.find(user => user.username === username));




module.exports = User;