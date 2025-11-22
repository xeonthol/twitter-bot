// src/auth.js - ANTI-DETECTION VERSION
import { config } from '../config/config.js';
import { log } from '../utils/logger.js';
import { sleep, randomDelay, parseCookies } from '../utils/helpers.js';

/**
 * Authentication handler for Twitter with anti-detection
 */
export class TwitterAuth {
  constructor(page) {
    this.page = page;
  }

  /**
   * Login to Twitter
   */
  async login() {
    if (config.useCookies) {
      return await this.loginWithCookies();
    } else {
      return await this.loginWithCredentials();
    }
  }

  /**
   * Login using cookies (Enhanced with Multiple Domain Support)
   */
  async loginWithCookies() {
    try {
      log.info('🍪 Starting cookie login...');
      
      // Parse cookies
      const cookieString = config.cookies.trim();
      log.info(`📋 Cookie string length: ${cookieString.length} chars`);
      
      // Create cookies for multiple domains
      const cookiePairs = cookieString.split(';').map(c => {
        const [name, value] = c.trim().split('=');
        return { 
          name: name.trim(), 
          value: value.trim() 
        };
      });
      
      log.info(`📋 Parsed ${cookiePairs.length} cookie pairs`);
      
      // Log cookie names
      cookiePairs.forEach(c => {
        log.info(`  - ${c.name}: ${c.value.substring(0, 10)}...`);
      });
      
      // Navigate to x.com first
      log.info('🌐 Navigating to x.com...');
      await this.page.goto('https://x.com', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      
      await sleep(2000);
      log.info('✓ Initial page loaded');
      
      // Set cookies for .x.com domain
      log.info('🍪 Setting cookies for .x.com...');
      const xComCookies = cookiePairs.map(c => ({
        name: c.name,
        value: c.value,
        domain: '.x.com',
        path: '/',
        httpOnly: c.name === 'auth_token' || c.name === 'kdt',
        secure: true,
        sameSite: 'None'
      }));
      
      await this.page.setCookie(...xComCookies);
      log.info('✓ Cookies set for .x.com');
      
      // Also try .twitter.com for compatibility
      log.info('🍪 Setting cookies for .twitter.com (fallback)...');
      await this.page.goto('https://twitter.com', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      
      await sleep(1000);
      
      const twitterCookies = cookiePairs.map(c => ({
        name: c.name,
        value: c.value,
        domain: '.twitter.com',
        path: '/',
        httpOnly: c.name === 'auth_token' || c.name === 'kdt',
        secure: true,
        sameSite: 'None'
      }));
      
      await this.page.setCookie(...twitterCookies);
      log.info('✓ Cookies set for .twitter.com');
      
      // Screenshot before navigation
      await this.page.screenshot({ path: 'logs/cookie-1-before-home.png' });
      
      // Navigate to home page
      log.info('🏠 Navigating to home page...');
      await this.page.goto('https://x.com/home', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      
      log.info('⏳ Waiting for page to load...');
      await sleep(5000); // Longer wait
      
      // Screenshot after navigation
      await this.page.screenshot({ path: 'logs/cookie-2-after-home.png' });
      
      const currentUrl = this.page.url();
      log.info(`📍 Current URL: ${currentUrl}`);
      
      // Get page title
      const title = await this.page.title();
      log.info(`📄 Page title: ${title}`);
      
      // Check if redirected to login
      if (currentUrl.includes('/login') || currentUrl.includes('/i/flow')) {
        log.error('❌ Redirected to login page');
        log.error('   Cookies are invalid or expired');
        
        await this.page.screenshot({ path: 'logs/cookie-error-login-redirect.png' });
        
        throw new Error('Cookies invalid/expired. Get fresh cookies from Brave.');
      }
      
      // Verify login
      log.info('🔍 Verifying login...');
      const isLoggedIn = await this.verifyLogin();
      
      if (!isLoggedIn) {
        log.error('❌ Login verification failed');
        
        // Debug: Check page content
        const html = await this.page.content();
        log.error(`Page HTML length: ${html.length}`);
        
        // Check for specific elements
        const hasLoginForm = html.includes('Sign in to X');
        log.error(`Has login form: ${hasLoginForm}`);
        
        await this.page.screenshot({ path: 'logs/cookie-error-verify-failed.png' });
        
        throw new Error('Login verification failed. Check screenshots.');
      }
      
      log.success('✅ Successfully logged in with cookies!');
      return true;
      
    } catch (error) {
      log.error('❌ Cookie login failed:', error.message);
      
      try {
        await this.page.screenshot({ path: 'logs/cookie-error-final.png' });
        const url = this.page.url();
        log.error(`Final URL: ${url}`);
      } catch {}
      
      throw new Error('Cookie authentication failed: ' + error.message);
    }
  }

  /**
   * Human-like mouse movement to element
   */
  async humanClick(element) {
    const box = await element.boundingBox();
    if (box) {
      // Random point within element
      const x = box.x + box.width * (0.3 + Math.random() * 0.4);
      const y = box.y + box.height * (0.3 + Math.random() * 0.4);
      
      // Move mouse slowly
      await this.page.mouse.move(x, y, { steps: 10 });
      await sleep(randomDelay(100, 300));
      
      // Click
      await this.page.mouse.click(x, y);
      await sleep(randomDelay(200, 500));
    } else {
      // Fallback to regular click
      await element.click();
    }
  }

  /**
   * Human-like typing
   */
  async humanType(selector, text) {
    await this.page.click(selector);
    await sleep(randomDelay(300, 600));
    
    // Type character by character with random delays
    for (const char of text) {
      await this.page.keyboard.type(char);
      await sleep(randomDelay(50, 200)); // Human-like typing speed
    }
    
    await sleep(randomDelay(300, 600));
  }

  /**
   * Login using username and password with anti-detection
   */
  async loginWithCredentials() {
    try {
      log.info('🔐 Starting login with enhanced anti-detection...');
      
      // Navigate to login page
      await this.page.goto('https://x.com/i/flow/login', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      
      log.info('✓ Login page loaded');
      
      // Wait longer for page to fully render
      await sleep(randomDelay(3000, 5000));
      
      // Random mouse movements (simulate reading page)
      await this.page.mouse.move(100, 100);
      await sleep(randomDelay(500, 1000));
      await this.page.mouse.move(300, 400);
      await sleep(randomDelay(500, 1000));
      
      // Take screenshot
      await this.page.screenshot({ path: 'logs/1-login-page.png' });
      
      // === STEP 1: Enter Username (Human-like) ===
      log.info('📝 Entering username...');
      
      const usernameSelector = 'input[autocomplete="username"]';
      
      try {
        // Wait and check if input exists
        await this.page.waitForSelector(usernameSelector, { 
          visible: true,
          timeout: 10000 
        });
        
        // Focus on input (like human tabbing or clicking)
        await sleep(randomDelay(1000, 2000));
        const usernameInput = await this.page.$(usernameSelector);
        
        // Human-like click
        await this.humanClick(usernameInput);
        await sleep(randomDelay(500, 1000));
        
        // Type username slowly
        await this.humanType(usernameSelector, config.username);
        
        log.success('✓ Username entered');
        await sleep(randomDelay(1500, 2500));
        
        // Screenshot
        await this.page.screenshot({ path: 'logs/2-username-entered.png' });
        
      } catch (error) {
        log.error('Failed to enter username:', error.message);
        await this.page.screenshot({ path: 'logs/error-username.png' });
        throw error;
      }
      
      // === STEP 2: Click Next (Critical - Most Human-like) ===
      log.info('🖱️  Looking for Next button...');
      
      try {
        // Wait a bit (like human thinking)
        await sleep(randomDelay(2000, 3000));
        
        // Find Next button by multiple methods
        let nextButton = null;
        
        // Method 1: By text content
        const buttons = await this.page.$$('[role="button"]');
        log.info(`Found ${buttons.length} buttons`);
        
        for (let i = 0; i < buttons.length; i++) {
          const button = buttons[i];
          
          try {
            const text = await this.page.evaluate(el => el.textContent?.trim(), button);
            
            if (text) {
              log.info(`Button ${i}: "${text}"`);
              
              if (text === 'Next' || text === 'Berikutnya' || text.toLowerCase() === 'next') {
                log.info(`✓ Found Next button at index ${i}`);
                nextButton = button;
                break;
              }
            }
          } catch (e) {
            continue;
          }
        }
        
        if (nextButton) {
          // Scroll button into view
          await this.page.evaluate(el => {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, nextButton);
          
          await sleep(randomDelay(500, 1000));
          
          // Human-like click
          log.info('🖱️  Clicking Next button (human-like)...');
          await this.humanClick(nextButton);
          
          log.success('✓ Next button clicked!');
          
        } else {
          // Fallback: Try pressing Enter
          log.warn('Next button not found, trying Enter key...');
          await this.page.keyboard.press('Enter');
          log.info('✓ Enter key pressed');
        }
        
        // IMPORTANT: Wait longer after Next click
        // This gives Twitter time to process WITHOUT refreshing
        log.info('⏳ Waiting for page transition...');
        await sleep(randomDelay(4000, 6000));
        
        // Check if page refreshed (stayed on same URL)
        const currentUrl = this.page.url();
        log.info(`Current URL: ${currentUrl}`);
        
        if (currentUrl.includes('/login')) {
          log.warn('⚠️  Still on login page - might indicate refresh or error');
        }
        
        // Screenshot
        await this.page.screenshot({ path: 'logs/3-after-next-click.png' });
        
      } catch (error) {
        log.error('Failed at Next button:', error.message);
        await this.page.screenshot({ path: 'logs/error-next.png' });
        throw error;
      }
      
      // === STEP 3: Check for Email Verification ===
      log.info('🔍 Checking for verification...');
      await sleep(randomDelay(2000, 3000));
      
      const verificationInput = await this.page.$('input[data-testid="ocfEnterTextTextInput"]');
      
      if (verificationInput) {
        log.info('📧 Email verification required');
        
        if (!config.email) {
          throw new Error('TWITTER_EMAIL not set in .env');
        }
        
        await sleep(randomDelay(1000, 2000));
        await this.humanType('input[data-testid="ocfEnterTextTextInput"]', config.email);
        
        log.success('✓ Email entered');
        await sleep(randomDelay(2000, 3000));
        
        // Click Next again
        const buttons2 = await this.page.$$('[role="button"]');
        for (const button of buttons2) {
          const text = await this.page.evaluate(el => el.textContent, button);
          if (text && text.includes('Next')) {
            await this.humanClick(button);
            log.success('✓ Verification Next clicked');
            break;
          }
        }
        
        await sleep(randomDelay(4000, 6000));
        await this.page.screenshot({ path: 'logs/4-after-verification.png' });
      }
      
      // === STEP 4: Enter Password ===
      log.info('🔑 Entering password...');
      
      try {
        const passwordSelector = 'input[name="password"]';
        await this.page.waitForSelector(passwordSelector, { 
          visible: true,
          timeout: 15000 
        });
        
        await sleep(randomDelay(1000, 2000));
        
        const passwordInput = await this.page.$(passwordSelector);
        await this.humanClick(passwordInput);
        await sleep(randomDelay(500, 1000));
        
        // Type password
        await this.humanType(passwordSelector, config.password);
        
        log.success('✓ Password entered');
        await sleep(randomDelay(2000, 3000));
        
        await this.page.screenshot({ path: 'logs/5-password-entered.png' });
        
      } catch (error) {
        log.error('Failed to enter password:', error.message);
        await this.page.screenshot({ path: 'logs/error-password.png' });
        throw error;
      }
      
      // === STEP 5: Click Log in ===
      log.info('🚀 Clicking Log in...');
      
      try {
        const loginButton = await this.page.$('[data-testid="LoginForm_Login_Button"]');
        
        if (loginButton) {
          await this.humanClick(loginButton);
          log.success('✓ Log in clicked');
        } else {
          await this.page.keyboard.press('Enter');
          log.info('✓ Enter pressed');
        }
        
        // Wait for navigation
        log.info('⏳ Waiting for login to complete...');
        
        await Promise.race([
          this.page.waitForNavigation({ 
            waitUntil: 'networkidle0',
            timeout: 30000 
          }),
          sleep(15000)
        ]);
        
        await sleep(randomDelay(3000, 5000));
        await this.page.screenshot({ path: 'logs/6-after-login.png' });
        
      } catch (error) {
        log.warn('Navigation timeout (might be OK)');
      }
      
      // === STEP 6: Verify Login ===
      log.info('✅ Verifying login...');
      const isLoggedIn = await this.verifyLogin();
      
      if (!isLoggedIn) {
        const url = this.page.url();
        log.error(`Login failed. URL: ${url}`);
        await this.page.screenshot({ path: 'logs/error-login-failed.png' });
        throw new Error('Login verification failed');
      }
      
      log.success('🎉 Successfully logged in!');
      return true;
      
    } catch (error) {
      log.error('❌ Login failed:', error.message);
      
      try {
        const url = this.page.url();
        log.error(`Current URL: ${url}`);
        
        // Get page content for debugging
        const content = await this.page.content();
        log.error(`Page title: ${await this.page.title()}`);
        
        await this.page.screenshot({ path: 'logs/error-final.png' });
      } catch {}
      
      throw new Error('Login process failed: ' + error.message);
    }
  }

  /**
   * Verify if login was successful (Enhanced)
   */
  async verifyLogin() {
    try {
      log.info('🔍 Starting login verification...');
      await sleep(2000);
      
      const url = this.page.url();
      log.info(`📍 Current URL: ${url}`);
      
      // Method 1: Check URL
      if (url.includes('/home')) {
        log.success('✅ Verified: On home page');
        return true;
      }
      
      if (url.includes('/explore') || url.includes('/notifications')) {
        log.success('✅ Verified: On explore/notifications');
        return true;
      }
      
      // Method 2: Check for logged-in elements
      log.info('🔍 Checking for UI elements...');
      
      const selectors = [
        { name: 'Account Switcher', selector: '[data-testid="SideNav_AccountSwitcher_Button"]' },
        { name: 'New Tweet Button', selector: '[data-testid="SideNav_NewTweet_Button"]' },
        { name: 'Primary Column', selector: '[data-testid="primaryColumn"]' },
        { name: 'Home Timeline', selector: '[aria-label="Home timeline"]' },
        { name: 'Sidebar', selector: '[data-testid="sidebarColumn"]' }
      ];
      
      for (const { name, selector } of selectors) {
        try {
          log.info(`  Checking: ${name}...`);
          const element = await this.page.waitForSelector(selector, { 
            timeout: 3000,
            visible: false 
          });
          
          if (element) {
            log.success(`✅ Found: ${name}`);
            return true;
          }
        } catch (e) {
          log.info(`  ❌ Not found: ${name}`);
        }
      }
      
      // Method 3: Check if NOT on login page
      if (!url.includes('/login') && !url.includes('/i/flow')) {
        log.info('⚠️  Not on login page, might be logged in...');
        
        // Wait a bit more and check again
        await sleep(3000);
        
        const newUrl = this.page.url();
        if (!newUrl.includes('/login')) {
          log.success('✅ Verified: Not on login page');
          return true;
        }
      }
      
      log.warn('⚠️  Could not verify login definitively');
      return false;
      
    } catch (error) {
      log.error('❌ Verification error:', error.message);
      return false;
    }
  }

  async getCurrentUser() {
    try {
      await this.page.click('[data-testid="SideNav_AccountSwitcher_Button"]');
      await sleep(1000);
      
      const usernameElement = await this.page.$('[data-testid="UserName"]');
      if (usernameElement) {
        const username = await this.page.evaluate(el => el.textContent, usernameElement);
        return username;
      }
      
      return 'Unknown';
    } catch {
      return 'Unknown';
    }
  }

  async isLoggedIn() {
    try {
      const accountButton = await this.page.$('[data-testid="SideNav_AccountSwitcher_Button"]');
      return !!accountButton;
    } catch {
      return false;
    }
  }
}