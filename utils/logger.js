// utils/logger.js
import winston from 'winston';
import { config } from '../config/config.js';
import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const logDir = path.dirname(config.logFilePath);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
  
  if (Object.keys(meta).length > 0) {
    log += ' ' + JSON.stringify(meta);
  }
  
  return log;
});

// Create transports array
const transports = [
  // Console output
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      logFormat
    ),
  }),
];

// Add file transport if enabled
if (config.logToFile) {
  transports.push(
    new winston.transports.File({
      filename: config.logFilePath,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
    })
  );
}

// Create logger
export const logger = winston.createLogger({
  level: config.logLevel,
  transports,
});

/**
 * Log with emoji icons for better readability
 */
export const log = {
  info: (message, ...args) => logger.info(`ℹ️  ${message}`, ...args),
  success: (message, ...args) => logger.info(`✅ ${message}`, ...args),
  warn: (message, ...args) => logger.warn(`⚠️  ${message}`, ...args),
  error: (message, ...args) => logger.error(`❌ ${message}`, ...args),
  debug: (message, ...args) => logger.debug(`🔍 ${message}`, ...args),
  
  // Specific actions
  like: (url) => logger.info(`❤️  Liking: ${url}`),
  retweet: (url) => logger.info(`🔄 Retweeting: ${url}`),
  comment: (url, text) => logger.info(`💬 Commenting on ${url}: "${text}"`),
  follow: (user) => logger.info(`👤 Following: @${user}`),
};

/**
 * Log statistics in a formatted way
 */
export function logStats(stats) {
  logger.info('\n========== BOT STATISTICS ==========');
  logger.info(`❤️  Likes:     ${stats.likes}`);
  logger.info(`🔄 Retweets:  ${stats.retweets}`);
  logger.info(`💬 Comments:  ${stats.comments}`);
  logger.info(`👤 Follows:   ${stats.follows}`);
  logger.info(`❌ Errors:    ${stats.errors}`);
  logger.info('====================================\n');
}

export default logger;