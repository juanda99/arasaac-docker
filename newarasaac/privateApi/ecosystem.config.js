module.exports = {
  apps: [
    {
      name: 'API-PRIVATE',
      script: 'privateapi.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false
    }
  ]
}
