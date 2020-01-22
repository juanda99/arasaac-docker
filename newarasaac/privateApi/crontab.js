const CronJob = require('cron').CronJob
const logger = require('./utils/logger')
const updateKeywordsByCrontab = require('./controllers/keywordsController')
  .updateKeywordsByCrontab
const { postTranslationStatusByCrontab } = require('./controllers/translationsController')
const languages = require('./utils/languages')

if (process.env.CRONTAB.toUpperCase() === 'YES') {
  logger.info('Configuring CRONTAB!')
  // update autocomplete keywords by crontab:
  const job = new CronJob('00 30 03 * * *', () => {
    for (const language of languages) {
      const result = updateKeywordsByCrontab(language)
      const msg = result
        ? `CRON OK updateKeywords for language ${language}`
        : `CRON FAILED updateKeywords for language ${language}`
      logger.info(msg)
    }
  })
  job.start()

  // update translation status, crowdin rate limit is 20 simultaneous requests
  // so we split our languages array and make two cronjobs
  // remove english because it doesn't need translations
  const half = Math.floor(languages.length / 2)
  const firstHalfLanguages = languages.slice(0, half)
  const secondHalfLanguages = languages.slice(half, languages.length)

  const jobFirstHalf = new CronJob('00 10 * * * *', () => {
    for (const language of firstHalfLanguages) {
      const result = postTranslationStatusByCrontab(language)
      const msg = result
        ? `CRON OK postTranslationStatusByCrontab for language ${language}`
        : `CRON FAILED postTranslationStatusByCrontab for language ${language}`
      logger.info(msg)
    }
  })
  jobFirstHalf.start()

  const jobSecondHalf = new CronJob('00 20 * * * *', () => {
    for (const language of secondHalfLanguages) {
      const result = postTranslationStatusByCrontab(language)
      const msg = result
        ? `CRON OK postTranslationStatusByCrontab for language ${language}`
        : `CRON FAILED postTranslationStatusByCrontab for language ${language}`
      logger.info(msg)
    }
  })
  jobSecondHalf.start()
  logger.info('Configured CRONTAB!')
} else {
  logger.info('NOT executing CRONTAB!')
}
