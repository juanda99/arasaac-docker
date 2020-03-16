module.exports = {
  apps: [
    {
      name: 'API',
      script: 'api.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false
    }
  ]
}
