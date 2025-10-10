// PM2 Ecosystem Configuration for vk.retry.sk
// Copy to server: /var/www/vk-retry/ecosystem.config.js
// Start: pm2 start ecosystem.config.js
// Reload: pm2 reload ecosystem.config.js --update-env

module.exports = {
  apps: [{
    name: 'vk-retry',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/vk-retry',

    // Fork mode (stable)
    instances: 1,
    exec_mode: 'fork',

    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: 'postgresql://vkadmin:vkpass123@localhost:5433/vk_system',
      NEXTAUTH_URL: 'https://vk.retry.sk',
      NEXTAUTH_SECRET: '3+fjx8QOVdg5xjhczQ1YhdNC+XTekyzmpBCqAeDaXKE=',
      AUTH_TRUST_HOST: 'true'
    },

    // Auto-restart configuration
    autorestart: true,
    watch: false,  // Don't watch files (we use deployment script)
    max_memory_restart: '1G',  // Restart if memory exceeds 1GB

    // Logs
    error_file: '/var/log/pm2/vk-retry-error.log',
    out_file: '/var/log/pm2/vk-retry-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Graceful shutdown (for zero-downtime deploys)
    kill_timeout: 5000,  // Wait 5s for graceful shutdown

    // Min uptime before considering stable
    min_uptime: '10s',

    // Max restarts within 1 minute before stopping
    max_restarts: 10,
    restart_delay: 4000,

    // Cron restart (optional - restart every night at 3am)
    // cron_restart: '0 3 * * *',

    // Environment-specific settings
    env_production: {
      NODE_ENV: 'production'
    }
  }]
}
