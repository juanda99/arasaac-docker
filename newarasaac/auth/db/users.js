var mongoose = require('mongoose')
var bcrypt = require('bcrypt')
const { logAndThrow } = require('../utils')

var UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  id: {
    type: Number,
    unique: true,
    required: true
  },
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  }
})

/* Do not declare methods using ES6 arrow functions (=>). Arrow functions explicitly prevent binding this, 
so your method will not have access to the document */
UserSchema.methods = {
  validate: function (password) {
    if (bcrypt.compareSync(password, this.password)) return this
    logAndThrow(`Wrong password for user ${this.username}`)
  }
}

var User = mongoose.model('User', UserSchema);
module.exports = User;
