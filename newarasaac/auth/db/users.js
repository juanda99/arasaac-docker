var mongoose = require('mongoose')
var bcrypt = require('bcrypt')
const { logAndThrow } = require('../utils')

var UserSchema = new mongoose.Schema({
  email: {
    type: String,
    trim: true
  },
  id: {
    // just for old data. New values with _id
    type: Number
  },
  role: {
    type: String,
    trim: true,
    default: 'user'
  },
  /* name is needed for decision screen: Dear <name>.... */
  name: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  facebook: {
    id: String,
    token: String,
    name: String,
    email: String
  },
  google: {
    id: String,
    token: String,
    name: String,
    email: String
  }
},
{ strict: false } /* so we can insert later providers like facebook or google if needed */
)

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
