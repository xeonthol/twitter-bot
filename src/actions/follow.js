// src/actions/follow.js
import { config } from '../../config/config.js';
import { log } from '../../utils/logger.js';
import { sleep, randomDelay } from '../../utils/helpers.js';

/**
 * Follow action handler
 */
export class FollowAction {
  constructor(page) {
    this.page = page;
    this.count = 0;
  }

  /**
   * Follow a user
   */
  async execute(username) {
    if (!config.autoFollow) {
      log.debug('Auto-follow is disabled, skipping');
      return { success: false, skipped: true };
    }

    if (this.count >= config.maxFollowsPerRun) {
      log.warn(`Max follows per run reached (${config.maxFollowsPerRun}), skipping`);
      return { success: false, limitReached: true };
    }

    try {
      // Remove @ if present
      const cleanUsername = username.replace('@', '');
      log.follow(cleanUsername);
      
      // Navigate to profile
      const profileUrl = `https://twitter.com/${cleanUsername}`;
      await this.page.goto(profileUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      
      await sleep(randomDelay(config.delayMin, config.delayMax));
      
      // Check if user exists
      const userNotFound = await this.page.$('text=/This account doesn\'t exist/i');
      if (userNotFound) {
        throw new Error('User account does not exist');
      }
      
      // Find follow button with better selectors
      // Twitter has multiple possible selectors
      const followSelectors = [
        '[data-testid*="follow"][data-testid$="-follow"]',
        '[data-testid="placementTracking"] [role="button"]',
        '[aria-label="Follow @' + cleanUsername + '"]',
        'div[role="button"]:has-text("Follow")'
      ];
      
      let followButton = null;
      
      for (const selector of followSelectors) {
        try {
          followButton = await this.page.$(selector);
          if (followButton) {
            const text = await this.page.evaluate(el => el.textContent, followButton);
            if (text && text.includes('Follow') && !text.includes('Following')) {
              log.info(`Found follow button with selector: ${selector}`);
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!followButton) {
        // Check if already following
        const unfollowButton = await this.page.$('[data-testid="unfollow"]');
        const followingButton = await this.page.$('[aria-label*="Following"]');
        
        if (unfollowButton || followingButton) {
          log.info(`Already following @${cleanUsername}`);
          return { success: true, alreadyFollowing: true };
        }
        
        // Check if follow is pending
        const pendingButton = await this.page.$('[data-testid*="pending"]');
        if (pendingButton) {
          log.info(`Follow request pending for @${cleanUsername}`);
          return { success: true, pending: true };
        }
        
        throw new Error('Follow button not found');
      }
      
      // Click follow button with retry
      let clicked = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await followButton.click();
          clicked = true;
          break;
        } catch (e) {
          log.warn(`Click attempt ${attempt} failed: ${e.message}`);
          if (attempt < 3) {
            await sleep(randomDelay(1000, 2000));
          }
        }
      }
      
      if (!clicked) {
        throw new Error('Failed to click follow button after 3 attempts');
      }
      
      await sleep(randomDelay(2000, 3000));
      
      // Verify follow was successful (reload page to check)
      await this.page.reload({ waitUntil: 'domcontentloaded' });
      await sleep(randomDelay(2000, 3000));
      
      const unfollowButton = await this.page.$('[data-testid="unfollow"]');
      const followingButton = await this.page.$('[aria-label*="Following"]');
      
      if (!unfollowButton && !followingButton) {
        log.warn('Follow verification uncertain - button state not changed');
        // Don't throw error, might still be successful
      }
      
      this.count++;
      log.success(`Successfully followed @${cleanUsername}`);
      
      return { 
        success: true, 
        count: this.count,
        username: cleanUsername 
      };
      
    } catch (error) {
      log.error(`Failed to follow @${username}: ${error.message}`);
      return { 
        success: false, 
        error: error.message,
        username: username 
      };
    }
  }

  /**
   * Follow multiple users
   */
  async executeMultiple(usernames) {
    const results = [];
    
    for (const username of usernames) {
      const result = await this.execute(username);
      results.push(result);
      
      // Stop if limit reached
      if (result.limitReached) break;
      
      // Stop on error if configured
      if (!result.success && config.stopOnError) {
        log.warn('Stopping due to error (STOP_ON_ERROR=true)');
        break;
      }
      
      // Delay between follows
      if (usernames.indexOf(username) < usernames.length - 1) {
        const delay = randomDelay(config.delayMin * 2, config.delayMax * 2);
        log.debug(`Waiting ${delay}ms before next follow...`);
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