/**
 * Smoke test for the Cinevo Viral Bot.
 *
 * Verifies that the core logic (content generation, Cinevo link
 * building, and output writing) works correctly without needing a
 * real TMDB API key. Run with:
 *
 *   npx ts-node scripts/smoke-test.ts
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
import { generatePromoPosts } from '../src/services/contentGenerator';
import { buildCinevoUrl } from '../src/services/cinevoLinker';
import { writeCycleOutput } from '../src/services/outputWriter';
import { TrendingItem, CycleResult } from '../src/types';

// Load a minimal config for the smoke test.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
process.env.TMDB_API_KEY = process.env.TMDB_API_KEY || 'smoke-test-key';
process.env.CINEVO_BASE_URL = process.env.CINEVO_BASE_URL || 'https://streamflixx-seven.vercel.app';

process.env.CINEVO_MOVIE_PATH = process.env.CINEVO_MOVIE_PATH || '/movie/{id}';
process.env.CINEVO_TV_PATH = process.env.CINEVO_TV_PATH || '/tv/{id}';
process.env.OUTPUT_DIR = process.env.OUTPUT_DIR || './output';
process.env.OUTPUT_FORMAT = process.env.OUTPUT_FORMAT || 'both';

/** Sample trending items mimicking TMDB responses. */
const sampleItems: TrendingItem[] = [
  {
    id: 27205,
    media_type: 'movie',
    title: 'Inception',
    original_title: 'Inception',
    overview: 'A thief who steals corporate secrets through dream-sharing technology.',
    poster_path: '/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    backdrop_path: '/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
    vote_average: 8.8,
    vote_count: 35000,
    release_date: '2010-07-16',
    popularity: 120.5,
  },
  {
    id: 1399,
    media_type: 'tv',
    name: 'Game of Thrones',
    overview: 'Nine noble families fight for control over the lands of Westeros.',

    poster_path: '/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
    backdrop_path: '/suopoADq0k8YZr4dQXcU6pToj6s.jpg',
    vote_average: 8.4,
    vote_count: 22000,
    first_air_date: '2011-04-17',
    popularity: 95.2,
  },
];

/** Run the smoke test. */
function run(): void {
  console.log('=== Cinevo Viral Bot Smoke Test ===\n');

  // 1. Test Cinevo link building.
  const movieUrl = buildCinevoUrl('movie', 27205, 'Inception');
  const tvUrl = buildCinevoUrl('tv', 1399, 'Game of Thrones');
  console.log(`[1] Movie link: ${movieUrl}`);
  console.log(`[1] TV link:    ${tvUrl}`);
  if (!movieUrl.includes('27205')) {
    throw new Error('Movie link does not contain the TMDB id.');
  }
  if (!tvUrl.includes('1399')) {
    throw new Error('TV link does not contain the TMDB id.');
  }
  console.log('[1] PASS: Cinevo link building works.\n');

  // 2. Test content generation.
  const posts = generatePromoPosts(sampleItems);
  console.log(`[2] Generated ${posts.length} promo post(s).`);
  for (const post of posts) {
    console.log(`    - ${post.title} (${post.year}) | rating: ${post.rating}/10`);
    console.log(`      caption: ${post.caption}`);
    console.log(`      hashtags: ${post.hashtags}`);
    console.log(`      url: ${post.cinevoUrl}`);
  }
  if (posts.length !== 2) {
    throw new Error('Expected 2 promo posts.');
  }
  if (!posts[0].caption.includes('Cinevo')) {
    throw new Error('Caption does not mention Cinevo.');
  }
  console.log('[2] PASS: Content generation works.\n');

  // 3. Test output writing.
  const result: CycleResult = {
    timestamp: new Date().toISOString(),
    fetched: sampleItems.length,
    generated: posts.length,
    posts,
  };
  const written = writeCycleOutput(result);
  console.log(`[3] Wrote ${written.length} output file(s):`);
  for (const file of written) {
    console.log(`    - ${file}`);
  }
  if (written.length === 0) {
    throw new Error('No output files were written.');
  }
  console.log('[3] PASS: Output writing works.\n');

  console.log('=== All smoke tests passed! ===');
}

try {
  run();
} catch (error) {
  console.error(`\nSmoke test FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
