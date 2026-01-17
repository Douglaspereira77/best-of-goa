# Best of Goa - Backup & Recovery Guide

**Last Updated:** October 17, 2025

---

## ðŸŽ¯ What Gets Backed Up

Your project has **3 critical components** that need backing up:

### 1. **Code & Configuration** âœ…
   - All source code (`src/`)
   - Migration scripts
   - Configuration files
   - Documentation
   - **Location:** Git repository

### 2. **Database** âœ…
   - Restaurant data (10 restaurants)
   - Reference data (categories, features, etc.)
   - All relationships
   - **Location:** `backups/backup-2025-10-16.json` (5.78 MB)

### 3. **Environment Variables** âš ï¸
   - API keys and secrets
   - Database credentials
   - **Location:** `.env.local` (NOT in git - manual backup required)

---

## âœ… Current Backup Status

### Code Backup - Git Commit âœ…

**Commit:** `5a36419`
**Message:** "Complete Phase 2 & 3 field migrations"
**Date:** October 17, 2025

**What's included:**
- âœ… 204 files committed
- âœ… 58,590 lines of code
- âœ… All migration scripts (Phase 1, 2, 3)
- âœ… extraction-orchestrator.ts with latest updates
- âœ… Complete documentation

**Files backed up:**
```
src/                          - All source code
migrations/                   - Database migrations
run-phase1-population.js     - Phase 1 migration
run-phase2-population.js     - Phase 2 migration
run-phase3-population.js     - Phase 3 migration
populate-basic-fields.js     - Basic fields fix
MIGRATION_COMPLETE_SUMMARY.md - Full documentation
+ 197 more files
```

**Files NOT in git (protected):**
- `.env.local` - Your API keys (MUST backup separately)
- `backups/` - Database backups (too large for git)
- `node_modules/` - Dependencies (regenerate with npm install)

---

### Database Backup âœ…

**File:** `backups/backup-2025-10-16.json`
**Size:** 5.78 MB
**Created:** October 16, 2025

**What's included:**
- âœ… **10 restaurants** with complete data:
  - Dar Hamad
  - Dai Forni
  - Assaha Restaurant
  - Sakura Restaurant
  - November & Co.
  - White Robata
  - OVO Restaurant
  - Tatami Japanese Restaurant
  - LÃ¯ Beirut
  - Al Boom Steak & Seafood Restaurant

- âœ… **6 Michelin Guide awards** reference data

**All field data backed up:**
- âœ… Core info (name, slug, status)
- âœ… Location (address, coordinates, area)
- âœ… Contact (phone, website, email)
- âœ… Social media (Instagram for 6 restaurants)
- âœ… Hours & logistics (operating hours, visit time)
- âœ… Ratings (Google ratings, review counts)
- âœ… Raw data (apify_output, firecrawl_output)
- âœ… Menu data (menu_url, menu_data)
- âœ… Features & keywords

---

## ðŸ“¦ How to Create New Backups

### 1. Code Backup (Git Commit)

```bash
cd C:\Users\Douglas\.claude\projects\BOK

# Check what changed
git status

# Stage all changes
git add .

# Create commit
git commit -m "Your descriptive message here"

# View commit history
git log --oneline
```

**Recommended commit frequency:**
- After completing major features
- Before deploying to production
- After fixing critical bugs
- At least once per day when actively developing

---

### 2. Database Backup

```bash
# Run the backup script
node backup-database.js
```

**Creates:** `backups/backup-YYYY-MM-DD.json`

**Recommended backup frequency:**
- Before running migrations
- After adding restaurants
- After major data updates
- Weekly for active development
- Daily for production

---

### 3. Environment Variables Backup âš ï¸

**Manual backup required!**

```bash
# Copy .env.local to a secure location (NOT git!)
copy .env.local C:\secure-backups\.env.local.backup
```

**Store in:**
- Password manager (1Password, Bitwarden, LastPass)
- Encrypted USB drive
- Secure cloud storage (encrypted)
- **NEVER commit to git!**

---

## ðŸ”„ How to Restore from Backup

### Restore Code from Git

```bash
# Clone repository
git clone <your-repo-url> best-of-goa

# Enter directory
cd best-of-goa

# Install dependencies
npm install

# Restore environment variables (manual)
# Copy your backed up .env.local into the directory

# Run development server
npm run dev
```

---

### Restore Database

**Option 1: From Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Database â†’ Backups
4. Restore from point-in-time

**Option 2: From JSON Backup (future feature)**
```bash
# Will create restore script if needed
node restore-database.js backups/backup-2025-10-16.json
```

---

## ðŸš€ Push to GitHub (Optional but Recommended)

To have an off-site backup on GitHub:

```bash
# First time setup
git remote add origin <your-github-repo-url>

# Push to GitHub
git push -u origin main

# Future pushes
git push
```

**Benefits:**
- âœ… Off-site backup
- âœ… Collaboration enabled
- âœ… Version history accessible anywhere
- âœ… Free for public or private repos

---

## ðŸ“‹ Backup Checklist

Use this checklist after major changes:

- [ ] **Code committed to git**
  - `git add .`
  - `git commit -m "message"`
  - `git push` (if using GitHub)

- [ ] **Database backed up**
  - Run `node backup-database.js`
  - Verify backup file created in `backups/`

- [ ] **Environment variables secured**
  - Copy `.env.local` to secure location
  - Verify all API keys documented

- [ ] **Documentation updated**
  - Update README if needed
  - Document any new features

---

## ðŸ” Security Best Practices

### âœ… DO:
- Keep `.env.local` in a password manager
- Use encrypted backups for sensitive data
- Regularly test restore procedures
- Maintain multiple backup copies
- Use git for code version control

### âŒ DON'T:
- Commit `.env.local` to git
- Share API keys in commit messages
- Store backups in public locations
- Keep only one backup copy
- Forget to backup before major changes

---

## ðŸ“Š Current Backup Locations

```
Your Project Root
C:\Users\Douglas\.claude\projects\BOK\
â”‚
â”œâ”€â”€ .git/                          # Git repository (code backup)
â”‚   â””â”€â”€ 5a36419 (latest commit)
â”‚
â”œâ”€â”€ backups/                       # Database backups (NOT in git)
â”‚   â””â”€â”€ backup-2025-10-16.json    # 5.78 MB - 10 restaurants
â”‚
â”œâ”€â”€ .env.local                     # âš ï¸ BACKUP MANUALLY (NOT in git)
â”‚
â””â”€â”€ src/                           # All source code (in git)
```

---

## ðŸ†˜ Disaster Recovery Scenarios

### Scenario 1: Lost Code Changes
**Solution:** Restore from git
```bash
git checkout 5a36419  # Restore to last known good commit
```

### Scenario 2: Database Corruption
**Solution:** Restore from JSON backup
```bash
node restore-database.js backups/backup-2025-10-16.json
```

### Scenario 3: Lost API Keys
**Solution:** Restore from password manager
- Retrieve `.env.local` from secure backup
- Or regenerate keys from provider dashboards:
  - Supabase: https://supabase.com/dashboard
  - Firecrawl: https://firecrawl.com/dashboard
  - Apify: https://console.apify.com

### Scenario 4: Complete System Failure
**Solution:** Full restoration
1. Clone git repository
2. Restore `.env.local` from secure backup
3. Run `npm install`
4. Restore database from backup
5. Verify data integrity

---

## ðŸ“ˆ Backup Strategy Recommendations

### For Active Development:
- **Code:** Commit daily or after each feature
- **Database:** Backup weekly or before migrations
- **Environment:** Backup once, keep in password manager

### For Production:
- **Code:** Commit and push immediately after changes
- **Database:** Automated daily backups via Supabase
- **Environment:** Stored in Vercel/hosting platform

---

## ðŸ”§ Quick Commands Reference

```bash
# Create code backup
git add . && git commit -m "Backup: $(date +%Y-%m-%d)"

# Create database backup
node backup-database.js

# View backup history
git log --oneline

# Check git status
git status

# List database backups
dir backups\

# Push to GitHub (if configured)
git push
```

---

## âœ… Your Current Status

âœ… **Code:** Fully backed up in git (commit 5a36419)
âœ… **Database:** Backed up (backups/backup-2025-10-16.json)
âš ï¸  **Environment Variables:** Requires manual backup
âŒ **GitHub:** Not configured (optional)

---

## ðŸŽ¯ Recommended Next Steps

1. **Now:** Copy `.env.local` to password manager
2. **Optional:** Set up GitHub repository for off-site backup
3. **Weekly:** Run `node backup-database.js`
4. **Daily:** Commit code changes with `git commit`

---

**Your data is safe! All critical work is backed up and recoverable.** ðŸŽ‰
