/**
 * Telegram integration service.
 *
 * Sends promotional posts to a Telegram channel via the Telegram Bot API
 * (`/sendMessage`). Reads `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHANNEL_ID`
 * from the environment. All failures are logged and swallowed so that a
 * Telegram error never crashes or interrupts the bot's main flow.
 */

import axios, { AxiosInstance } from 'axios';
import { log } from '../utils/logger';
import { PromoPost } from '../types';

/** Telegram Bot API base URL. */
const TELEGRAM_API_BASE = 'https://api.telegram.org';

/** Maximum message length allowed by Telegram (4096 chars). */
const MAX_MESSAGE_LENGTH = 4096;

/** A custom error type for Telegram API failures. */
export class TelegramApiError extends Error {
  /** HTTP status code, if available. */
  public readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'TelegramApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Telegram client class.
 *
 * Usage:
 *   const telegram = new TelegramClient();
 *   await telegram.sendPromoPosts(posts);
 */
export class TelegramClient {
  private readonly http: AxiosInstance;
  private readonly botToken: string;
  private readonly channelId: string;
  private readonly enabled: boolean;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? '';
    this.channelId = process.env.TELEGRAM_CHANNEL_ID?.trim() ?? '';

    // The service is "enabled" only if both credentials are present.
    this.enabled = Boolean(this.botToken && this.channelId);

    this.http = axios.create({
      baseURL: `${TELEGRAM_API_BASE}/bot${this.botToken}`,
      timeout: 15000,
      headers: {
        Accept: 'application/json',
      },
    });
  }

  /** Whether Telegram integration is configured and active. */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Send a batch of promotional posts to the configured Telegram channel.
   *
   * Each post is sent as its own message. If Telegram is not configured,
   * this is a no-op. Errors are logged and swallowed so the bot continues.
   *
   * @param posts - The promotional posts to send.
   * @returns The number of messages successfully sent.
   */
  public async sendPromoPosts(posts: PromoPost[]): Promise<number> {
    if (!this.enabled) {
      log.warn(
        'Telegram integration is not configured (missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID). Skipping.'
      );
      return 0;
    }

    if (posts.length === 0) {
      log.info('No promo posts to send to Telegram.');
      return 0;
    }

    log.info(`Sending ${posts.length} promo post(s) to Telegram channel ${this.channelId}...`);

    let sent = 0;
    for (const post of posts) {
      try {
        const text = this.formatPost(post);
        await this.sendMessage(text);
        sent += 1;
        log.info(`Sent Telegram message for "${post.title}" (${post.tmdbId}).`);
      } catch (error) {
        log.error(
          `Failed to send Telegram message for "${post.title}" (${post.tmdbId}): ` +
            `${error instanceof Error ? error.message : String(error)}`
        );
        // Continue with the next post; do not abort the batch.
      }
    }

    log.info(`Telegram batch complete. Sent ${sent}/${posts.length} message(s).`);
    return sent;
  }

  /**
   * Send a single text message to the configured channel.
   *
   * @param text - The message text (max 4096 chars).
   * @throws TelegramApiError if the request fails.
   */
  public async sendMessage(text: string): Promise<void> {
    if (!this.enabled) {
      throw new TelegramApiError('Telegram integration is not configured.');
    }

    // Telegram rejects messages longer than 4096 characters.
    const safeText = text.length > MAX_MESSAGE_LENGTH ? text.slice(0, MAX_MESSAGE_LENGTH) : text;

    try {
      await this.http.post('/sendMessage', {
        chat_id: this.channelId,
        text: safeText,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      });
    } catch (error) {
      const statusCode = this.extractStatusCode(error);
      throw new TelegramApiError(
        `Telegram sendMessage failed: ${this.extractMessage(error)}`,
        statusCode
      );
    }
  }

  /**
   * Format a single promo post into a Telegram-friendly HTML message.
   *
   * @param post - The promotional post to format.
   * @returns The formatted message text.
   */
  private formatPost(post: PromoPost): string {
    const typeLabel = post.mediaType === 'movie' ? '🎬 Movie' : '📺 TV Show';
    const lines: string[] = [];

    lines.push(`<b>${this.escapeHtml(post.title)}</b> (${this.escapeHtml(post.year)})`);
    lines.push(`<i>${typeLabel} • ⭐ ${post.rating.toFixed(1)}/10</i>`);
    lines.push('');

    if (post.overview) {
      const overview = this.truncate(this.escapeHtml(post.overview), 300);
      lines.push(overview);
      lines.push('');
    }

    lines.push(`<b>${this.escapeHtml(post.caption)}</b>`);
    lines.push('');

    if (post.hashtags) {
      lines.push(this.escapeHtml(post.hashtags));
      lines.push('');
    }

    lines.push(`🔗 <a href="${post.cinevoUrl}">Watch on Cinevo</a>`);

    return lines.join('\n');
  }

  /** Escape HTML special characters for safe Telegram HTML parsing. */
  private escapeHtml(value: string): string {
    const amp = '&' + 'amp;';
    const lt = '&' + 'lt;';
    const gt = '&' + 'gt;';
    const quot = '&' + 'quot;';
    return value
      .replace(/&/g, amp)
      .replace(/</g, lt)
      .replace(/>/g, gt)
      .replace(/"/g, quot);
  }


  /** Truncate a string to a maximum length, appending an ellipsis. */
  private truncate(value: string, maxLength: number): string {
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength - 1)}…`;
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
      return error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}
