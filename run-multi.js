// run-multi.js - Multi-Account Bot Manager with Anti-Suspend
import fs from 'fs';
import puppeteer from 'puppeteer';

/**
 * Sleep helper with random variance
 */
function sleep(ms, variance = 0.2) {
  const randomVariance = ms * variance * (Math.random() - 0.5) * 2;
  const finalDelay = Math.max(1000, ms + randomVariance);
  return new Promise(resolve => setTimeout(resolve, finalDelay));
}

/**
 * Random delay between actions (more human-like)
 */
function randomDelay(min = 3000, max = 8000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Load accounts from JSON file
 */
function loadAccounts(filePath = './accounts.json') {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const accountsData = JSON.parse(data);
    return accountsData.accounts;
  } catch (error) {
    console.error('❌ Failed to load accounts.json:', error.message);
    console.log('💡 Create accounts.json from accounts.json.example');
    process.exit(1);
  }
}

/**
 * Parse cookies string to array
 */
function parseCookies(cookieString) {
  const cookies = [];
  const pairs = cookieString.split(';').map(p => p.trim());
  
  for (const pair of pairs) {
    const [name, ...valueParts] = pair.split('=');
    const value = valueParts.join('=');
    
    if (name && value) {
      cookies.push({
        name: name.trim(),
        value: value.trim(),
        domain: '.x.com',
        path: '/',
        httpOnly: name === 'auth_token' || name === 'kdt',
        secure: true,
        sameSite: name === 'auth_token' ? 'None' : 'Lax'
      });
    }
  }
  
  return cookies;
}

/**
 * Human-like mouse movement
 */
async function humanClick(page, element) {
  const box = await element.boundingBox();
  if (!box) return;
  
  // Random point within element
  const x = box.x + box.width * (0.3 + Math.random() * 0.4);
  const y = box.y + box.height * (0.3 + Math.random() * 0.4);
  
  await page.mouse.move(x, y, { steps: Math.floor(Math.random() * 10) + 5 });
  await sleep(randomDelay(100, 300));
  await page.mouse.click(x, y);
}

/**
 * Human-like typing
 */
async function humanType(page, text, element = null) {
  if (element) await humanClick(page, element);
  
  for (const char of text) {
    await page.keyboard.type(char);
    await sleep(randomDelay(50, 150), 0.5);
  }
}

/**
 * Random scroll behavior
 */
async function randomScroll(page) {
  const scrolls = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < scrolls; i++) {
    const scrollAmount = Math.floor(Math.random() * 400) + 200;
    await page.evaluate((amount) => {
      window.scrollBy({
        top: amount,
        behavior: 'smooth'
      });
    }, scrollAmount);
    await sleep(randomDelay(1000, 2000));
  }
}

/**
 * Simulate reading behavior
 */
async function simulateReading(page, durationMs = 5000) {
  console.log(`  👀 Simulating reading (${Math.floor(durationMs/1000)}s)...`);
  
  // Random micro-scrolls during reading
  const scrollCount = Math.floor(durationMs / 2000);
  for (let i = 0; i < scrollCount; i++) {
    await sleep(2000);
    const microScroll = Math.floor(Math.random() * 100) + 50;
    await page.evaluate((amount) => {
      window.scrollBy({ top: amount, behavior: 'smooth' });
    }, microScroll);
  }
  
  await sleep(durationMs - (scrollCount * 2000));
}

/**
 * Browse timeline before actions (appear more natural)
 */
async function browseTimeline(page, duration = 15000) {
  console.log(`  📱 Browsing timeline for ${duration/1000}s...`);
  
  try {
    await page.goto('https://x.com/home', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    await sleep(3000);
    
    // Random scrolls
    const scrolls = Math.floor(Math.random() * 4) + 2;
    for (let i = 0; i < scrolls; i++) {
      await randomScroll(page);
      await sleep(randomDelay(2000, 4000));
    }
    
    console.log(`  ✅ Timeline browsing complete`);
  } catch (error) {
    console.log(`  ⚠️  Timeline browsing error: ${error.message}`);
  }
}

/**
 * Like specific tweet by URL - with anti-suspend measures
 */
async function likeTweet(page, tweetUrl) {
  try {
    console.log(`  ❤️  Liking tweet: ${tweetUrl}`);
    await page.goto(tweetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Simulate reading before action
    await simulateReading(page, randomDelay(4000, 7000));

    // Check if already liked
    const alreadyLiked = await page.$('[data-testid="unlike"]');
    if (alreadyLiked) {
      console.log(`  ℹ️  Already liked this tweet`);
      return false; // Not counting as new action
    }

    const likeSelectors = [
      '[data-testid="like"]',
      'button[data-testid="like"]',
      '[aria-label*="Like"][role="button"]'
    ];

    for (const selector of likeSelectors) {
      const likeButton = await page.$(selector);
      if (likeButton) {
        await humanClick(page, likeButton);
        await sleep(randomDelay(2000, 3000));
        
        // VERIFY: Check if like was successful
        const verifyUnlike = await page.$('[data-testid="unlike"]');
        if (verifyUnlike) {
          console.log(`  ✅ Like CONFIRMED!`);
          return true;
        } else {
          console.log(`  ❌ Like failed - button clicked but not registered`);
          return false;
        }
      }
    }
    
    console.log(`  ❌ Like button not found`);
    return false;
  } catch (error) {
    console.log(`  💥 Failed to like: ${error.message}`);
    return false;
  }
}

/**
 * Retweet specific tweet by URL - with anti-suspend measures
 */
async function retweetTweet(page, tweetUrl) {
  try {
    console.log(`  🔁 Retweeting: ${tweetUrl}`);
    await page.goto(tweetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Simulate reading
    await simulateReading(page, randomDelay(3000, 6000));

    // Check if already retweeted
    const alreadyRetweeted = await page.$('[data-testid="unretweet"]');
    if (alreadyRetweeted) {
      console.log(`  ℹ️  Already retweeted this tweet`);
      return false; // Not counting as new action
    }

    const retweetSelectors = [
      '[data-testid="retweet"]',
      'button[data-testid="retweet"]'
    ];

    for (const selector of retweetSelectors) {
      const retweetButton = await page.$(selector);
      if (retweetButton) {
        await humanClick(page, retweetButton);
        await sleep(randomDelay(1500, 2500));
        
        const confirmButton = await page.$('[data-testid="retweetConfirm"]');
        if (confirmButton) {
          await humanClick(page, confirmButton);
          await sleep(randomDelay(2000, 3000));
          
          // VERIFY: Check if retweet was successful
          const verifyUnretweet = await page.$('[data-testid="unretweet"]');
          if (verifyUnretweet) {
            console.log(`  ✅ Retweet CONFIRMED!`);
            return true;
          } else {
            console.log(`  ❌ Retweet failed - not registered`);
            return false;
          }
        }
      }
    }
    
    console.log(`  ❌ Retweet button not found`);
    return false;
  } catch (error) {
    console.log(`  💥 Failed to retweet: ${error.message}`);
    return false;
  }
}

/**
 * Comment on specific tweet by URL - with anti-suspend measures
 */
async function commentOnTweet(page, tweetUrl, commentText) {
  try {
    console.log(`  💬 Commenting: ${tweetUrl}`);
    await page.goto(tweetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Simulate reading before commenting
    await simulateReading(page, randomDelay(5000, 8000));

    const replySelectors = [
      '[data-testid="reply"]',
      'button[data-testid="reply"]'
    ];

    let replyButton = null;
    for (const selector of replySelectors) {
      replyButton = await page.$(selector);
      if (replyButton) break;
    }

    if (!replyButton) {
      console.log(`  ❌ Reply button not found`);
      return false;
    }

    await humanClick(page, replyButton);
    await sleep(randomDelay(2000, 3000));

    const textareaSelectors = [
      '[data-testid="tweetTextarea_0"]',
      'div[contenteditable="true"][role="textbox"]'
    ];

    let textarea = null;
    for (const selector of textareaSelectors) {
      textarea = await page.$(selector);
      if (textarea) break;
    }

    if (!textarea) {
      console.log(`  ❌ Comment textarea not found`);
      return false;
    }

    // Human-like typing
    await humanType(page, commentText, textarea);
    await sleep(randomDelay(2000, 3000));

    const tweetButtonSelectors = [
      '[data-testid="tweetButton"]',
      '[data-testid="tweetButtonInline"]'
    ];

    let tweetButton = null;
    for (const selector of tweetButtonSelectors) {
      tweetButton = await page.$(selector);
      if (tweetButton) break;
    }

    if (tweetButton) {
      // Get current URL before posting
      const urlBeforePost = page.url();
      
      await humanClick(page, tweetButton);
      await sleep(randomDelay(4000, 6000));
      
      // VERIFY: Check if comment was posted
      // Method 1: URL changed (redirected to the reply)
      const urlAfterPost = page.url();
      if (urlAfterPost !== urlBeforePost) {
        console.log(`  ✅ Comment CONFIRMED (URL changed)!`);
        return true;
      }
      
      // Method 2: Modal closed (textarea disappeared)
      const textareaStillExists = await page.$(textareaSelectors[0]);
      if (!textareaStillExists) {
        console.log(`  ✅ Comment CONFIRMED (modal closed)!`);
        return true;
      }
      
      // Method 3: Check for success indicators
      await page.goto(tweetUrl, { waitUntil: 'networkidle2' });
      await sleep(2000);
      const pageContent = await page.content();
      if (pageContent.includes(commentText)) {
        console.log(`  ✅ Comment CONFIRMED (found in page)!`);
        return true;
      }
      
      console.log(`  ❌ Comment may have failed - could not verify`);
      return false;
      
    } else {
      console.log(`  ❌ Tweet button not found`);
      return false;
    }

  } catch (error) {
    console.log(`  💥 Failed to comment: ${error.message}`);
    return false;
  }
}

/**
 * Wait for element with timeout - FROM STEALTH SCRIPT
 */
async function waitForElement(page, selectors, timeout = 8000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    for (const selector of selectors) {
      const element = await page.$(selector);
      if (element) return element;
    }
    await sleep(300, 500);
  }
  
  return null;
}

/**
 * Follow user - FROM STEALTH SCRIPT (WORKING VERSION)
 */
async function followUser(page, username) {
  try {
    console.log(`  👤 Following: @${username}`);
    await page.goto(`https://x.com/${username}`, { 
      waitUntil: 'domcontentloaded', 
      timeout: 20000 
    });
    await sleep(3000, 5000); // View profile time
    
    // Random scroll
    await randomScroll(page);

    const followButton = await waitForElement(page, [
      '[data-testid="follow"]',
      'button[data-testid*="follow"]:not([data-testid*="unfollow"])'
    ], 5000);

    if (followButton) {
      await humanClick(page, followButton);
      console.log(`  ✅ Followed @${username}`);
      await sleep(2000, 4000);
      return true;
    }

    console.log(`  ℹ️  Already following or button not found`);
    return false;
  } catch (error) {
    console.log(`  💥 Failed to follow @${username}: ${error.message}`);
    return false;
  }
}

/**
 * Run bot for single account - with anti-suspend measures
 */
async function runAccount(account, index) {
  const accountName = account.name || `Account ${index + 1}`;
  
  console.log('\n' + '='.repeat(60));
  console.log(`🤖 Starting: ${accountName}`);
  console.log('='.repeat(60));

  let browser;
  
  try {
    // Launch browser with stealth settings
    browser = await puppeteer.launch({
      headless: false, // Visible browser for more human-like behavior
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1366,768',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });

    const page = await browser.newPage();
    
    // Stealth mode
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    });
    
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set cookies
    const cookies = parseCookies(account.cookies);
    await page.setCookie(...cookies);
    
    // Navigate to Twitter
    console.log('📱 Opening Twitter...');
    await page.goto('https://x.com/home', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await sleep(randomDelay(4000, 6000));
    
    // Check if logged in
    const isLoggedIn = await page.$('[data-testid="AppTabBar_Profile_Link"]');
    if (!isLoggedIn) {
      throw new Error('Login failed');
    }

    console.log('✅ Logged in successfully!');
    
    // IMPORTANT: Browse timeline first (natural behavior)
    await browseTimeline(page, randomDelay(15000, 25000));
    
    // Perform actions
    const config = account.config || {};
    let actionsCount = 0;

    console.log('\n🔍 Config check:');
    console.log(`  targetUsers: ${config.targetUsers ? config.targetUsers.join(', ') : 'NONE'}`);
    console.log(`  targetTweets: ${config.targetTweets ? config.targetTweets.length + ' tweets' : 'NONE'}`);

    // 1. FOLLOW TARGET USERS
    if (config.autoFollow && config.targetUsers && config.targetUsers.length > 0) {
      console.log(`\n👥 FOLLOWING TARGET USERS:`);
      const maxFollows = Math.min(config.targetUsers.length, config.maxFollowsPerRun || 2);
      
      for (let i = 0; i < maxFollows; i++) {
        const user = config.targetUsers[i];
        const success = await followUser(page, user);
        if (success) actionsCount++;
        
        // Random delay between follows
        await sleep(randomDelay(8000, 15000));
      }
    }

    // 2. PROCESS SPECIFIC TWEETS
    if (config.targetTweets && config.targetTweets.length > 0) {
      console.log(`\n🎯 PROCESSING SPECIFIC TWEETS:`);
      
      const maxTweets = Math.min(config.targetTweets.length, 3);
      
      for (let i = 0; i < maxTweets; i++) {
        const tweetUrl = config.targetTweets[i];
        console.log(`\n📝 Processing tweet ${i+1}/${maxTweets}: ${tweetUrl}`);
        
        // LIKE tweet
        if (config.autoLike) {
          const liked = await likeTweet(page, tweetUrl);
          if (liked) actionsCount++;
          await sleep(randomDelay(5000, 10000));
        }
        
        // RETWEET tweet  
        if (config.autoRetweet) {
          const retweeted = await retweetTweet(page, tweetUrl);
          if (retweeted) actionsCount++;
          await sleep(randomDelay(5000, 10000));
        }
        
        // COMMENT on tweet
        if (config.autoComment && config.comments && config.comments.length > 0) {
          const randomComment = config.comments[Math.floor(Math.random() * config.comments.length)];
          const commented = await commentOnTweet(page, tweetUrl, randomComment);
          if (commented) actionsCount++;
          await sleep(randomDelay(8000, 15000));
        }
        
        // Browse timeline between tweets (look natural)
        if (i < maxTweets - 1) {
          await browseTimeline(page, randomDelay(10000, 15000));
        }
      }
    } else {
      console.log(`\n⚠️  No specific tweets configured in targetTweets`);
    }

    console.log(`\n🎉 ${accountName} completed! Total actions: ${actionsCount}`);
    
    console.log(`\n⏸️  Closing browser in 5 seconds...`);
    await sleep(5000);
    
    await browser.close();
    return { success: true, account: accountName, actions: actionsCount };
    
  } catch (error) {
    console.error(`❌ ${accountName} failed:`, error.message);
    if (browser) await browser.close();
    return { success: false, account: accountName, error: error.message };
  }
}

/**
 * Run accounts sequentially
 */
async function runSequential(accounts) {
  console.log('\n🔄 SEQUENTIAL MODE - Running one by one\n');
  
  const results = [];
  
  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    
    if (!account.enabled) {
      console.log(`⏭️  Skipping: ${account.name || `Account ${i + 1}`} (disabled)`);
      continue;
    }
    
    const result = await runAccount(account, i);
    results.push(result);
    
    // Long wait between accounts (anti-suspend)
    if (i < accounts.length - 1) {
      const waitTime = randomDelay(30000, 60000) / 1000; // 30-60 seconds
      console.log(`\n⏳ Waiting ${Math.floor(waitTime)}s before next account...\n`);
      await sleep(waitTime * 1000);
    }
  }
  
  return results;
}

/**
 * Run accounts in parallel (NOT RECOMMENDED for anti-suspend)
 */
async function runParallel(accounts) {
  console.log('\n⚡ PARALLEL MODE - Running all simultaneously');
  console.log('⚠️  WARNING: Parallel mode increases suspend risk!\n');
  
  const enabledAccounts = accounts.filter(acc => acc.enabled);
  const promises = enabledAccounts.map((account, index) => runAccount(account, index));
  
  const results = await Promise.allSettled(promises);
  
  return results.map((result, i) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        success: false,
        account: enabledAccounts[i].name,
        error: result.reason.message
      };
    }
  });
}

/**
 * Print summary
 */
function printSummary(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 EXECUTION SUMMARY');
  console.log('='.repeat(60));
  
  let totalSuccess = 0;
  let totalFailed = 0;
  let totalActions = 0;
  
  results.forEach(result => {
    const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
    const actions = result.actions || 0;
    const actionText = actions > 0 ? ` (${actions} successful actions)` : ' (0 actions)';
    
    console.log(`${result.account}: ${status}${actionText}`);
    
    if (result.error) {
      console.log(`  └─ Error: ${result.error}`);
    }
    
    if (result.success) {
      totalSuccess++;
      totalActions += actions;
    } else {
      totalFailed++;
    }
  });
  
  console.log('\n' + '─'.repeat(60));
  console.log(`✅ Successful: ${totalSuccess} accounts`);
  console.log(`❌ Failed: ${totalFailed} accounts`);
  console.log(`🎯 Total Actions: ${totalActions} successful actions`);
  console.log('='.repeat(60) + '\n');
  
  // Warning if all accounts show 0 actions
  if (totalActions === 0 && totalSuccess > 0) {
    console.log('⚠️  WARNING: All accounts completed but NO actions were successful!');
    console.log('💡 This likely means:');
    console.log('   1. Tweets already liked/retweeted');
    console.log('   2. Users already followed');
    console.log('   3. Login cookies expired');
    console.log('   4. Selectors need update (Twitter UI changed)');
    console.log('   5. Rate limited by Twitter\n');
  }
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'sequential';
  const filePath = args.includes('--file') 
    ? args[args.indexOf('--file') + 1] 
    : './accounts.json';

  console.log('\n🤖 TWITTER BOT - ANTI-SUSPEND MODE');
  console.log(`Mode: ${mode.toUpperCase()}`);
  console.log(`Config: ${filePath}\n`);

  // Load accounts
  const accounts = loadAccounts(filePath);
  const enabledCount = accounts.filter(a => a.enabled).length;
  
  console.log(`📋 Loaded ${accounts.length} accounts (${enabledCount} enabled)`);

  if (enabledCount === 0) {
    console.log('⚠️  No enabled accounts found!');
    return;
  }

  // Run
  let results;
  if (mode === 'parallel') {
    results = await runParallel(accounts);
  } else {
    results = await runSequential(accounts);
  }

  // Summary
  printSummary(results);
}

// Execute
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});