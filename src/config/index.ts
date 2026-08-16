/**
 * Central configuration loader.
 *
 * Reads environment variables (via dotenv) and exposes a typed,
 * validated configuration object to the rest of the application.
 * All values have sensible defaults so the bot can run with minimal
 * setup, but production deployments should override them via `.env`.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from the project root `.env` file.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/** Supported media types for trending fetches. */
export type MediaType = 'movie' | 'tv' | 'both';

/** Supported output file formats. */
export type OutputFormat = 'json' | 'md' | 'both';

/** Supported log levels. */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/** Fully-resolved application configuration. */
export interface AppConfig {
  /** TMDB API settings. */
  tmdb: {
    apiKey: string;
    baseUrl: string;
    imageBaseUrl: string;
    language: string;
    region: string;
  };
  /** Cinevo platform link settings. */
  cinevo: {
    baseUrl: string;
    moviePath: string;
    tvPath: string;
  };
  /** Bot behaviour settings. */
  bot: {
    intervalMinutes: number;
    trendingLimit: number;
    mediaType: MediaType;
  };
  /** Output settings. */
  output: {
    dir: string;
    format: OutputFormat;
  };
  /** Logging settings. */
  logging: {
    level: LogLevel;
    toFile: boolean;
  };
  /** Retry / resilience settings. */
  retry: {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
    httpTimeoutMs: number;
  };
}

/** Parse a boolean from an environment string, with a fallback. */
function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true' || value === '1';
}

/** Parse a positive integer from an environment string, with a fallback. */
function parseIntSafe(value: string | undefined, fallback: number, min = 1): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (Number.isNaN(parsed) || parsed < min) return fallback;
  return parsed;
}

/** Validate that a media type string is one of the supported values. */
function parseMediaType(value: string | undefined): MediaType {
  if (value === 'movie' || value === 'tv' || value === 'both') return value;
  return 'both';
}

/** Validate that an output format string is one of the supported values. */
function parseOutputFormat(value: string | undefined): OutputFormat {
  if (value === 'json' || value === 'md' || value === 'both') return value;
  return 'both';
}

/** Validate that a log level string is one of the supported values. */
function parseLogLevel(value: string | undefined): LogLevel {
  if (value === 'error' || value === 'warn' || value === 'info' || value === 'debug') {
    return value;
  }
  return 'info';
}

/**
 * Build and return the fully-resolved configuration object.
 * Throws if a required value (TMDB API key) is missing.
 */
export function loadConfig(): AppConfig {
  const apiKey = process.env.TMDB_API_KEY?.trim() ?? '';

  if (!apiKey) {
    throw new Error(
      'TMDB_API_KEY is not set. Please copy .env.example to .env and add your TMDB API key ' +
        '(https://www.themoviedb.org/settings/api).'
    );
  }

  return {
    tmdb: {
      apiKey,
      baseUrl: process.env.TMDB_API_BASE_URL?.trim() || 'https://api.themoviedb.org/3',
      imageBaseUrl: process.env.TMDB_IMAGE_BASE_URL?.trim() || 'https://image.tmdb.org/t/p',
      language: process.env.TMDB_LANGUAGE?.trim() || 'en',
      region: process.env.TMDB_REGION?.trim() || '',
    },
    cinevo: {
      baseUrl: process.env.CINEVO_BASE_URL?.trim() || 'https://streamflixx-seven.vercel.app',
      moviePath: process.env.CINEVO_MOVIE_PATH?.trim() || '/movie/{id}',
      tvPath: process.env.CINEVO_TV_PATH?.trim() || '/tv/{id}',
    },

    bot: {
      intervalMinutes: parseIntSafe(process.env.BOT_INTERVAL_MINUTES, 60, 1),
      trendingLimit: parseIntSafe(process.env.TRENDING_LIMIT, 10, 1),
      mediaType: parseMediaType(process.env.TRENDING_MEDIA_TYPE),
    },
    output: {
      dir: process.env.OUTPUT_DIR?.trim() || './output',
      format: parseOutputFormat(process.env.OUTPUT_FORMAT),
    },
    logging: {
      level: parseLogLevel(process.env.LOG_LEVEL),
      toFile: parseBool(process.env.LOG_TO_FILE, true),
    },
    retry: {
      maxRetries: parseIntSafe(process.env.MAX_RETRIES, 3, 0),
      baseDelayMs: parseIntSafe(process.env.RETRY_BASE_DELAY_MS, 1000, 0),
      maxDelayMs: parseIntSafe(process.env.RETRY_MAX_DELAY_MS, 30000, 0),
      httpTimeoutMs: parseIntSafe(process.env.HTTP_TIMEOUT_MS, 15000, 1000),
    },
  };
}

/** Singleton config instance, lazily loaded. */
let cachedConfig: AppConfig | null = null;

/** Get the application configuration (cached after first load). */
export function getConfig(): AppConfig {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }
  return cachedConfig;
}
