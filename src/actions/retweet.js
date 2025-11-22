// src/actions/retweet.js
import { config } from '../../config/config.js';
import { log } from '../../utils/logger.js';
import { sleep, randomDelay } from '../../utils/helpers.js';

/**
 * Retweet action handler
 */
export class RetweetAction {
  constructor(page) {
    this.page = page;
    this.count = 0;
  }

  /**
   * Retweet a tweet
   */
  async execute(tweetUrl) {
    if (!config.autoRetweet) {
      log.debug('Auto-retweet is disabled, skipping');
      return { success: false, skipped: true };
    }

    if (this.count >= config.maxRetweetsPerRun) {
      log.warn(`Max retweets per run reached (${config.maxRetweetsPerRun}), skipping`);
      return { success: false, limitReached: true };
    }

    try {
      log.retweet(tweetUrl);
      
      // Navigate to tweet
      await this.page.goto(tweetUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      
      await sleep(randomDelay(config.delayMin, config.delayMax));
      
      // Find retweet button
      const retweetButton = await this.page.$('[data-testid="retweet"]');
      
      if (!retweetButton) {
        // Check if already retweeted
        const unretweetButton = await this.page.$('[data-testid="unretweet"]');
        if (unretweetButton) {
          log.info('Tweet already retweeted');
          return { success: true, alreadyRetweeted: true };
        }
        
        throw new Error('Retweet button not found');
      }
      
      // Click retweet button (opens menu)
      await retweetButton.click();
      await sleep(randomDelay(500, 1000));
      
      // Click "Retweet" option in the menu
      const retweetConfirm = await this.page.$('[data-testid="retweetConfirm"]');
      if (!retweetConfirm) {
        throw new Error('Retweet confirm button not found');
      }
      
      await retweetConfirm.click();
      await sleep(randomDelay(1000, 2000));
      
      // Verify retweet was successful
      await this.page.reload({ waitUntil: 'networkidle2' });
      const unretweetButton = await this.page.$('[data-testid="unretweet"]');
      if (!unretweetButton) {
        throw new Error('Retweet action may have failed (unretweet button not found)');
      }
      
      this.count++;
      log.success('Tweet retweeted successfully');
      
      return { 
        success: true, 
        count: this.count,
        url: tweetUrl 
      };
      
    } catch (error) {
      log.error(`Failed to retweet: ${error.message}`);
      return { 
        success: false, 
        error: error.message,
        url: tweetUrl 
      };
    }
  }

  /**
   * Retweet multiple tweets
   */
  async executeMultiple(tweetUrls) {
    const results = [];
    
    for (const url of tweetUrls) {
      const result = await this.execute(url);
      results.push(result);
      
      // Stop if limit reached
      if (result.limitReached) break;
      
      // Stop on error if configured
      if (!result.success && config.stopOnError) {
        log.warn('Stopping due to error (STOP_ON_ERROR=true)');
        break;
      }
      
      // Delay between retweets
      if (tweetUrls.indexOf(url) < tweetUrls.length - 1) {
        const delay = randomDelay(config.delayMin * 2, config.delayMax * 2);
        log.debug(`Waiting ${delay}ms before next retweet...`);
        await sleep(delay);
      }
    }
    
    return results;
  }

  /**
   * Reset counter
   */
  resetCount() {
    this.count = 0;
  }

  /**
   * Get current count
   */
  getCount() {
    return this.count;
  }
}