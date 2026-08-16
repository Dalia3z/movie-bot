/**
 * Application logger built on top of Winston.
 *
 * Provides structured, timestamped console logging (and optional
 * file logging) so the bot can be monitored easily on a VPS via
 * PM2 logs or Docker logs.
 */

import * as path from 'path';
import * as fs from 'fs';
import * as winston from 'winston';
import { getConfig } from '../config';

const { combine, timestamp, printf, colorize, errors } = winston.format;

/** Custom log format: timestamp, level, and message. */
const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
  const base = `${ts} [${level}]: ${message}`;
  return stack ? `${base}\n${stack}` : base;
});

/** Build the transports array based on configuration. */
function buildTransports(): { level: string; transports: winston.transport[] } {

  // Use a safe default log level if config isn't available yet.
  let level = 'info';
  let toFile = true;
  try {
    const config = getConfig();
    level = config.logging.level;
    toFile = config.logging.toFile;
  } catch {
    // Config not ready (e.g., missing TMDB key at startup). Use defaults.
  }

  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), logFormat),
    }),
  ];

  if (toFile) {
    const logDir = path.resolve(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'bot.log'),
        format: combine(timestamp(), logFormat),
        maxsize: 10 * 1024 * 1024, // 10 MB
        maxFiles: 5,
        tailable: true,
      })
    );
  }

  return { level, transports };
}

/** Create the Winston logger instance. */
const { level, transports } = buildTransports();
export const logger = winston.createLogger({
  level,
  format: combine(errors({ stack: true }), timestamp(), logFormat),
  transports,
  exitOnError: false,
});


/** Convenience re-exports for common log levels. */
export const log = {
  error: (msg: string, meta?: unknown): void => {
    logger.error(msg, meta);
  },
  warn: (msg: string, meta?: unknown): void => {
    logger.warn(msg, meta);
  },
  info: (msg: string, meta?: unknown): void => {
    logger.info(msg, meta);
  },
  debug: (msg: string, meta?: unknown): void => {
    logger.debug(msg, meta);
  },
};
