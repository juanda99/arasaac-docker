const CronJob = require('cron').CronJob
const logger = require('./utils/logger')
const updateKeywordsByCrontab = require('./controllers/keywordsController')
  .updateKeywordsByCrontab
const { postTranslationStatusByCrontab } = require('./controllers/translationsController')
const {createSitemap} = require('./controllers/sitemapController.js')
const languages = require('./utils/languages')

if (process.env.CRONTAB.toUpperCase() === 'YES') {
  logger.info('Configuring CRONTAB!')
  // update autocomplete keywords by crontab:
  const job = new CronJob('00 30 * * * *', () => {
    for (const language of languages) {
      const result = updateKeywordsByCrontab(language)
      if  (result) logger.info(`CRON OK updateKeywords for language ${language}`)
      else logger.error(`CRON FAILED updateKeywords for language ${language}`)
    }
  })
  job.start()

  const sitemapJob = new CronJob('00 00 3 * * *', () => createSitemap())
  sitemapJob.start()


  // update translation status, crowdin rate limit is 20 simultaneous requests
  // so we split our languages array and make two cronjobs
  // remove english because it doesn't need translations
  const half = Math.floor(languages.length / 2)
  const firstHalfLanguages = languages.slice(0, half)
  const secondHalfLanguages = languages.slice(half, languages.length)

  const jobFirstHalf = new CronJob('00 10 * * * *', () => {
    for (const language of firstHalfLanguages) {
      const result = postTranslationStatusByCrontab(language)
      if  (result) logger.info(`CRON OK postTranslationStatusByCrontab for language ${language}`)
      else logger.error(`CRON FAILED postTranslationStatusByCrontab for language ${language}`)
    }
  })
  jobFirstHalf.start()

  const jobSecondHalf = new CronJob('00 20 * * * *', () => {
    for (const language of secondHalfLanguages) {
      const result = postTranslationStatusByCrontab(language)
      if  (result) logger.info(`CRON OK postTranslationStatusByCrontab for language ${language}`)
      else logger.error(`CRON FAILED postTranslationStatusByCrontab for language ${language}`)
    }
  })
  jobSecondHalf.start()

  // const jobSiteMap = new CronJob('00 00 2 * * *', () => {
  //   for (const language of secondHalfLanguages) {
  //     const result = createSitemap()
  //     if  (result) logger.info('CRON OK generating sitemap')
  //     else logger.error('CRON FAILED generating sitemap')
  //   }
  // })
  // jobSiteMap.start()

  logger.info('Configured CRONTAB!')
} else {
  logger.info('NOT executing CRONTAB!')
}
