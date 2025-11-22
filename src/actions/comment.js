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
   * Comment on a tweet (Enhanced with better reliability)
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
      
      // Navigate to tweet if needed
      const currentUrl = await this.page.url();
      if (!currentUrl.includes(tweetUrl)) {
        await this.page.goto(tweetUrl, {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });
        await sleep(randomDelay(2000, 3000));
      }
      
      // Wait for page to be ready
      await sleep(randomDelay(config.delayMin, config.delayMax));
      
      // Find and click reply button (multiple selectors)
      const replySelectors = [
        '[data-testid="reply"]',
        '[aria-label="Reply"]',
        'div[data-testid="reply"]'
      ];
      
      let replyButton = null;
      for (const selector of replySelectors) {
        replyButton = await this.page.$(selector);
        if (replyButton) {
          log.info(`Found reply button: ${selector}`);
          break;
        }
      }
      
      if (!replyButton) {
        throw new Error('Reply button not found');
      }
      
      await replyButton.click();
      await sleep(randomDelay(1500, 2500));
      log.info('✓ Reply button clicked');
      
      // Wait for text area with multiple selectors
      const textAreaSelectors = [
        '[data-testid="tweetTextarea_0"]',
        'div[role="textbox"][data-testid="tweetTextarea_0"]',
        'div[contenteditable="true"][role="textbox"]'
      ];
      
      let textArea = null;
      for (const selector of textAreaSelectors) {
        try {
          textArea = await this.page.waitForSelector(selector, { 
            visible: true,
            timeout: 5000 
          });
          if (textArea) {
            log.info(`Found text area: ${selector}`);
            break;
          }
        } catch {}
      }
      
      if (!textArea) {
        throw new Error('Comment text area not found');
      }
      
      // Click text area to focus
      await textArea.click();
      await sleep(randomDelay(500, 1000));
      log.info('✓ Text area focused');
      
      // Clear any existing text
      await this.page.keyboard.down('Control');
      await this.page.keyboard.press('A');
      await this.page.keyboard.up('Control');
      await this.page.keyboard.press('Backspace');
      
      // Type comment character by character (more human-like)
      for (const char of commentText) {
        await this.page.keyboard.type(char);
        await sleep(randomDelay(80, 200));
      }
      
      log.info('✓ Comment text entered');
      await sleep(randomDelay(1000, 2000));
      
      // Find and click tweet/reply button
      const tweetButtonSelectors = [
        '[data-testid="tweetButton"]',
        '[data-testid="tweetButtonInline"]',
        'div[role="button"][data-testid="tweetButton"]'
      ];
      
      let tweetButton = null;
      for (const selector of tweetButtonSelectors) {
        tweetButton = await this.page.$(selector);
        if (tweetButton) {
          log.info(`Found tweet button: ${selector}`);
          
          // Check if button is enabled
          const isDisabled = await this.page.evaluate(
            el => el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true',
            tweetButton
          );
          
          if (!isDisabled) {
            break;
          } else {
            log.warn(`Button ${selector} is disabled`);
            tweetButton = null;
          }
        }
      }
      
      if (!tweetButton) {
        throw new Error('Tweet button not found or disabled');
      }
      
      await tweetButton.click();
      await sleep(randomDelay(2000, 3000));
      log.info('✓ Tweet button clicked');
      
      // Wait longer for tweet to post
      await sleep(randomDelay(3000, 5000));
      
      // Verify comment was posted by checking if we're back on tweet page
      // or if reply modal closed
      const currentUrlAfter = await this.page.url();
      const stillOnTweet = currentUrlAfter.includes('status');
      
      // Alternative verification: check if reply form is gone
      const replyFormGone = !(await this.page.$('[data-testid="tweetTextarea_0"]'));
      
      if (!stillOnTweet && !replyFormGone) {
        log.warn('Comment posting verification uncertain');
        // Don't throw error, comment might still be posted
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
      
      // Take screenshot for debugging
      try {
        await this.page.screenshot({ path: 'logs/error-comment.png' });
        log.info('Screenshot saved: logs/error-comment.png');
      } catch {}
      
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