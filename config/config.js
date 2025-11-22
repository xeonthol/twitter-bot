// config/config.js
import 'dotenv/config';

/**
 * Configuration loader and validator
 */
export const config = {
  // Login
  useCookies: process.env.USE_COOKIES === 'true',
  cookies: process.env.TWITTER_COOKIES || '',
  username: process.env.TWITTER_USERNAME || '',
  password: process.env.TWITTER_PASSWORD || '',
  email: process.env.TWITTER_EMAIL || '', // NEW: Email for verification

  // Actions
  autoLike: process.env.AUTO_LIKE !== 'false',
  autoRetweet: process.env.AUTO_RETWEET !== 'false',
  autoComment: process.env.AUTO_COMMENT !== 'false',
  autoFollow: process.env.AUTO_FOLLOW !== 'false',

  // Targets
  targetTweets: (process.env.TARGET_TWEETS || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean),
  targetUsers: (process.env.TARGET_USERS || '')
    .split(',')
    .map(u => u.trim())
    .filter(Boolean),

  // Comments
  comments: (process.env.COMMENTS || 'Great!,Awesome!,Thanks for sharing!')
    .split(',')
    .map(c => c.trim())
    .filter(Boolean),

  // Behavior
  headless: process.env.HEADLESS !== 'false',
  delayMin: Number(process.env.DELAY_MIN || 3000),
  delayMax: Number(process.env.DELAY_MAX || 7000),

  // Scheduling
  enableScheduler: process.env.ENABLE_SCHEDULER === 'true',
  scheduleCron: process.env.SCHEDULE_CRON || '0 */6 * * *',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logToFile: process.env.LOG_TO_FILE === 'true',
  logFilePath: process.env.LOG_FILE_PATH || './logs/bot.log',

  // Proxy
  useProxy: process.env.USE_PROXY === 'true',
  proxyUrl: process.env.PROXY_URL || '',

  // Safety limits
  maxLikesPerRun: Number(process.env.MAX_LIKES_PER_RUN || 10),
  maxRetweetsPerRun: Number(process.env.MAX_RETWEETS_PER_RUN || 10),
  maxCommentsPerRun: Number(process.env.MAX_COMMENTS_PER_RUN || 5),
  maxFollowsPerRun: Number(process.env.MAX_FOLLOWS_PER_RUN || 5),
  stopOnError: process.env.STOP_ON_ERROR === 'true',
};

/**
 * Validate configuration
 */
export function validateConfig() {
  const errors = [];

  // Check login method
  if (config.useCookies) {
    if (!config.cookies) {
      errors.push('TWITTER_COOKIES is required when USE_COOKIES=true');
    }
  } else {
    if (!config.username || !config.password) {
      errors.push('TWITTER_USERNAME and TWITTER_PASSWORD are required when USE_COOKIES=false');
    }
  }

  // Check if at least one action is enabled
  if (!config.autoLike && !config.autoRetweet && !config.autoComment && !config.autoFollow) {
    errors.push('At least one action must be enabled (AUTO_LIKE, AUTO_RETWEET, AUTO_COMMENT, or AUTO_FOLLOW)');
  }

  // Check if targets are provided
  if (config.targetTweets.length === 0 && config.targetUsers.length === 0) {
    errors.push('At least one target must be provided (TARGET_TWEETS or TARGET_USERS)');
  }

  // Check delays
  if (config.delayMin < 1000) {
    errors.push('DELAY_MIN must be at least 1000ms (1 second) for safety');
  }
  if (config.delayMax < config.delayMin) {
    errors.push('DELAY_MAX must be greater than DELAY_MIN');
  }

  if (errors.length > 0) {
    throw new Error('Configuration errors:\n' + errors.map(e => `  - ${e}`).join('\n'));
  }

  return true;
}

/**
 * Print current configuration (hide sensitive data)
 */
export function printConfig() {
  console.log('\n========== CONFIGURATION ==========');
  console.log('Login Method:', config.useCookies ? 'Cookies' : 'Username/Password');
  console.log('Username:', config.username ? `${config.username.substring(0, 3)}***` : 'Not set');
  console.log('Email:', config.email ? `${config.email.substring(0, 5)}***` : 'Not set');
  console.log('Headless:', config.headless);
  console.log('Actions:', {
    like: config.autoLike,
    retweet: config.autoRetweet,
    comment: config.autoComment,
    follow: config.autoFollow,
  });
  console.log('Targets:', {
    tweets: config.targetTweets.length,
    users: config.targetUsers.length,
  });
  console.log('Delays:', `${config.delayMin}ms - ${config.delayMax}ms`);
  console.log('Scheduler:', config.enableScheduler ? `Enabled (${config.scheduleCron})` : 'Disabled');
  console.log('===================================\n');
}