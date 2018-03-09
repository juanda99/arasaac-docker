/**
 * i18n.js
 *
 * This will setup the i18n language files and locale data for your app.
 *
 */

var areIntlLocalesSupported = require('intl-locales-supported')

const DEFAULT_LOCALE = 'en'
export const appLocales = [
  'en',
  'de'
]

// import intl if needed, 
// see https://formatjs.io/guides/runtime-environments/#server

if (global.Intl) {
  // Determine if the built-in `Intl` has the locale data we need.
  if (!areIntlLocalesSupported(appLocales)) {
    // `Intl` exists, but it doesn't have the data we need, so load the
    // polyfill and replace the constructors with need with the polyfill's.
    var IntlPolyfill = require('intl')
    Intl.NumberFormat   = IntlPolyfill.NumberFormat
    Intl.DateTimeFormat = IntlPolyfill.DateTimeFormat
  }
} else {
  // No `Intl`, so use and load the polyfill.
  global.Intl = require('intl');
}

// import all our language files
import enTranslationMessages from './translations/en.json'
import esTranslationMessages from './translations/es.json'

const formatTranslationMessages = (locale, messages) => {
  const defaultFormattedMessages = locale !== DEFAULT_LOCALE
    ? formatTranslationMessages(DEFAULT_LOCALE, enTranslationMessages)
    : {}
  return Object.keys(messages).reduce((formattedMessages, key) => {
    const formattedMessage = !messages[key] && locale !== DEFAULT_LOCALE
      ? defaultFormattedMessages[key]
      : messages[key]
    return Object.assign(formattedMessages, { [key]: formattedMessage })
  }, {})
}

export const translationMessages = {
  en: formatTranslationMessages('en', enTranslationMessages),
  de: formatTranslationMessages('de', esTranslationMessages),
}