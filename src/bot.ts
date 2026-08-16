/**
 * Bot orchestrator.
 *
 * Ties together the TMDB client, content generator, and output writer
 * into a single "cycle" that can be run on a schedule. This is the
 * main entry point for the automation logic.
 */

import { getConfig } from './config';

import { TmdbClient } from './services/tmdbClient';
import { generatePromoPosts } from './services/contentGenerator';
import { writeCycleOutput } from './services/outputWriter';
import { log } from './utils/logger';
import { CycleResult } from './types';



/**
 * The Cinevo Viral Bot.
 *
 * Usage:
 *   const bot = new CinevoBot();
 *   await bot.runCycle();
 */
export class CinevoBot {
  private readonly tmdb: TmdbClient;

  constructor() {
    this.tmdb = new TmdbClient();
  }

  /**
   * Run a single bot cycle:
   *   1. Fetch trending movies/TV from TMDB.
   *   2. Generate promotional posts with Cinevo links.
   *   3. Write the output to disk.
   *
   * @returns The cycle result, or null if the cycle failed.
   */
  public async runCycle(): Promise<CycleResult | null> {
    const config = getConfig();
    const startedAt = new Date();

    log.info('=== Starting bot cycle ===');
    log.info(
      `Fetching trending ${config.bot.mediaType} (limit: ${config.bot.trendingLimit}, language: ${config.tmdb.language})...`
    );

    try {
      // 1. Fetch trending data.
      const items = await this.tmdb.fetchTrending(config.bot.mediaType, config.bot.trendingLimit);
      log.info(`Fetched ${items.length} trending item(s) from TMDB.`);

      if (items.length === 0) {
        log.warn('No trending items returned. Skipping content generation.');
        return null;
      }

      // 2. Generate promotional content.
      const posts = generatePromoPosts(items);
      log.info(`Generated ${posts.length} promotional post(s).`);

      // 3. Write output to disk.
      const result: CycleResult = {
        timestamp: startedAt.toISOString(),
        fetched: items.length,
        generated: posts.length,
        posts,
      };

      const writtenFiles = writeCycleOutput(result);
      log.info(`Cycle complete. Wrote ${writtenFiles.length} output file(s).`);

      const elapsedMs = Date.now() - startedAt.getTime();
      log.info(`=== Cycle finished in ${elapsedMs}ms ===`);

      return result;
    } catch (error) {
      log.error(
        `Bot cycle failed: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }
}
