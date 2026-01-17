#!/bin/bash
# ============================================================================
# Cuisine Slug Standardization - Automated Execution Script
# ============================================================================
#
# Purpose: Standardize all cuisine slugs in one command
# Usage: bash bin/execute-slug-standardization.sh
# Date: 2025-11-06
#
# ============================================================================

set -e  # Exit on error

echo "======================================"
echo "CUISINE SLUG STANDARDIZATION"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Preview database changes
echo -e "${YELLOW}Step 1: Previewing database changes...${NC}"
echo ""
echo "SQL Query to run in Supabase SQL Editor:"
echo ""
echo "SELECT"
echo "  id,"
echo "  name,"
echo "  slug AS old_slug,"
echo "  REPLACE(slug, '-restaurants', '') AS new_slug,"
echo "  CASE"
echo "    WHEN slug LIKE '%-restaurants' THEN 'WILL CHANGE'"
echo "    ELSE 'NO CHANGE'"
echo "  END AS status"
echo "FROM restaurant_cuisines"
echo "ORDER BY name;"
echo ""
echo -e "${RED}âš ï¸  IMPORTANT: Review the preview before proceeding!${NC}"
echo ""
read -p "Press Enter after verifying the preview in Supabase..."
echo ""

# Step 2: Execute migration
echo -e "${YELLOW}Step 2: Ready to execute migration...${NC}"
echo ""
echo "SQL Update to run:"
echo ""
echo "UPDATE restaurant_cuisines"
echo "SET slug = REPLACE(slug, '-restaurants', '')"
echo "WHERE slug LIKE '%-restaurants';"
echo ""
read -p "Press Enter to confirm you've executed this in Supabase..."
echo ""

# Step 3: Verify TypeScript compilation
echo -e "${YELLOW}Step 3: Running TypeScript type check...${NC}"
npm run type-check
echo -e "${GREEN}âœ… TypeScript type check passed${NC}"
echo ""

# Step 4: Run linter
echo -e "${YELLOW}Step 4: Running ESLint...${NC}"
npm run lint
echo -e "${GREEN}âœ… Linting passed${NC}"
echo ""

# Step 5: Test local dev server
echo -e "${YELLOW}Step 5: Testing development server...${NC}"
echo ""
echo "Commands to run manually:"
echo "  1. npm run dev"
echo "  2. Test these URLs:"
echo "     - http://localhost:3000/places-to-eat/japanese"
echo "     - http://localhost:3000/places-to-eat/italian"
echo "     - http://localhost:3000/places-to-eat/asian-fusion"
echo "     - http://localhost:3000/places-to-eat/goai"
echo ""
read -p "Press Enter after testing dev server..."
echo ""

# Step 6: Production build test
echo -e "${YELLOW}Step 6: Testing production build...${NC}"
npm run build
echo -e "${GREEN}âœ… Production build successful${NC}"
echo ""

# Step 7: Verify static generation
echo -e "${YELLOW}Step 7: Verifying static page generation...${NC}"
echo "Check .next/server/app/places-to-eat/ directory for pre-rendered pages"
echo ""
if [ -d ".next/server/app/places-to-eat" ]; then
  echo "Generated pages:"
  ls -la .next/server/app/places-to-eat/ 2>/dev/null || echo "Directory structure may vary"
  echo ""
fi

# Step 8: Git commit
echo -e "${YELLOW}Step 8: Ready to commit changes...${NC}"
echo ""
echo "Modified files:"
git status --short
echo ""
read -p "Commit these changes? (y/n): " commit_confirm

if [ "$commit_confirm" = "y" ] || [ "$commit_confirm" = "Y" ]; then
  git add .
  git commit -m "Standardize cuisine slugs to clean URLs (pre-launch)

- Remove '-restaurants' suffix from 10 cuisine slugs
- Update generateStaticParams() to include all 14 cuisines
- Add standardization SQL script and documentation
- SEO optimization: cleaner URLs for better keyword targeting
- No redirects needed (pre-launch migration)

Affected slugs:
- japanese-restaurants â†’ japanese
- italian-restaurants â†’ italian
- american-restaurants â†’ american
- indian-restaurants â†’ indian
- chinese-restaurants â†’ chinese
- middle-eastern-restaurants â†’ middle-eastern
- mexican-restaurants â†’ mexican
- thai-restaurants â†’ thai
- lebanese-restaurants â†’ lebanese
- french-restaurants â†’ french

Files changed:
- bin/standardize-cuisine-slugs.sql (new)
- docs/CUISINE_SLUG_STANDARDIZATION.md (new)
- src/app/places-to-eat/[cuisine]/page.tsx (updated)"

  echo -e "${GREEN}âœ… Changes committed${NC}"
  echo ""

  read -p "Push to GitHub? (y/n): " push_confirm
  if [ "$push_confirm" = "y" ] || [ "$push_confirm" = "Y" ]; then
    git push origin main
    echo -e "${GREEN}âœ… Changes pushed to GitHub${NC}"
    echo ""
    echo "Vercel will auto-deploy. Monitor: https://vercel.com/dashboard"
  fi
else
  echo "Skipping commit."
fi

echo ""
echo "======================================"
echo -e "${GREEN}âœ… STANDARDIZATION COMPLETE${NC}"
echo "======================================"
echo ""
echo "Next steps:"
echo "  1. Monitor Vercel deployment"
echo "  2. Test live URLs after deployment"
echo "  3. Verify schema.org markup (Google Rich Results Test)"
echo "  4. Check Google Search Console (after indexing)"
echo ""
echo "Documentation: docs/CUISINE_SLUG_STANDARDIZATION.md"
echo ""
