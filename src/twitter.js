// src/twitter.js
import puppeteer from 'puppeteer';
import { config } from '../config/config.js';
import { log, logStats } from '../utils/logger.js';
import { sleep, randomDelay } from '../utils/helpers.js';
import { TwitterAuth } from './auth.js';
import { LikeAction } from './actions/like.js';
import { RetweetAction } from './actions/retweet.js';
import { CommentAction } from './actions/comment.js';
import { FollowAction } from './actions/follow.js';

/**
 * Main Twitter Bot class
 */
export class TwitterBot {
  constructor() {
    this.browser = null;
    this.page = null;
    this.auth = null;
    this.actions = {
      like: null,
      retweet: null,
      comment: null,
      follow: null,
    };
    this.stats = {
      likes: 0,
      retweets: 0,
      comments: 0,
      follows: 0,
      errors: 0,
    };
  }

  /**
   * Initialize bot and login
   */
  async initialize() {
    try {
      log.info('🚀 Initializing Twitter Bot...');
      
      // Launch browser with anti-detection
      this.browser = await puppeteer.launch({
        headless: config.headless,
        defaultViewport: null,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-infobars',
          '--window-size=1920,1080',
          '--start-maximized',
          '--disable-notifications',
          '--disable-popup-blocking'
        ],
        ignoreDefaultArgs: ['--enable-automation'],
      });
      
      // Create page ONCE
      this.page = await this.browser.newPage();
      
      // Set viewport
      await this.page.setViewport({ width: 1366, height: 768 });
      
      // Set user agent
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );
      
      // Hide automation detection
      await this.page.evaluateOnNewDocument(() => {
        // Webdriver property
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
        
        // Chrome property
        window.navigator.chrome = {
          runtime: {},
        };
        
        // Permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );
        
        // Plugins
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
        
        // Languages
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });
      });
      
      log.info('Browser launched successfully');
      
      // Initialize auth
      this.auth = new TwitterAuth(this.page);
      await this.auth.login();
      
      // Initialize actions
      this.actions.like = new LikeAction(this.page);
      this.actions.retweet = new RetweetAction(this.page);
      this.actions.comment = new CommentAction(this.page);
      this.actions.follow = new FollowAction(this.page);
      
      log.success('Bot initialized successfully!');
      
    } catch (error) {
      log.error('Bot initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Process a single tweet (Optimized - faster execution)
   */
  async processTweet(tweetUrl) {
    try {
      log.info(`\n📍 Processing tweet: ${tweetUrl}`);
      
      // Navigate to tweet ONCE
      await this.page.goto(tweetUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      
      await sleep(randomDelay(2000, 3000)); // Wait for page load
      
      // Execute actions in sequence (but on same page - faster!)
      
      // Like
      if (config.autoLike) {
        const likeResult = await this.actions.like.execute(tweetUrl);
        if (likeResult.success && !likeResult.alreadyLiked) {
          this.stats.likes++;
        }
        if (!likeResult.success && !likeResult.skipped) {
          this.stats.errors++;
        }
        await sleep(randomDelay(1000, 2000)); // Shorter delay between actions
      }
      
      // Retweet
      if (config.autoRetweet) {
        const retweetResult = await this.actions.retweet.execute(tweetUrl);
        if (retweetResult.success && !retweetResult.alreadyRetweeted) {
          this.stats.retweets++;
        }
        if (!retweetResult.success && !retweetResult.skipped) {
          this.stats.errors++;
        }
        await sleep(randomDelay(1000, 2000));
      }
      
      // Comment (needs more time)
      if (config.autoComment) {
        const commentResult = await this.actions.comment.execute(tweetUrl);
        if (commentResult.success) {
          this.stats.comments++;
        }
        if (!commentResult.success && !commentResult.skipped) {
          this.stats.errors++;
        }
        await sleep(randomDelay(2000, 3000));
      }
      
    } catch (error) {
      log.error(`Error processing tweet: ${error.message}`);
      this.stats.errors++;
    }
  }

  /**
   * Follow a user
   */
  async followUser(username) {
    try {
      const result = await this.actions.follow.execute(username);
      
      if (result.success && !result.alreadyFollowing) {
        this.stats.follows++;
      }
      if (!result.success && !result.skipped) {
        this.stats.errors++;
      }
      
    } catch (error) {
      log.error(`Error following user: ${error.message}`);
      this.stats.errors++;
    }
  }

  /**
   * Run bot (main execution)
   */
  async run() {
    try {
      log.info('\n🤖 Starting Twitter Bot execution...\n');
      
      // Process tweets
      if (config.targetTweets.length > 0) {
        log.info(`📝 Processing ${config.targetTweets.length} tweet(s)...`);
        
        for (const tweetUrl of config.targetTweets) {
          await this.processTweet(tweetUrl);
          
          // Delay between tweets
          if (config.targetTweets.indexOf(tweetUrl) < config.targetTweets.length - 1) {
            const delay = randomDelay(5000, 10000);
            log.debug(`Waiting ${delay}ms before next tweet...`);
            await sleep(delay);
          }
        }
      }
      
      // Follow users
      if (config.targetUsers.length > 0) {
        log.info(`\n👥 Following ${config.targetUsers.length} user(s)...`);
        
        for (const username of config.targetUsers) {
          await this.followUser(username);
          
          // Delay between follows
          if (config.targetUsers.indexOf(username) < config.targetUsers.length - 1) {
            const delay = randomDelay(3000, 6000);
            log.debug(`Waiting ${delay}ms before next follow...`);
            await sleep(delay);
          }
        }
      }
      
      // Print statistics
      this.printStats();
      
      log.success('\n✅ Bot execution completed!');
      
    } catch (error) {
      log.error('Bot execution failed:', error.message);
      throw error;
    }
  }

  /**
   * Print statistics
   */
  printStats() {
    logStats(this.stats);
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      likes: 0,
      retweets: 0,
      comments: 0,
      follows: 0,
      errors: 0,
    };
    
    // Reset action counters
    if (this.actions.like) this.actions.like.resetCount();
    if (this.actions.retweet) this.actions.retweet.resetCount();
    if (this.actions.comment) this.actions.comment.resetCount();
    if (this.actions.follow) this.actions.follow.resetCount();
  }

  /**
   * Close browser and cleanup
   */
  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        log.info('👋 Browser closed');
      }
    } catch (error) {
      log.error('Error closing browser:', error.message);
    }
  }
}