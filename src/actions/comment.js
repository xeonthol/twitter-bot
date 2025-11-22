// src/actions/comment.js
import { config } from '../../config/config.js';
import { log } from '../../utils/logger.js';
import { sleep, randomDelay, randomChoice, sanitizeForLog } from '../../utils/helpers.js';

/**
 * Comment action handler
 */
export class CommentAction {
  constructor(page) {
    this.page = page;
    this.count = 0;
  }

  /**
   * Comment on a tweet
   */
  async execute(tweetUrl, customComment = null) {
    if (!config.autoComment) {
      log.debug('Auto-comment is disabled, skipping');
      return { success: false, skipped: true };
    }

    if (this.count >= config.maxCommentsPerRun) {
      log.warn(`Max comments per run reached (${config.maxCommentsPerRun}), skipping`);
      return { success: false, limitReached: true };
    }

    try {
      // Get comment text
      const commentText = customComment || randomChoice(config.comments);
      if (!commentText) {
        throw new Error('No comment text available');
      }
      
      log.comment(tweetUrl, sanitizeForLog(commentText, 30));
      
      // Navigate to tweet
      await this.page.goto(tweetUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      
      await sleep(randomDelay(config.delayMin, config.delayMax));
      
      // Find and click reply button
      const replyButton = await this.page.$('[data-testid="reply"]');
      if (!replyButton) {
        throw new Error('Reply button not found');
      }
      
      await replyButton.click();
      await sleep(randomDelay(1000, 2000));
      
      // Wait for text area
      const textArea = await this.page.$('[data-testid="tweetTextarea_0"]');
      if (!textArea) {
        throw new Error('Comment text area not found');
      }
      
      // Type comment with human-like delay
      await textArea.click();
      await sleep(randomDelay(500, 1000));
      await this.page.type('[data-testid="tweetTextarea_0"]', commentText, { 
        delay: randomDelay(50, 150) 
      });
      
      await sleep(randomDelay(1000, 2000));
      
      // Find and click tweet button
      const tweetButton = await this.page.$('[data-testid="tweetButton"]');
      if (!tweetButton) {
        throw new Error('Tweet button not found');
      }
      
      // Check if button is enabled
      const isDisabled = await this.page.evaluate(
        el => el.hasAttribute('disabled'),
        tweetButton
      );
      
      if (isDisabled) {
        throw new Error('Tweet button is disabled (comment may be too short or duplicate)');
      }
      
      await tweetButton.click();
      await sleep(randomDelay(2000, 3000));
      
      // Verify comment was posted (look for success toast or return to timeline)
      const currentUrl = this.page.url();
      const commentPosted = currentUrl.includes('status') || currentUrl.includes('home');
      
      if (!commentPosted) {
        throw new Error('Comment may not have been posted');
      }
      
      this.count++;
      log.success('Comment posted successfully');
      
      return { 
        success: true, 
        count: this.count,
        url: tweetUrl,
        comment: commentText 
      };
      
    } catch (error) {
      log.error(`Failed to comment: ${error.message}`);
      return { 
        success: false, 
        error: error.message,
        url: tweetUrl 
      };
    }
  }

  /**
   * Comment on multiple tweets
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
      
      // Longer delay between comments (Twitter is sensitive to spam)
      if (tweetUrls.indexOf(url) < tweetUrls.length - 1) {
        const delay = randomDelay(config.delayMin * 3, config.delayMax * 3);
        log.debug(`Waiting ${delay}ms before next comment...`);
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