/**
 * PM2 ecosystem configuration for the Cinevo Viral Bot.
 *
 * Enables running the bot as a managed, auto-restarting process on a
 * VPS with PM2. Logs are captured by PM2 and rotated automatically.
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 logs cinevo-viral-bot
 *   pm2 restart cinevo-viral-bot
 *   pm2 stop cinevo-viral-bot
 *
 * To persist across reboots:
 *   pm2 save
 *   pm2 startup
 */

module.exports = {
  apps: [
    {
      name: 'cinevo-viral-bot',
      script: './dist/index.js',
      // Run in cluster mode for resilience (single instance is fine here).
      instances: 1,
      exec_mode: 'fork',
      // Auto-restart if the process crashes or exits unexpectedly.
      autorestart: true,
      // Wait 3s before restarting after a crash.
      restart_delay: 3000,
      // Maximum memory before PM2 restarts the process.
      max_memory_restart: '256M',
      // Environment variables (overridden by .env at runtime via dotenv).
      env: {
        NODE_ENV: 'production',
      },
      // Log file locations (managed by PM2).
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      merge_logs: true,
      time: true,
      // Graceful shutdown: give the process time to finish in-flight work.
      kill_timeout: 5000,
      // Do not run more than one instance to avoid duplicate cycles.
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
