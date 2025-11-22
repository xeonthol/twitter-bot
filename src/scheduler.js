// src/scheduler.js
import cron from 'node-cron';
import { config } from '../config/config.js';
import { log } from '../utils/logger.js';
import { TwitterBot } from './twitter.js';

/**
 * Scheduler for automated bot runs
 */
export class BotScheduler {
  constructor() {
    this.bot = null;
    this.task = null;
    this.isRunning = false;
    this.runCount = 0;
  }

  /**
   * Execute bot once
   */
  async executeOnce() {
    if (this.isRunning) {
      log.warn('Bot is already running, skipping this execution');
      return;
    }

    this.isRunning = true;
    this.runCount++;

    try {
      log.info(`\n${'='.repeat(50)}`);
      log.info(`🔄 Scheduled Run #${this.runCount}`);
      log.info(`⏰ ${new Date().toISOString()}`);
      log.info('='.repeat(50));

      // Create new bot instance
      this.bot = new TwitterBot();
      await this.bot.initialize();
      await this.bot.run();
      await this.bot.close();

      log.success(`✅ Run #${this.runCount} completed successfully\n`);

    } catch (error) {
      log.error(`❌ Run #${this.runCount} failed:`, error.message);
    } finally {
      this.isRunning = false;
      this.bot = null;
    }
  }

  /**
   * Start scheduled execution
   */
  start() {
    if (!config.enableScheduler) {
      log.warn('Scheduler is disabled in config');
      return false;
    }

    if (!cron.validate(config.scheduleCron)) {
      log.error(`Invalid cron expression: ${config.scheduleCron}`);
      return false;
    }

    log.info('📅 Starting bot scheduler...');
    log.info(`⏰ Schedule: ${config.scheduleCron}`);
    log.info(`   (Next run will be calculated based on cron expression)\n`);

    // Run immediately on start
    log.info('▶️  Running bot immediately...');
    this.executeOnce();

    // Schedule recurring runs
    this.task = cron.schedule(config.scheduleCron, () => {
      log.info('\n⏰ Scheduled execution triggered');
      this.executeOnce();
    });

    log.success('✅ Scheduler started successfully');
    log.info('Press Ctrl+C to stop\n');

    return true;
  }

  /**
   * Stop scheduler
   */
  stop() {
    if (this.task) {
      this.task.stop();
      log.info('⏹️  Scheduler stopped');
    }

    if (this.bot) {
      this.bot.close();
    }
  }

  /**
   * Get next scheduled run time
   */
  getNextRun() {
    if (!this.task) return null;

    try {
      // This is approximate, actual implementation depends on node-cron internals
      return 'Check cron expression for schedule';
    } catch {
      return null;
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalRuns: this.runCount,
      isRunning: this.isRunning,
      schedule: config.scheduleCron,
    };
  }
}

/**
 * Helper to explain cron expressions
 */
export function explainCronExpression(expression) {
  const patterns = {
    '0 */6 * * *': 'Every 6 hours',
    '0 */12 * * *': 'Every 12 hours',
    '0 0 * * *': 'Every day at midnight',
    '0 9 * * *': 'Every day at 9 AM',
    '0 9,15,21 * * *': 'Every day at 9 AM, 3 PM, and 9 PM',
    '*/30 * * * *': 'Every 30 minutes',
    '0 */2 * * *': 'Every 2 hours',
    '0 0 */2 * *': 'Every 2 days at midnight',
  };

  return patterns[expression] || 'Custom schedule';
}