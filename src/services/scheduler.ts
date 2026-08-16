/**
 * Scheduler.
 *
 * Runs the bot's main cycle on a configurable interval (default: every
 * 60 minutes). Uses a simple setInterval-based loop with a guard flag
 * to prevent overlapping runs if a cycle takes longer than the interval.
 */

import { getConfig } from '../config';
import { log } from '../utils/logger';

/** A function that performs one bot cycle. */
export type CycleFn = () => Promise<void>;

/**
 * Scheduler class that runs a cycle function on a fixed interval.
 *
 * Usage:
 *   const scheduler = new Scheduler(runCycle);
 *   scheduler.start();
 */
export class Scheduler {
  private readonly cycleFn: CycleFn;
  private readonly intervalMs: number;
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private stopped = false;

  constructor(cycleFn: CycleFn) {
    this.cycleFn = cycleFn;
    this.intervalMs = getConfig().bot.intervalMinutes * 60 * 1000;
  }

  /**
   * Start the scheduler. Runs the first cycle immediately, then
   * schedules subsequent cycles on the configured interval.
   */
  public start(): void {
    if (this.timer) {
      log.warn('Scheduler already started.');
      return;
    }

    log.info(`Scheduler started. Running every ${getConfig().bot.intervalMinutes} minute(s).`);

    // Run the first cycle immediately.
    void this.runCycle();

    // Schedule subsequent cycles.
    this.timer = setInterval(() => {
      void this.runCycle();
    }, this.intervalMs);

    // Prevent the timer from keeping the process alive after stop().
    if (this.timer.unref) {
      this.timer.unref();
    }
  }

  /**
   * Stop the scheduler. Any in-flight cycle will complete, but no
   * new cycles will be scheduled.
   */
  public stop(): void {
    this.stopped = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      log.info('Scheduler stopped.');
    }
  }

  /** Run a single cycle, guarding against overlap. */
  private async runCycle(): Promise<void> {
    if (this.running) {
      log.warn('Previous cycle still running. Skipping this tick.');
      return;
    }

    this.running = true;
    try {
      await this.cycleFn();
    } catch (error) {
      log.error(`Cycle failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.running = false;
      if (this.stopped) {
        log.info('Scheduler stopped after completing in-flight cycle.');
      }
    }
  }
}
