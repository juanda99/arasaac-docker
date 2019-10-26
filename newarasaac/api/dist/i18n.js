"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.translationMessages = exports.appLocales = void 0;

var _en = _interopRequireDefault(require("./translations/en.json"));

var _es = _interopRequireDefault(require("./translations/es.json"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * i18n.js
 *
 * This will setup the i18n language files and locale data for your app.
 *
 */
var areIntlLocalesSupported = require('intl-locales-supported');

var DEFAULT_LOCALE = 'en';
var appLocales = ['en', 'de']; // import intl if needed, 
// see https://formatjs.io/guides/runtime-environments/#server

exports.appLocales = appLocales;

if (global.Intl) {
  // Determine if the built-in `Intl` has the locale data we need.
  if (!areIntlLocalesSupported(appLocales)) {
    // `Intl` exists, but it doesn't have the data we need, so load the
    // polyfill and replace the constructors with need with the polyfill's.
    var IntlPolyfill = require('intl');

    Intl.NumberFormat = IntlPolyfill.NumberFormat;
    Intl.DateTimeFormat = IntlPolyfill.DateTimeFormat;
  }
} else {
  // No `Intl`, so use and load the polyfill.
  global.Intl = require('intl');
} // import all our language files


var formatTranslationMessages = function formatTranslationMessages(locale, messages) {
  var defaultFormattedMessages = locale !== DEFAULT_LOCALE ? formatTranslationMessages(DEFAULT_LOCALE, _en.default) : {};
  return Object.keys(messages).reduce(function (formattedMessages, key) {
    var formattedMessage = !messages[key] && locale !== DEFAULT_LOCALE ? defaultFormattedMessages[key] : messages[key];
    return Object.assign(formattedMessages, _defineProperty({}, key, formattedMessage));
  }, {});
};

var translationMessages = {
  en: formatTranslationMessages('en', _en.default),
  de: formatTranslationMessages('de', _es.default)
};
exports.translationMessages = translationMessages;