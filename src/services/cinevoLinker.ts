/**
 * Cinevo link builder.
 *
 * Constructs clean, SEO-friendly URLs that point back to the Cinevo
 * platform for a given movie or TV show. The URL path templates are
 * configurable via environment variables (CINEVO_MOVIE_PATH and
 * CINEVO_TV_PATH), with `{id}` as a placeholder for the TMDB id.
 */

import { getConfig } from '../config';

/** Supported media types for link building. */
export type LinkMediaType = 'movie' | 'tv';

/**
 * Build a clean Cinevo URL for a given media item.
 *
 * @param mediaType - 'movie' or 'tv'.
 * @param id - The TMDB id of the item.
 * @param title - Optional title used for slug-style URLs (e.g. /search?q=).
 * @returns A fully-qualified URL pointing to Cinevo.
 */
export function buildCinevoUrl(mediaType: LinkMediaType, id: number, title?: string): string {
  const config = getConfig();
  const baseUrl = config.cinevo.baseUrl.replace(/\/+$/, ''); // strip trailing slashes

  const template = mediaType === 'movie' ? config.cinevo.moviePath : config.cinevo.tvPath;

  // Replace the {id} placeholder with the actual TMDB id.
  let path = template.replace(/\{id\}/g, String(id));

  // If the template contains a {title} placeholder, URL-encode the title.
  if (title && path.includes('{title}')) {
    path = path.replace(/\{title\}/g, encodeURIComponent(title));
  }

  // Ensure the path starts with a single slash.
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  return `${baseUrl}${path}`;
}
