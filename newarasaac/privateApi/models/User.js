const mongoose = require('mongoose')
const { SHA256 } = require('crypto-js')
const { Schema } = mongoose
const CustomError = require('../utils/CustomError')

const oAuthTypes = ['facebook', 'google']
const randtoken = require('rand-token')

const userSchema = new Schema(
  {
    name: String,
    email: String,
    provider: String,
    locale: { type: String, default: 'en' },
    password: String,
    verifyToken: String,
    created: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now },
    url: String,
    company: String,
    role: { type: String, default: 'user' },
    targetLanguages: [String],
    facebook: {
      id: String,
      token: String,
      email: String,
      name: String
    },
    google: {
      id: String,
      token: String,
      email: String,
      name: String
    },
    favorites: []
  },
  { strict: false }
)

const validatePresenceOf = value => value && value.length

/**
 * Validations
 */

// the below 5 validations only apply if you are signing up traditionally

userSchema.path('name').validate(function (name) {
  if (this.skipValidation()) return true
  return name.length
}, 'Name cannot be blank')

userSchema.path('email').validate(function (email) {
  if (this.skipValidation()) return true
  return email.length
}, 'Email cannot be blank')

userSchema.path('email').validate(function (email) {
  const User = mongoose.model('User')
  if (this.skipValidation()) return true

  // Check only when it is a new user or when email field is modified
  if (this.isNew || this.isModified('email')) {
    return User.find({ email }).exec((err, users) => !err && users.length === 0)
  }
  return true
}, 'Email already exists')

userSchema.path('password').validate(function (password) {
  if (this.skipValidation()) return true
  return password.length
}, 'Password cannot be blank')

/**
 * Pre-save hook
 */

userSchema.pre('save', function (next) {
  if (!this.isNew) return next()

  if (!validatePresenceOf(this.password) && !this.skipValidation()) {
    return next(new CustomError('Invalid password', 400))
  }

  // override password with the hashed one:
  this.password = `${SHA256(this.password)}`
  // generate randomToken for user activation
  this.verifyToken = randtoken.generate(32)
  return next()
})

/**
 * Methods
 */

userSchema.methods = {
  authenticate (plainText) {
    return `${SHA256(plainText)}` === this.password
  },

  /**
   * Validation is not required if using OAuth
   */

  skipValidation () {
    return ~oAuthTypes.indexOf(this.provider)
  },

  activate (verifyToken) {
    if (verifyToken === this.verifyToken) this.verifyToken = ''
    return ''
  }
}

userSchema.virtual('isVerified').get(function () {
  return !this.verifyToken
})

const User = mongoose.model('User', userSchema, 'users')

module.exports = User
