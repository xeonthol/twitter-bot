// utils/helpers.js

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get random delay between min and max
 */
export function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get random item from array
 */
export function randomChoice(array) {
  if (!array || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Parse cookies from string to array format (Enhanced)
 */
export function parseCookies(cookieString) {
  if (!cookieString) return [];
  
  return cookieString.split(';').map(cookie => {
    const [name, value] = cookie.trim().split('=');
    
    // Determine if cookie should be httpOnly
    const isHttpOnly = name.trim() === 'auth_token' || name.trim() === 'kdt';
    
    return {
      name: name.trim(),
      value: value ? value.trim() : '',
      domain: '.x.com',
      path: '/',
      httpOnly: isHttpOnly,
      secure: true,
      sameSite: 'None'
    };
  }).filter(c => c.name && c.value);
}

/**
 * Extract tweet ID from URL
 */
export function extractTweetId(url) {
  const match = url.match(/status\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Extract username from URL
 */
export function extractUsername(url) {
  const match = url.match(/twitter\.com\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * Format timestamp
 */
export function formatTimestamp(date = new Date()) {
  return date.toISOString();
}

/**
 * Retry function with exponential backoff
 */
export async function retry(fn, maxAttempts = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      
      const delay = delayMs * Math.pow(2, attempt - 1);
      console.log(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms...`);
      await sleep(delay);
    }
  }
}

/**
 * Check if element exists on page
 */
export async function elementExists(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe click with wait
 */
export async function safeClick(page, selector, delay = 1000) {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    await sleep(delay);
    await page.click(selector);
    return true;
  } catch (error) {
    console.error(`Failed to click ${selector}:`, error.message);
    return false;
  }
}

/**
 * Safe type with human-like delay
 */
export async function safeType(page, selector, text, delay = 100) {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    await page.type(selector, text, { delay });
    return true;
  } catch (error) {
    console.error(`Failed to type in ${selector}:`, error.message);
    return false;
  }
}

/**
 * Sanitize text for logging (remove sensitive info)
 */
export function sanitizeForLog(text, maxLength = 50) {
  if (!text) return '';
  const sanitized = text.substring(0, maxLength);
  return text.length > maxLength ? `${sanitized}...` : sanitized;
}