"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/* eslint no-template-curly-in-string: 0 */
var User = require('../models/User');

var mongoose = require('mongoose');

var nev = require('email-verification')(mongoose);

var bcrypt = require('bcryptjs');

module.exports = function (locale) {
  var myHasher = function myHasher(password, tempUserData, insertTempUser, callback) {
    bcrypt.genSalt(8, function (err, salt) {
      bcrypt.hash(password, salt, function (err, hash) {
        return insertTempUser(hash, tempUserData, callback);
      });
    });
  };
  /* email messages, we may change them depending on locale */


  var subject = 'Please confirm account';
  var html = 'Click the following link to confirm your account:</p><p>${URL}</p>';
  var text = 'Please confirm your account by clicking the following link: ${URL}';

  if (locale === 'es') {
    subject = 'Por favor, confirma tu cuenta';
    html = 'Pulsa el enlace siguiente para confirmar tu cuenta:</p><p>${URL}</p>';
    text = 'Por favor, confirma tu cuenta pulsando el enlace siguiente: ${URL}';
  }

  nev.configure({
    verificationURL: process.env.EMAIL_VERIFICATION_URL,
    URLLength: 16,
    // mongo-stuff
    persistentUserModel: User,
    emailFieldName: 'email',
    passwordFieldName: 'password',
    URLFieldName: 'GENERATED_VERIFYING_URL',
    expirationTime: 86400,
    //1 day
    // emailing options
    transportOptions: {
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    },
    verifyMailOptions: {
      from: process.env.EMAIL_FROM,
      subject: subject,
      html: html,
      text: text
    },
    shouldSendConfirmation: true,
    confirmMailOptions: {
      from: process.env.EMAIL_FROM,
      subject: 'Successfully verified!',
      html: '<p>Your account has been successfully verified.</p>',
      text: 'Your account has been successfully verified.'
    },
    hashingFunction: myHasher
  }, function (err, options) {
    if (err) {
      console.log(err);
      return;
    }

    console.log('configured: ' + (_typeof(options) === 'object'));
  });
  nev.generateTempUserModel(User, function (err, tempUserModel) {
    if (err) {
      console.log(err);
      return;
    }

    console.log('generated temp user model: ' + (typeof tempUserModel === 'function'));
  });
  return nev;
};