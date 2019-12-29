const CronJob = require('cron').CronJob
const logger = require('./utils/logger')
const updateKeywordsByCrontab = require('./controllers/wordsController')
  .updateKeywordsByCrontab
const languages = require('./utils/languages')
const job = new CronJob('00 30 03 * * *', () => {
  for (const language of languages) {
    const result = updateKeywordsByCrontab(language)
    const msg = result
      ? `CRON OK updateKeywords for language ${language}`
      : `CRON FAILED updateKeywords for language ${language}`
    logger.info(msg)
  }
})
logger.info(`CRONTAB configured 00 30 03 * * *`)
job.start()
// '00 30 11 * * 1-5'
