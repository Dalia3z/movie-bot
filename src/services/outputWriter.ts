/**
 * Output writer.
 *
 * Persists generated promotional content to disk in JSON and/or
 * Markdown format, so the content can be reviewed, posted manually,
 * or consumed by other tooling.
 */

import * as fs from 'fs';
import * as path from 'path';
import { getConfig } from '../config';
import { log } from '../utils/logger';
import { CycleResult, PromoPost } from '../types';

/** Build a timestamped filename prefix, e.g. "2026-08-16T21-45-00". */
function timestampPrefix(date: Date): string {
  return date.toISOString().replace(/[:.]/g, '-');
}

/** Ensure the output directory exists. */
function ensureOutputDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/** Serialize a single promo post to a Markdown block. */
function postToMarkdown(post: PromoPost): string {
  const lines = [
    `## ${post.title} (${post.year})`,
    '',
    `- **Type:** ${post.mediaType === 'movie' ? 'Movie' : 'TV Show'}`,
    `- **Rating:** ${post.rating.toFixed(1)}/10`,
    `- **TMDB ID:** ${post.tmdbId}`,
    '',
    `**Overview:** ${post.overview}`,
    '',
    `**Caption:**`,
    `> ${post.caption}`,
    '',
    `**Hashtags:** ${post.hashtags}`,
    '',
    `**Cinevo Link:** ${post.cinevoUrl}`,
    '',
  ];

  if (post.posterUrl) {
    lines.push(`**Poster:** ${post.posterUrl}`, '');
  }
  if (post.backdropUrl) {
    lines.push(`**Backdrop:** ${post.backdropUrl}`, '');
  }

  lines.push('---', '');
  return lines.join('\n');
}

/**
 * Write a cycle result to disk in the configured format(s).
 *
 * @param result - The cycle result to persist.
 * @returns The paths of the files written.
 */
export function writeCycleOutput(result: CycleResult): string[] {
  const config = getConfig();
  const outputDir = path.resolve(process.cwd(), config.output.dir);
  ensureOutputDir(outputDir);

  const prefix = timestampPrefix(new Date(result.timestamp));
  const written: string[] = [];

  if (config.output.format === 'json' || config.output.format === 'both') {
    const jsonPath = path.join(outputDir, `${prefix}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');
    written.push(jsonPath);
    log.info(`Wrote JSON output: ${jsonPath}`);
  }

  if (config.output.format === 'md' || config.output.format === 'both') {
    const mdPath = path.join(outputDir, `${prefix}.md`);
    const header = [
      `# Cinevo Viral Bot — Generated Content`,
      '',
      `Generated at: ${result.timestamp}`,
      `Items fetched: ${result.fetched}`,
      `Posts generated: ${result.generated}`,
      '',
      '---',
      '',
    ].join('\n');

    const body = result.posts.map(postToMarkdown).join('\n');
    fs.writeFileSync(mdPath, header + body, 'utf-8');
    written.push(mdPath);
    log.info(`Wrote Markdown output: ${mdPath}`);
  }

  return written;
}
