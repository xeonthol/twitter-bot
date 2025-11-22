// src/actions/like.js
import { config } from '../../config/config.js';
import { log } from '../../utils/logger.js';
import { sleep, randomDelay } from '../../utils/helpers.js';

/**
 * Like action handler
 */
export class LikeAction {
  constructor(page) {
    this.page = page;
    this.count = 0;
  }

  /**
   * Like a tweet
   */
  async execute(tweetUrl) {
    if (!config.autoLike) {
      log.debug('Auto-like is disabled, skipping');
      return { success: false, skipped: true };
    }

    if (this.count >= config.maxLikesPerRun) {
      log.warn(`Max likes per run reached (${config.maxLikesPerRun}), skipping`);
      return { success: false, limitReached: true };
    }

    try {
      log.like(tweetUrl);
      
      // Navigate to tweet
      await this.page.goto(tweetUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      
      await sleep(randomDelay(config.delayMin, config.delayMax));
      
      // Find like button
      const likeButton = await this.page.$('[data-testid="like"]');
      
      if (!likeButton) {
        // Check if already liked
        const unlikeButton = await this.page.$('[data-testid="unlike"]');
        if (unlikeButton) {
          log.info('Tweet already liked');
          return { success: true, alreadyLiked: true };
        }
        
        throw new Error('Like button not found');
      }
      
      // Click like button
      await likeButton.click();
      await sleep(randomDelay(500, 1000));
      
      // Verify like was successful
      const unlikeButton = await this.page.$('[data-testid="unlike"]');
      if (!unlikeButton) {
        throw new Error('Like action may have failed (unlike button not found)');
      }
      
      this.count++;
      log.success('Tweet liked successfully');
      
      return { 
        success: true, 
        count: this.count,
        url: tweetUrl 
      };
      
    } catch (error) {
      log.error(`Failed to like tweet: ${error.message}`);
      return { 
        success: false, 
        error: error.message,
        url: tweetUrl 
      };
    }
  }

  /**
   * Like multiple tweets
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
      
      // Delay between likes
      if (tweetUrls.indexOf(url) < tweetUrls.length - 1) {
        const delay = randomDelay(config.delayMin * 2, config.delayMax * 2);
        log.debug(`Waiting ${delay}ms before next like...`);
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