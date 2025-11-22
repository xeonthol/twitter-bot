#!/usr/bin/env node
/**
 * Twitter Automation Bot - Main Entry Point
 * 
 * Usage:
 *   node run.js           # Run once
 *   node run.js --schedule # Run with scheduler
 *   node run.js --test    # Test configuration
 */

import { config, validateConfig, printConfig } from './config/config.js';
import { log } from './utils/logger.js';
import { TwitterBot } from './src/twitter.js';
import { BotScheduler } from './src/scheduler.js';

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    schedule: args.includes('--schedule'),
    test: args.includes('--test'),
    help: args.includes('--help') || args.includes('-h'),
  };
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║           TWITTER AUTOMATION BOT - HELP                   ║
╚═══════════════════════════════════════════════════════════╝

USAGE:
  node run.js [options]

OPTIONS:
  (none)        Run bot once and exit
  --schedule    Run bot on schedule (uses SCHEDULE_CRON from .env)
  --test        Test configuration without executing
  --help, -h    Show this help message

EXAMPLES:
  # Run once immediately
  node run.js

  # Run with scheduler (every 6 hours by default)
  node run.js --schedule

  # Test if configuration is valid
  node run.js --test

CONFIGURATION:
  Edit .env file to configure:
  - Twitter credentials (cookies or username/password)
  - Target tweets and users
  - Actions to perform (like, retweet, comment, follow)
  - Delays and safety limits
  - Scheduling options

DOCUMENTATION:
  See README.md for detailed setup instructions

SAFETY WARNINGS:
  ⚠️  Using automation bots may violate Twitter's Terms of Service
  ⚠️  Your account may be suspended or banned
  ⚠️  Use burner accounts, not your main account
  ⚠️  Use at your own risk

═══════════════════════════════════════════════════════════
`);
}

/**
 * Test configuration
 */
async function testConfiguration() {
  try {
    log.info('🧪 Testing configuration...\n');
    
    // Validate
    validateConfig();
    log.success('✅ Configuration is valid');
    
    // Print config
    printConfig();
    
    log.success('✅ Configuration test passed');
    return true;
    
  } catch (error) {
    log.error('❌ Configuration test failed:', error.message);
    return false;
  }
}

/**
 * Run bot once
 */
async function runOnce() {
  const bot = new TwitterBot();
  
  try {
    // Validate config
    validateConfig();
    printConfig();
    
    // Initialize and run
    await bot.initialize();
    await bot.run();
    
    log.success('\n🎉 Bot execution completed successfully!');
    process.exit(0);
    
  } catch (error) {
    log.error('\n💥 Bot execution failed:', error.message);
    console.error(error);
    process.exit(1);
    
  } finally {
    await bot.close();
  }
}

/**
 * Run with scheduler
 */
async function runWithScheduler() {
  const scheduler = new BotScheduler();
  
  try {
    // Validate config
    validateConfig();
    printConfig();
    
    // Start scheduler
    const started = scheduler.start();
    
    if (!started) {
      log.error('Failed to start scheduler');
      process.exit(1);
    }
    
    // Keep process alive
    // Scheduler will run in background
    
  } catch (error) {
    log.error('Scheduler error:', error.message);
    console.error(error);
    scheduler.stop();
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main() {
  // Print banner
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║           🐦 TWITTER AUTOMATION BOT 🤖                    ║
║                   Version 1.0.0                           ║
╚═══════════════════════════════════════════════════════════╝
`);

  const args = parseArgs();

  // Show help
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  // Test configuration
  if (args.test) {
    const testPassed = await testConfiguration();
    process.exit(testPassed ? 0 : 1);
  }

  // Run with scheduler
  if (args.schedule) {
    await runWithScheduler();
    return; // Keep running
  }

  // Default: run once
  await runOnce();
}

/**
 * Handle graceful shutdown
 */
function setupSignalHandlers() {
  process.on('SIGINT', () => {
    log.info('\n\n⚠️  Received SIGINT (Ctrl+C)');
    log.info('🛑 Shutting down gracefully...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    log.info('\n\n⚠️  Received SIGTERM');
    log.info('🛑 Shutting down gracefully...');
    process.exit(0);
  });

  process.on('uncaughtException', (error) => {
    log.error('💥 Uncaught Exception:', error.message);
    console.error(error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    log.error('💥 Unhandled Rejection at:', promise);
    log.error('Reason:', reason);
    process.exit(1);
  });
}

// Setup handlers and run
setupSignalHandlers();
main().catch(error => {
  log.error('💥 Fatal error:', error.message);
  console.error(error);
  process.exit(1);
});