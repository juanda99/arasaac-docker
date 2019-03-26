const mongoose = require('mongoose')
const crypto = require('crypto')

const { Schema } = mongoose

const oAuthTypes = ['facebook', 'google']

const userSchema = new Schema(
  {
    name: String,
    email: String,
    provider: String,
    locale: { type: String, default: 'en' },
    password: String,
    authToken: String,
    lastlogin: { type: Date, default: Date.now },
    url: String,
    company: String,
    role: { type: String, default: 'User' },
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
    return next(new Error('Invalid password'))
  }
  return next()
})

/**
 * Methods
 */

userSchema.methods = {
  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   */

  authenticate (plainText) {
    return this.encryptPassword(plainText) === this.hashed_password
  },

  /**
   * Make salt
   *
   * @return {String}
   * @api public
   */

  makeSalt () {
    return `${Math.round(new Date().valueOf() * Math.random())}`
  },

  /**
   * Encrypt password
   *
   * @param {String} password
   * @return {String}
   * @api public
   */

  encryptPassword (password) {
    if (!password) return ''
    try {
      return crypto
        .createHmac('sha1', this.salt)
        .update(password)
        .digest('hex')
    } catch (err) {
      return ''
    }
  },

  /**
   * Validation is not required if using OAuth
   */

  skipValidation () {
    return ~oAuthTypes.indexOf(this.provider)
  }
}

/**
 * Statics
 */

userSchema.statics = {
  /**
   * Load
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */

  load (options, cb) {
    options.select = options.select || 'name username'
    return this.findOne(options.criteria)
      .select(options.select)
      .exec(cb)
  }
}

const User = mongoose.model('User', userSchema, 'users')

module.exports = User
