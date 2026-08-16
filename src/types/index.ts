/**
 * Shared type definitions for the Cinevo Viral Bot.
 *
 * These types model the TMDB API responses we consume and the
 * promotional content we generate, keeping the codebase type-safe.
 */

/** A single trending item returned by the TMDB trending endpoint. */
export interface TrendingItem {
  /** TMDB unique identifier. */
  id: number;
  /** Media type: "movie" or "tv". */
  media_type: 'movie' | 'tv';
  /** Original title/name. */
  original_title?: string;
  /** Localized title/name. */
  title?: string;
  /** Localized name (for TV shows). */
  name?: string;
  /** Short overview / synopsis. */
  overview?: string;
  /** Poster image path (relative to TMDB image base URL). */
  poster_path?: string | null;
  /** Backdrop image path (relative to TMDB image base URL). */
  backdrop_path?: string | null;
  /** Average vote score (0-10). */
  vote_average?: number;
  /** Number of votes. */
  vote_count?: number;
  /** Release date (movies) or first air date (TV). */
  release_date?: string;
  /** First air date (TV shows). */
  first_air_date?: string;
  /** Original language code. */
  original_language?: string;
  /** Genre ids. */
  genre_ids?: number[];
  /** Popularity score. */
  popularity?: number;
}

/** Raw response shape from the TMDB trending endpoint. */
export interface TrendingResponse {
  page: number;
  results: TrendingItem[];
  total_pages: number;
  total_results: number;
}

/** A single genre mapping from TMDB. */
export interface Genre {
  id: number;
  name: string;
}

/** A generated promotional post for a single trending item. */
export interface PromoPost {
  /** TMDB id of the item. */
  tmdbId: number;
  /** Media type. */
  mediaType: 'movie' | 'tv';
  /** Display title. */
  title: string;
  /** Short synopsis. */
  overview: string;
  /** Vote average (0-10). */
  rating: number;
  /** Release / first air year. */
  year: string;
  /** Poster image URL (absolute). */
  posterUrl: string | null;
  /** Backdrop image URL (absolute). */
  backdropUrl: string | null;
  /** Clean link pointing back to Cinevo. */
  cinevoUrl: string;
  /** Ready-to-post promotional caption. */
  caption: string;
  /** Comma-separated hashtags. */
  hashtags: string;
  /** ISO timestamp when the post was generated. */
  generatedAt: string;
}

/** A full bot cycle result, used for logging and output. */
export interface CycleResult {
  /** ISO timestamp of the cycle. */
  timestamp: string;
  /** Number of items fetched. */
  fetched: number;
  /** Number of promo posts generated. */
  generated: number;
  /** The generated posts. */
  posts: PromoPost[];
}
