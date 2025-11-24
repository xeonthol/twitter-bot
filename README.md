# 🤖 Twitter Automation Bot

A powerful and flexible Twitter automation bot built with Node.js and Puppeteer. Automate likes, retweets, comments, and follows with human-like behavior patterns using cookie-based authentication. **Supports both single and multi-account management!**

[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

## ✨ Features

- 🍪 **Cookie-Based Authentication**
  - Safe and reliable login method
  - No password exposure
  - Automatic cookie persistence
  - One-time manual login setup
  
- 👥 **Multi-Account Support**
  - Manage unlimited accounts
  - Sequential or parallel execution
  - Per-account configuration
  - Enable/disable accounts easily
  
- 🎯 **Automated Actions**
  - ❤️ Like tweets automatically
  - 🔄 Retweet posts
  - 💬 Auto-comment with randomized messages
  - 👥 Follow users
  
- 🛡️ **Safety Features**
  - Configurable action limits per account
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
  - Per-account action tracking
  - Execution summary reports

## 📋 Prerequisites

- **Node.js** v18.0.0 or higher - [Download](https://nodejs.org/)
- **npm** package manager (comes with Node.js)
- A **Twitter/X account** (or multiple accounts)
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

**This is a ONE-TIME setup per account!**

1. **Login to Twitter** in Chrome/Edge browser
2. Open **DevTools** (Press `F12`)
3. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
4. Navigate to **Cookies** → `https://x.com`
5. Find and copy these **4 cookie values**:

| Cookie Name | Description | Example |
|-------------|-------------|---------|
| `auth_token` | Authentication token (long string) | `abc123def456...` |
| `ct0` | CSRF token (very long string) | `xyz789uvw012...` |
| `kdt` | Session token (medium string) | `ghi345rst678...` |
| `twid` | Twitter ID | `u%3D1234567890` |

6. **Format cookies** (important - no spaces!):
```
auth_token=YOUR_VALUE; ct0=YOUR_VALUE; kdt=YOUR_VALUE; twid=YOUR_VALUE
```

⚠️ **Common Mistakes:**
- ❌ `auth_token=your auth_token` (placeholder text)
- ❌ `auth_token= abc123` (space after `=`)
- ❌ `auth_token=abc123 ; ct0=def456` (space before `;`)
- ✅ `auth_token=abc123; ct0=def456; kdt=ghi789; twid=u%3D123` ✅ **CORRECT!**

### Step 3: Choose Setup Mode

#### **Option A: Single Account (Simple)**

For testing or managing just one account:

```bash
# Copy example config
cp .env.example .env

# Edit with your cookies
nano .env
```

Fill in:
```env
USE_COOKIES=true
TWITTER_COOKIES=auth_token=xxx; ct0=yyy; kdt=zzz; twid=www
TARGET_USERS=elonmusk,OpenAI
MAX_LIKES_PER_RUN=5
```

Run:
```bash
node run.js
```

#### **Option B: Multi-Account (Recommended)**

For managing multiple accounts:

```bash
# Copy example config
cp accounts.json.example accounts.json

# Edit with your accounts
nano accounts.json
```

Fill in:
```json
[
  {
    "name": "Account 1",
    "enabled": true,
    "cookies": "auth_token=xxx1; ct0=yyy1; kdt=zzz1; twid=www1",
    "config": {
      "targetUsers": ["elonmusk", "OpenAI"],
      "maxLikesPerRun": 5
    }
  },
  {
    "name": "Account 2",
    "enabled": true,
    "cookies": "auth_token=xxx2; ct0=yyy2; kdt=zzz2; twid=www2",
    "config": {
      "targetUsers": ["github", "vercel"],
      "maxLikesPerRun": 7
    }
  }
]
```

Run:
```bash
# Run accounts one by one (recommended)
node run-multi.js sequential

# Or run all at once (faster but riskier)
node run-multi.js parallel
```

## 📁 Project Structure

```
twitter-bot/
├── src/
│   ├── auth.js              # Cookie authentication handler
│   ├── twitter.js           # Main bot controller
│   ├── actions/
│   │   ├── like.js          # Like functionality
│   │   ├── retweet.js       # Retweet functionality
│   │   ├── comment.js       # Comment functionality
│   │   └── follow.js        # Follow functionality
│   └── scheduler.js         # Cron scheduling
├── utils/
│   ├── logger.js            # Logging system
│   └── helpers.js           # Helper functions
├── config/
│   └── config.js            # Configuration loader
├── .env                     # Single account config (NOT committed)
├── .env.example             # Example configuration
├── accounts.json            # Multi-account config (NOT committed)
├── accounts.json.example    # Multi-account template
├── package.json             # Dependencies
├── run.js                   # Single account mode
├── run-multi.js             # Multi-account mode
└── README.md                # This file
```

## ⚙️ Configuration Reference

### Single Account (`.env`)

```env
# Authentication
USE_COOKIES=true
TWITTER_COOKIES=auth_token=xxx; ct0=yyy; kdt=zzz; twid=www

# Actions
AUTO_LIKE=true
AUTO_RETWEET=true
AUTO_COMMENT=false
AUTO_FOLLOW=true

# Targets (at least one required!)
TARGET_USERS=elonmusk,OpenAI,github
TARGET_TWEETS=

# Limits (adjust based on account age)
MAX_LIKES_PER_RUN=5
MAX_RETWEETS_PER_RUN=3
MAX_COMMENTS_PER_RUN=0
MAX_FOLLOWS_PER_RUN=2

# Behavior
DELAY_MIN=5000
DELAY_MAX=12000
HEADLESS=true
```

### Multi-Account (`accounts.json`)

```json
[
  {
    "name": "Account Name",
    "enabled": true,
    "cookies": "auth_token=xxx; ct0=yyy; kdt=zzz; twid=www",
    "config": {
      "autoLike": true,
      "autoRetweet": true,
      "autoComment": false,
      "autoFollow": true,
      "targetUsers": ["elonmusk", "OpenAI"],
      "targetTweets": [],
      "maxLikesPerRun": 5,
      "maxRetweetsPerRun": 3,
      "maxCommentsPerRun": 0,
      "maxFollowsPerRun": 2,
      "delayMin": 5000,
      "delayMax": 12000,
      "headless": true
    }
  }
]
```

**To add more accounts:** Copy the block above, change cookies and config, paste in the array!

## 🎯 Usage Examples

### Example 1: Single Account Testing

```bash
# Edit .env with your account
nano .env

# Run
node run.js
```

### Example 2: Multiple Accounts Sequential

```bash
# Edit accounts.json
nano accounts.json

# Run one by one (safer)
node run-multi.js sequential
```

Output:
```
🤖 Starting: Account 1
✅ Logged in successfully!
❤️  Starting likes...
  ✓ Liked tweet 1
  ✓ Liked tweet 2
✅ Account 1 completed! (5 actions)

⏳ Waiting 30s before next account...

🤖 Starting: Account 2
...
```

### Example 3: Multiple Accounts Parallel

```bash
# Run all accounts at once (faster) # Semua sekaligus
node run-multi.js parallel
```

### Example 4: Custom Config File

```bash
# Use different config file  # Satu per satu
node run-multi.js sequential --file my-accounts.json
```

### Example 5: Disable Specific Account

In `accounts.json`:
```json
{
  "name": "Account 2",
  "enabled": false,  // ← Set to false to skip
  "cookies": "...",
  "config": { ... }
}
```

## 🛡️ Safety & Best Practices

### ⚠️ CRITICAL: Avoid Account Suspension

Twitter actively detects and bans bot accounts. Follow these rules:

**1. Start Slow**
- New accounts: Max 5 actions per run
- Wait 24-48 hours between first runs
- Don't run bot on brand new accounts

**2. Use Realistic Delays**
- Minimum 5 seconds between actions
- Add randomness (DELAY_MIN/MAX)
- Humans don't like every 2 seconds!

**3. Conservative Limits**

| Account Age | Likes/day | Retweets/day | Follows/day | Runs/day |
|-------------|-----------|--------------|-------------|----------|
| **New** (< 1 month) | 5-10 | 3-5 | 2-5 | 1 |
| **Medium** (1-6 months) | 20-30 | 10-15 | 10-15 | 2 |
| **Old** (> 6 months) | 50-70 | 30-40 | 20-30 | 3-4 |

**4. Multi-Account Strategy**
- Wait 30+ seconds between accounts
- Use sequential mode (safer than parallel)
- Different targets per account
- Stagger run times

**5. Monitor & Respond**
- Check for "suspicious activity" emails
- If locked, STOP immediately
- Wait 48-72 hours before resuming
- Reduce limits by 50%

### 🚨 If Account Gets Locked

1. ✅ Unlock via email/phone verification
2. ⏸️ STOP bot for 2-3 days minimum
3. 🧑 Do manual activity (scroll, read, like)
4. 📉 Cut limits in HALF when resuming
5. 🔍 Monitor for 1 week

## 🔧 Advanced Features

### Sequential vs Parallel Modes

**Sequential Mode (Recommended):**
- ✅ Runs accounts one by one
- ✅ Safer (less suspicious)
- ✅ 30s wait between accounts
- ⏱️ Slower but reliable

```bash
node run-multi.js sequential
```

**Parallel Mode:**
- ⚡ Runs all accounts simultaneously
- ⚠️ More suspicious to Twitter
- ⚡ Faster execution
- ⚠️ Higher risk

```bash
node run-multi.js parallel
```

### Per-Account Configuration

Each account in `accounts.json` can have different:
- Targets (different users/tweets)
- Action limits (some accounts more active)
- Delays (vary behavior patterns)
- Enabled actions (one only likes, another retweets)

Example:
```json
[
  {
    "name": "Conservative Account",
    "config": {
      "targetUsers": ["elonmusk"],
      "maxLikesPerRun": 3,
      "delayMin": 7000,
      "delayMax": 15000
    }
  },
  {
    "name": "Active Account",
    "config": {
      "targetUsers": ["github", "vercel", "nodejs"],
      "maxLikesPerRun": 10,
      "delayMin": 3000,
      "delayMax": 8000
    }
  }
]
```

### Execution Summary

After running multi-account mode, you'll get a summary:

```
📊 EXECUTION SUMMARY
============================================================
Account 1: ✅ SUCCESS (8 actions)
Account 2: ✅ SUCCESS (12 actions)
Account 3: ❌ FAILED
  └─ Error: Cookie authentication failed

Total: 2/3 succeeded
============================================================
```

## 🐛 Troubleshooting

### Multi-Account: "Cannot find accounts.json"

```bash
# Create from template
cp accounts.json.example accounts.json
nano accounts.json
```

### Multi-Account: All Accounts Failing

**Check:**
1. Cookies format (no spaces!)
2. All 4 cookies present (auth_token, ct0, kdt, twid)
3. Accounts are `"enabled": true`
4. Cookies not expired (get fresh ones)

### One Account Works, Others Fail

- Get fresh cookies for failing accounts
- Check if those accounts are locked
- Verify cookie format is identical

### "Login verification failed"

**Solutions:**
1. Get fresh cookies (logout → login → copy cookies)
2. Wait 5 minutes, try again
3. Check Twitter account directly (may be locked)
4. Set `"headless": false` to see what's happening

## 📚 Command Reference

### Single Account

```bash
# Run single account
node run.js

# With visible browser (debugging)
# Edit .env: HEADLESS=false
node run.js
```

### Multi-Account

```bash
# Run all enabled accounts (one by one)
node run-multi.js sequential

# Run all enabled accounts (simultaneously)
node run-multi.js parallel

# Use custom config file
node run-multi.js sequential --file work-accounts.json
node run-multi.js parallel --file personal-accounts.json
```

### Adding New Account

1. Edit `accounts.json`
2. Copy an existing account block
3. Change `name`, `cookies`, and `config`
4. Set `"enabled": true`
5. Save and run

Example:
```json
[
  // Existing accounts...
  {
    "name": "New Account 4",
    "enabled": true,
    "cookies": "auth_token=NEW; ct0=NEW; kdt=NEW; twid=NEW",
    "config": {
      "targetUsers": ["reactjs", "tailwindcss"],
      "maxLikesPerRun": 5
    }
  }
]
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
- Twitter may update policies anytime
- Excessive automation = permanent ban
- Always follow Twitter Terms of Service

## 🙏 Credits

- Built with [Puppeteer](https://pptr.dev/)
- Node.js community

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/xeonthol/twitter-bot/issues)
- **Questions:** [Discussions](https://github.com/xeonthol/twitter-bot/discussions)

## 🗺️ Roadmap

- [x] Cookie-based authentication
- [x] Multi-account support
- [x] Sequential & parallel modes
- [x] Per-account configuration
- [ ] Web dashboard/GUI
- [ ] Proxy rotation
- [ ] Analytics & reporting
- [ ] Docker support
- [ ] Twitter Lists support

---

**⭐ Star this repo if helpful!**

Made with ❤️ by [xeonthol](https://github.com/xeonthol) (https://x.com/xeonthol)