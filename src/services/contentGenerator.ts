/**
 * Promotional content generator.
 *
 * Takes raw TMDB trending items and turns them into engaging,
 * ready-to-post promotional captions with clean Cinevo links,
 * hashtags, and image URLs.
 */

import { getConfig } from '../config';
import { buildCinevoUrl } from './cinevoLinker';
import { PromoPost, TrendingItem } from '../types';

/** A curated set of hashtags used to build per-post hashtag strings. */
const BASE_HASHTAGS = ['cinevo', 'movies', 'streaming', 'watchnow'];

/** A set of engaging caption templates for movies. */
const MOVIE_TEMPLATES = [
  (title: string, year: string, rating: number) =>
    `🔥 Trending now: ${title} (${year}) is taking the world by storm with a ${rating.toFixed(1)}/10 rating! Don't miss out — watch it today on Cinevo.`,
  (title: string, year: string, rating: number) =>
    `🎬 ${title} (${year}) — rated ${rating.toFixed(1)}/10 and climbing! Stream it in HD right now on Cinevo.`,
  (title: string, year: string) =>
    `🍿 Everyone is talking about ${title} (${year}). See what the hype is about — only on Cinevo.`,
  (title: string, year: string, rating: number) =>
    `⭐ ${title} (${year}) has a stellar ${rating.toFixed(1)}/10 on the charts. Add it to your watchlist on Cinevo today!`,
];

/** A set of engaging caption templates for TV shows. */
const TV_TEMPLATES = [
  (title: string, year: string, rating: number) =>
    `📺 Binge-worthy alert: ${title} (${year}) is trending with a ${rating.toFixed(1)}/10 score! Catch every episode on Cinevo.`,
  (title: string, year: string, rating: number) =>
    `🔥 ${title} (${year}) — the show everyone can't stop talking about. Rated ${rating.toFixed(1)}/10. Stream it on Cinevo now!`,
  (title: string, year: string) =>
    `🎉 New season energy: ${title} (${year}) is here and it's a must-watch. Binge it all on Cinevo.`,
  (title: string, year: string, rating: number) =>
    `⭐ ${title} (${year}) is dominating the charts at ${rating.toFixed(1)}/10. Don't get left behind — watch on Cinevo!`,
];

/** Build a hashtag string from a title and the base hashtags. */
function buildHashtags(title: string): string {
  const words = title
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 3)
    .map((w) => `#${w.charAt(0).toUpperCase() + w.slice(1)}`);

  return [...words, ...BASE_HASHTAGS].join(' ');
}

/** Extract the display title from a trending item. */
function getTitle(item: TrendingItem): string {
  return item.title || item.name || item.original_title || 'Untitled';
}

/** Extract the release year from a trending item. */
function getYear(item: TrendingItem): string {
  const date = item.release_date || item.first_air_date;
  if (!date) return 'N/A';
  return date.slice(0, 4);
}

/** Pick a caption template based on media type and item index. */
function pickTemplate(item: TrendingItem, index: number): (title: string, year: string, rating: number) => string {
  const templates = item.media_type === 'movie' ? MOVIE_TEMPLATES : TV_TEMPLATES;
  return templates[index % templates.length];
}

/**
 * Generate a promotional post for a single trending item.
 *
 * @param item - A raw TMDB trending item.
 * @param index - Index used to vary caption templates.
 * @returns A fully-formed PromoPost.
 */
export function generatePromoPost(item: TrendingItem, index: number): PromoPost {
  const config = getConfig();
  const title = getTitle(item);
  const year = getYear(item);
  const rating = item.vote_average ?? 0;
  const overview = item.overview?.trim() || 'No synopsis available.';
  const mediaType = item.media_type;

  const template = pickTemplate(item, index);
  const caption = template(title, year, rating);

  const posterUrl = item.poster_path
    ? `${config.tmdb.imageBaseUrl}/w500${item.poster_path}`
    : null;
  const backdropUrl = item.backdrop_path
    ? `${config.tmdb.imageBaseUrl}/w1280${item.backdrop_path}`
    : null;

  return {
    tmdbId: item.id,
    mediaType,
    title,
    overview,
    rating,
    year,
    posterUrl,
    backdropUrl,
    cinevoUrl: buildCinevoUrl(mediaType, item.id, title),
    caption,
    hashtags: buildHashtags(title),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate promotional posts for a list of trending items.
 *
 * @param items - Raw TMDB trending items.
 * @returns An array of PromoPost objects.
 */
export function generatePromoPosts(items: TrendingItem[]): PromoPost[] {
  return items.map((item, index) => generatePromoPost(item, index));
}
