const mongoose = require("mongoose");
const { SHA256 } = require("crypto-js");
const { Schema } = mongoose;

const randomize = require("randomatic");

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      required: true
    },
    active: {
      type: Boolean,
      default: false //true for facebook and google, we do it through oauth2.js
    },
    suscription: {
      type: Boolean,
      default: true
    },
    id: Number, // just for old data. New values with _id
    pictureProvider: { type: String, default: 'arasaac' },
    locale: { type: String, default: "en" },
    password: String,
    verifyToken: String,
    created: { type: Date, default: Date.now },
    // to control which docs should be downloaded to the client
    updated: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now },
    verifyDate: { type: Date },
    url: {
      type: String,
      default: ""
    },
    company: {
      type: String,
      default: ""
    },
    role: { type: String, default: "user" },
    targetLanguages: [String],
    facebook: {
      id: String,
      picture: String,
      email: String,
      name: String
    },
    google: {
      id: String,
      picture: String,
      email: String,
      name: String
    },
    favorites: {
      type: Object,
      required: true,
      default: { defaultList: [] }
    },
    favoritesLimit: {
      type: Number,
      default: 10
    },
    searchLanguage: { type: String, default: 'en' },
    sex:  { type: Boolean, default: false },
    violence:  { type: Boolean, default: false },
    color:  { type: Boolean, default: true }
  },
  {
    strict: false
  } /* so we can insert later providers like facebook or google if needed, also for favorites... */
);

const validatePresenceOf = value => value && value.length;

/**
 * Validations
 */

// the below 5 validations only apply if you are signing up traditionally

UserSchema.path("name").validate(function (name) {
  return name.length;
}, "Name cannot be blank");

UserSchema.path("email").validate(function (email) {
  return email.length;
}, "Email cannot be blank");

UserSchema.path("email").validate(function (email) {
  const User = mongoose.model("User");

  // Check only when it is a new user or when email field is modified
  if (this.isNew || this.isModified("email")) {
    return User.find({ email }).exec(
      (err, users) => !err && users.length === 0
    );
  }
  return true;
}, "Email already exists");

/**
 * Methods
 */

UserSchema.methods = {
  authenticate(plainText) {
    // if user is not activate return false, otherwise check password
    return this.verifyToken ? false : `${SHA256(plainText)}` === this.password;
  },

  activate(verifyToken) {
    if (verifyToken === this.verifyToken) this.verifyToken = "";
    return "";
  }
};

UserSchema.virtual("isVerified").get(function () {
  return !this.verifyToken;
});

const User = mongoose.model("User", UserSchema, "users");

module.exports = User;
