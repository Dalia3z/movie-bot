/**
 * TMDB API client with automatic retry / exponential backoff.
 *
 * Wraps the TMDB REST API (v3) using axios. Provides a typed method
 * to fetch trending movies and/or TV shows, with robust error handling
 * and retry logic so the bot can run reliably 24/7 on a VPS.
 */

import axios, { AxiosError, AxiosInstance } from 'axios';
import { getConfig } from '../config';
import { log } from '../utils/logger';
import { TrendingItem, TrendingResponse } from '../types';

/** A custom error type for TMDB API failures. */
export class TmdbApiError extends Error {
  /** HTTP status code, if available. */
  public readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'TmdbApiError';
    this.statusCode = statusCode;
  }
}

/** Sleep helper for retry backoff. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * TMDB client class.
 *
 * Usage:
 *   const client = new TmdbClient();
 *   const items = await client.fetchTrending('both', 10);
 */
export class TmdbClient {
  private readonly http: AxiosInstance;
  private readonly apiKey: string;
  private readonly language: string;
  private readonly region: string;
  private readonly maxRetries: number;
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;

  constructor() {
    const config = getConfig();
    this.apiKey = config.tmdb.apiKey;
    this.language = config.tmdb.language;
    this.region = config.tmdb.region;
    this.maxRetries = config.retry.maxRetries;
    this.baseDelayMs = config.retry.baseDelayMs;
    this.maxDelayMs = config.retry.maxDelayMs;

    this.http = axios.create({
      baseURL: config.tmdb.baseUrl,
      timeout: config.retry.httpTimeoutMs,
      headers: {
        Accept: 'application/json',
      },
    });
  }

  /**
   * Fetch trending movies and/or TV shows from TMDB.
   *
   * @param mediaType - 'movie', 'tv', or 'both'.
   * @param limit - Maximum number of items to return (1-20).
   * @returns A list of trending items.
   */
  public async fetchTrending(mediaType: 'movie' | 'tv' | 'both', limit: number): Promise<TrendingItem[]> {
    const results: TrendingItem[] = [];

    if (mediaType === 'movie' || mediaType === 'both') {
      const movies = await this.fetchTrendingByType('movie', limit);
      results.push(...movies);
    }

    if (mediaType === 'tv' || mediaType === 'both') {
      const shows = await this.fetchTrendingByType('tv', limit);
      results.push(...shows);
    }

    // Sort by popularity descending so the most popular items come first.
    results.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));

    // Trim to the requested limit.
    return results.slice(0, limit);
  }

  /**
   * Fetch trending items for a single media type with retry logic.
   *
   * @param mediaType - 'movie' or 'tv'.
   * @param limit - Maximum number of items to return.
   * @returns A list of trending items.
   */
  private async fetchTrendingByType(mediaType: 'movie' | 'tv', limit: number): Promise<TrendingItem[]> {
    const params: Record<string, string | number> = {
      api_key: this.apiKey,
      language: this.language,
    };
    if (this.region) {
      params.region = this.region;
    }

    const url = `/trending/${mediaType}/week`;

    const data = await this.getWithRetry<TrendingResponse>(url, params);
    return data.results.slice(0, limit);
  }

  /**
   * Perform a GET request with exponential backoff retry.
   *
   * @param url - API endpoint path.
   * @param params - Query parameters.
   * @returns The parsed response data.
   */
  private async getWithRetry<T>(url: string, params: Record<string, string | number>): Promise<T> {
    let attempt = 0;

    while (true) {
      try {
        const response = await this.http.get<T>(url, { params });
        return response.data;
      } catch (error) {
        attempt += 1;
        const statusCode = this.extractStatusCode(error);

        // Do not retry on 4xx client errors (except 429 rate limiting).
        if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
          throw new TmdbApiError(`TMDB request failed with status ${statusCode}`, statusCode);
        }

        if (attempt > this.maxRetries) {
          throw new TmdbApiError(
            `TMDB request failed after ${attempt} attempts: ${this.extractMessage(error)}`,
            statusCode
          );
        }

        // Exponential backoff with jitter to avoid thundering herd.
        const delay = Math.min(
          this.baseDelayMs * 2 ** (attempt - 1) + Math.random() * 500,
          this.maxDelayMs
        );
        log.warn(`TMDB request failed (attempt ${attempt}/${this.maxRetries}). Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  /** Extract an HTTP status code from an unknown error. */
  private extractStatusCode(error: unknown): number | undefined {
    if (axios.isAxiosError(error)) {
      return error.response?.status;
    }
    return undefined;
  }

  /** Extract a human-readable message from an unknown error. */
  private extractMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      return axiosError.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}
