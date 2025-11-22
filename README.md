# 🤖 Twitter Automation Bot

A powerful and flexible Twitter automation bot built with Node.js and Puppeteer. Automate likes, retweets, comments, and follows with human-like behavior patterns using **cookie-based authentication**.

[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

## ✨ Features

- 🍪 **Cookie-Based Authentication**
  - Safe and reliable login method
  - No password exposure
  - Automatic cookie persistence
  - One-time manual login setup
  
- 🎯 **Automated Actions**
  - ❤️ Like tweets automatically
  - 🔄 Retweet posts
  - 💬 Auto-comment with randomized messages
  - 👥 Follow users
  
- 🛡️ **Safety Features**
  - Configurable action limits
  - Random delays between actions (3-15 seconds)
  - Human-like behavior simulation
  - Rate limiting protection
  
- ⏰ **Flexible Scheduling**
  - Cron-based scheduling
  - Run at specific times
  - Automated daily/hourly execution
  
- 📊 **Logging & Monitoring**
  - Detailed activity logs
  - File-based logging
  - Action tracking

## 📋 Prerequisites

- **Node.js** v18.0.0 or higher - [Download](https://nodejs.org/)
- **npm** package manager (comes with Node.js)
- A **Twitter/X account**
- **Chrome/Edge browser** (for getting cookies)

## 🚀 Quick Start Guide

### Step 1: Clone & Install

```bash
# Clone repository
git clone https://github.com/xeonthol/twitter-bot.git
cd twitter-bot

# Install dependencies
npm install
```

### Step 2: Get Your Twitter Cookies

**This is a ONE-TIME setup!**

1. **Login to Twitter** in Chrome/Edge browser
2. Open **DevTools** (Press `F12`)
3. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
4. Navigate to **Cookies** → `https://x.com`
5. Find and copy these **4 cookie values**:

| Cookie Name | Description | Example |
|-------------|-------------|---------|
| `auth_token` | Authentication token (long string) | `abc123def456...` |
| `ct0` | CSRF token (long string) | `xyz789uvw012...` |
| `kdt` | Session token (medium string) | `ghi345rst678...` |
| `twid` | Twitter ID | `u%3D1234567890` |

6. **Format cookies** (important - no spaces!):
```
auth_token=YOUR_VALUE; ct0=YOUR_VALUE; kdt=YOUR_VALUE; twid=YOUR_VALUE
```

**⚠️ Common Mistakes:**
- ❌ `auth_token=your auth_token` (placeholder text)
- ❌ `auth_token= abc123` (space after `=`)
- ❌ `auth_token=abc123 ; ct0=def456` (space before `;`)
- ✅ `auth_token=abc123; ct0=def456; kdt=ghi789; twid=u%3D123` ✅ CORRECT!

### Step 3: Configure Bot

Copy example configuration:
```bash
cp .env.example .env
```

Edit `.env` and paste your cookies:

```env
# ============ LOGIN (REQUIRED) ============
USE_COOKIES=true
TWITTER_COOKIES=auth_token=YOUR_VALUE; ct0=YOUR_VALUE; kdt=YOUR_VALUE; twid=YOUR_VALUE

# ============ TARGETS (REQUIRED - at least one!) ============
TARGET_USERS=elonmusk,OpenAI,github

# ============ ACTIONS ============
AUTO_LIKE=true
AUTO_RETWEET=true
AUTO_COMMENT=false  # Recommended: keep disabled
AUTO_FOLLOW=true

# ============ SAFETY LIMITS ============
MAX_LIKES_PER_RUN=5
MAX_RETWEETS_PER_RUN=3
MAX_FOLLOWS_PER_RUN=2

# ============ TIMING ============
DELAY_MIN=5000   # 5 seconds between actions
DELAY_MAX=12000  # 12 seconds max
HEADLESS=false   # See browser for first test
```

### Step 4: First Test Run

```bash
node run.js
```

**What happens:**
1. ✅ Bot reads cookies from `.env`
2. ✅ Logs into Twitter automatically
3. ✅ Saves session to `cookies.json`
4. ✅ Starts liking/retweeting/following based on targets
5. ✅ Shows progress in terminal

**If successful**, you'll see:
```
🔐 Successfully logged in with cookies
✅ Cookies saved to cookies.json
🎯 Starting automation...
❤️  Liked tweet from @elonmusk
🔄 Retweeted post from @OpenAI
```

### Step 5: Enable Background Mode

After successful test, edit `.env`:
```env
HEADLESS=true  # Run in background without browser window
```

Now run again:
```bash
node run.js
```

Bot runs silently in background! 🎉

## 📁 Project Structure

```
twitter-bot/
├── src/
│   ├── auth.js           # Cookie authentication handler
│   ├── twitter.js        # Main bot controller
│   ├── actions/
│   │   ├── like.js       # Like functionality
│   │   ├── retweet.js    # Retweet functionality
│   │   ├── comment.js    # Comment functionality
│   │   └── follow.js     # Follow functionality
│   └── scheduler.js      # Cron scheduling
├── utils/
│   ├── logger.js         # Logging system
│   └── helpers.js        # Helper functions
├── config/
│   └── config.js         # Configuration loader
├── .env                  # YOUR configuration (NEVER commit!)
├── .env.example          # Example configuration
├── cookies.json          # Saved session (auto-generated)
├── package.json          # Dependencies
├── run.js                # Entry point
└── README.md             # This file
```

## ⚙️ Configuration Reference

### Required Settings

```env
# MUST HAVE: Cookies from your browser
USE_COOKIES=true
TWITTER_COOKIES=auth_token=xxx; ct0=yyy; kdt=zzz; twid=www

# MUST HAVE: At least one target
TARGET_USERS=elonmusk,OpenAI
# OR
TARGET_TWEETS=https://x.com/username/status/1234567890
```

### Bot Actions

Enable/disable specific actions:

```env
AUTO_LIKE=true       # Like tweets
AUTO_RETWEET=true    # Retweet posts
AUTO_COMMENT=false   # Comment on tweets (RISKY - not recommended)
AUTO_FOLLOW=true     # Follow users
```

### Targeting Options

**Option 1: Target Users (Recommended)**
```env
TARGET_USERS=elonmusk,OpenAI,github,vercel
```
Bot will interact with recent tweets from these accounts.

**Option 2: Target Specific Tweets**
```env
TARGET_TWEETS=https://x.com/user/status/123,https://x.com/user/status/456
```
Bot will only interact with these specific tweets.

**Option 3: Both**
```env
TARGET_TWEETS=https://x.com/user/status/123
TARGET_USERS=OpenAI,github
```
Bot will do both!

### Safety Limits

**For NEW accounts (< 1 month old):**
```env
MAX_LIKES_PER_RUN=3
MAX_RETWEETS_PER_RUN=2
MAX_COMMENTS_PER_RUN=0
MAX_FOLLOWS_PER_RUN=1
DELAY_MIN=7000    # 7 seconds
DELAY_MAX=15000   # 15 seconds
```
**Run:** Once per day maximum

**For ESTABLISHED accounts (3+ months old):**
```env
MAX_LIKES_PER_RUN=10
MAX_RETWEETS_PER_RUN=7
MAX_COMMENTS_PER_RUN=3
MAX_FOLLOWS_PER_RUN=3
DELAY_MIN=3000    # 3 seconds
DELAY_MAX=8000    # 8 seconds
```
**Run:** 2-3 times per day

### Comments Configuration

If `AUTO_COMMENT=true`, bot randomly selects from these:

```env
# MINIMUM 10 comments recommended!
COMMENTS=Great post!,Thanks for sharing!,Very informative!,Love this!,Awesome content!,Well said!,Interesting perspective!,This is helpful!,Nice work!,Appreciate this!
```

**Tips:**
- ✅ Use 10+ varied comments (harder to detect)
- ✅ Match your normal style
- ❌ Avoid generic words like "nice", "cool"
- ⚠️ Comments are RISKY - recommend keeping `AUTO_COMMENT=false`

### Scheduling

Run bot automatically:

```env
ENABLE_SCHEDULER=true
SCHEDULE_CRON=0 */6 * * *  # Every 6 hours
```

**Cron Examples:**
- `0 */6 * * *` - Every 6 hours
- `0 9,15,21 * * *` - At 9am, 3pm, 9pm
- `0 14 * * *` - Every day at 2pm
- `0 10 * * 1-5` - Weekdays at 10am

Then run:
```bash
node run.js
# Bot stays running and executes on schedule
```

## 🛡️ Safety & Best Practices

### ⚠️ CRITICAL: Avoid Account Suspension

Twitter actively detects and bans bot accounts. Follow these rules:

**1. Start Slow**
- New account? Use conservative limits (3/2/0/1)
- Wait 24-48 hours between first runs
- Don't run bot on brand new accounts (wait 1 week)

**2. Use Realistic Delays**
- Minimum 5 seconds between actions
- Add randomness (use DELAY_MIN/MAX range)
- Humans don't like/follow every 2 seconds!

**3. Don't Overdo It**
- Daily limits: New accounts 10-15 actions, old accounts 50-100
- Don't run 24/7
- Take breaks (weekends without bot)

**4. Avoid Suspicious Patterns**
- Don't like everything from one user
- Don't follow 100 people in a row
- Mix actions (like, then retweet, then follow)

**5. Monitor Your Account**
- Check for "suspicious activity" emails
- If you see warnings, STOP bot immediately
- If locked, wait 48-72 hours before resuming

### 🚨 If Account Gets Locked

**Immediate Actions:**
1. ✅ Unlock via email verification
2. ⏸️ STOP bot for 2-3 days minimum
3. 🧑 Do manual activity (scroll, like, read tweets)
4. 📉 When resuming, cut limits in HALF
5. 🔍 Monitor closely for 1 week

**Prevention:**
- Use conservative limits
- Don't rush
- Quality over quantity
- Patience = account survival

### 📊 Recommended Daily Limits

| Account Age | Likes | Retweets | Follows | Comments | Runs/Day |
|-------------|-------|----------|---------|----------|----------|
| **New** (< 1 month) | 5-10 | 3-5 | 2-5 | 0-2 | 1 |
| **Medium** (1-6 months) | 20-30 | 10-15 | 10-15 | 3-5 | 2 |
| **Old** (> 6 months) | 50-70 | 30-40 | 20-30 | 10-15 | 3 |

## 🐛 Troubleshooting

### Login Fails

**Error:** `Cookie authentication failed`

**Solutions:**
1. ✅ Get FRESH cookies (logout/login to Twitter first)
2. ✅ Check format (no spaces, 4 values separated by semicolons)
3. ✅ Make sure you copied ALL 4 cookie values
4. ✅ Try from incognito/private window

**Still failing?**
```bash
# Run with visible browser to see what's happening
# Edit .env:
HEADLESS=false
# Then run
node run.js
```

### No Targets Error

**Error:** `At least one target must be provided`

**Solution:**
```env
# Your .env has:
TARGET_TWEETS=
TARGET_USERS=

# Fix: Add at least ONE target
TARGET_USERS=elonmusk,OpenAI
```

### Import Path Errors

**Error:** `Cannot find module '../config/config.js'`

**Solution:** Check `src/actions/*.js` files:
```javascript
// Should be:
import { config } from '../../config/config.js';
// NOT:
import { config } from '../config/config.js';
```

### Cookies Expire

Cookies last 1-3 months. When they expire:

**Symptoms:**
- Bot can't login
- "Authentication failed" error

**Fix:**
1. Get new cookies from browser (same process as setup)
2. Update `.env` with new values
3. Delete old `cookies.json`
4. Run bot again

### Account Locked (Challenge Page)

**What happened:**
Twitter detected unusual activity and locked account.

**Fix:**
1. Open browser manually → Login → Complete verification
2. **IMPORTANT:** Stop bot for 2-3 days
3. When resuming: Lower ALL limits by 50%
4. Monitor carefully

## 📚 Usage Examples

### Example 1: Safe Daily Engagement

**Goal:** Like & retweet from favorite accounts daily (safe for new account)

```env
USE_COOKIES=true
TWITTER_COOKIES=your_cookies_here

AUTO_LIKE=true
AUTO_RETWEET=true
AUTO_COMMENT=false
AUTO_FOLLOW=false

TARGET_USERS=elonmusk,OpenAI
MAX_LIKES_PER_RUN=5
MAX_RETWEETS_PER_RUN=3

DELAY_MIN=7000
DELAY_MAX=15000
HEADLESS=true
```

Run once daily:
```bash
node run.js
```

### Example 2: Growth Strategy

**Goal:** Grow following by engaging with tech community

```env
USE_COOKIES=true
TWITTER_COOKIES=your_cookies_here

AUTO_LIKE=true
AUTO_RETWEET=true
AUTO_FOLLOW=true

TARGET_USERS=github,vercel,nodejs,reactjs,tailwindcss
MAX_LIKES_PER_RUN=10
MAX_RETWEETS_PER_RUN=5
MAX_FOLLOWS_PER_RUN=3

DELAY_MIN=5000
DELAY_MAX=12000
```

Run 2-3 times per day.

### Example 3: Automated Scheduled Run

**Goal:** Bot runs automatically 3x daily

```env
USE_COOKIES=true
TWITTER_COOKIES=your_cookies_here

AUTO_LIKE=true
AUTO_RETWEET=true
AUTO_FOLLOW=true

TARGET_USERS=your,favorite,accounts
MAX_LIKES_PER_RUN=7
MAX_RETWEETS_PER_RUN=4
MAX_FOLLOWS_PER_RUN=2

ENABLE_SCHEDULER=true
SCHEDULE_CRON=0 9,15,21 * * *  # 9am, 3pm, 9pm

HEADLESS=true
```

Start scheduler:
```bash
node run.js
# Bot keeps running and executes at scheduled times
```

## 🔧 Advanced Tips

### Rotate Cookies for Multiple Accounts

Create separate `.env` files:
```bash
.env.account1
.env.account2
```

Run with specific config:
```bash
node run.js --env .env.account1
```

### Use Proxy for Privacy

```env
USE_PROXY=true
PROXY_URL=http://username:password@proxy.com:8080
```

**Recommended:** Residential proxies (not datacenter)

### Enable Debug Logging

```env
LOG_LEVEL=debug
LOG_TO_FILE=true
LOG_FILE_PATH=./logs/bot.log
```

Check logs:
```bash
cat logs/bot.log
```

## 🤝 Contributing

Contributions welcome! Please:

1. Fork repository
2. Create feature branch (`git checkout -b feature/cool-feature`)
3. Commit changes (`git commit -m 'Add cool feature'`)
4. Push branch (`git push origin feature/cool-feature`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## ⚠️ Disclaimer

**For educational purposes only.**

- Use at your own risk
- Author not responsible for account bans
- Twitter may update policies/detection anytime
- Excessive automation = permanent ban
- Always follow Twitter Terms of Service

## 🙏 Credits

- Built with [Puppeteer](https://pptr.dev/)
- Node.js community

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/xeonthol/twitter-bot/issues)
- **Questions:** [Discussions](https://github.com/xeonthol/twitter-bot/discussions)

## 📈 Roadmap

- [ ] Anti-detection improvements
- [ ] Proxy rotation support
- [ ] Web dashboard/GUI
- [ ] Twitter Lists support
- [ ] Analytics & reporting
- [ ] Docker containerization
- [ ] Multi-account manager

---

**⭐ Star this repo if helpful!**

Made with ❤️ by [xeonthol](https://github.com/xeonthol)