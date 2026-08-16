/**
 * Cinevo Viral Bot — Entry Point.
 *
 * Boots the application, validates configuration, and starts the
 * scheduled bot loop. Designed to run 24/7 on a VPS via PM2 or Docker.
 */

import { getConfig } from './config';
import { CinevoBot } from './bot';
import { Scheduler } from './services/scheduler';
import { log } from './utils/logger';



/** Print a friendly startup banner. */
function printBanner(): void {
  log.info('==============================================');
  log.info('  Cinevo Viral Bot');
  log.info('  Automating trending content for Cinevo');
  log.info('==============================================');
}

/** Handle graceful shutdown on SIGINT / SIGTERM. */
function setupSignalHandlers(scheduler: Scheduler): void {
  const shutdown = (signal: string): void => {
    log.info(`Received ${signal}. Shutting down gracefully...`);
    scheduler.stop();
    // Give in-flight work a moment to finish, then exit.
    setTimeout(() => process.exit(0), 500);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

/** Main bootstrap function. */
function main(): void {
  printBanner();

  // Validate configuration (throws if TMDB_API_KEY is missing).
  const config = getConfig();
  log.info(
    `Configuration loaded: interval=${config.bot.intervalMinutes}m, ` +
      `mediaType=${config.bot.mediaType}, limit=${config.bot.trendingLimit}`
  );

  // Create the bot and scheduler.
  const bot = new CinevoBot();
  const scheduler = new Scheduler(async () => {
    await bot.runCycle();
  });

  // Wire up graceful shutdown.
  setupSignalHandlers(scheduler);

  // Start the scheduled loop.
  scheduler.start();
}

// Run the bot, catching startup errors (e.g., missing config) cleanly.
try {
  main();
} catch (error) {
  log.error(`Failed to start bot: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}


