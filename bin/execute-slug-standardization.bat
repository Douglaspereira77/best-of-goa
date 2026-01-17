@echo off
REM ============================================================================
REM Cuisine Slug Standardization - Automated Execution Script (Windows)
REM ============================================================================
REM
REM Purpose: Standardize all cuisine slugs in one command
REM Usage: bin\execute-slug-standardization.bat
REM Date: 2025-11-06
REM
REM ============================================================================

echo ======================================
echo CUISINE SLUG STANDARDIZATION
echo ======================================
echo.

REM Step 1: Preview database changes
echo Step 1: Previewing database changes...
echo.
echo SQL Query to run in Supabase SQL Editor:
echo.
echo SELECT
echo   id,
echo   name,
echo   slug AS old_slug,
echo   REPLACE(slug, '-restaurants', '') AS new_slug,
echo   CASE
echo     WHEN slug LIKE '%%%-restaurants' THEN 'WILL CHANGE'
echo     ELSE 'NO CHANGE'
echo   END AS status
echo FROM restaurant_cuisines
echo ORDER BY name;
echo.
echo WARNING: Review the preview before proceeding!
echo.
pause
echo.

REM Step 2: Execute migration
echo Step 2: Ready to execute migration...
echo.
echo SQL Update to run:
echo.
echo UPDATE restaurant_cuisines
echo SET slug = REPLACE(slug, '-restaurants', '')
echo WHERE slug LIKE '%%%-restaurants';
echo.
pause
echo.

REM Step 3: Verify TypeScript compilation
echo Step 3: Running TypeScript type check...
call npm run type-check
if errorlevel 1 (
    echo ERROR: TypeScript type check failed!
    pause
    exit /b 1
)
echo TypeScript type check passed
echo.

REM Step 4: Run linter
echo Step 4: Running ESLint...
call npm run lint
if errorlevel 1 (
    echo ERROR: Linting failed!
    pause
    exit /b 1
)
echo Linting passed
echo.

REM Step 5: Test local dev server
echo Step 5: Testing development server...
echo.
echo Commands to run manually in a new terminal:
echo   1. npm run dev
echo   2. Test these URLs:
echo      - http://localhost:3000/places-to-eat/japanese
echo      - http://localhost:3000/places-to-eat/italian
echo      - http://localhost:3000/places-to-eat/asian-fusion
echo      - http://localhost:3000/places-to-eat/goai
echo.
pause
echo.

REM Step 6: Production build test
echo Step 6: Testing production build...
call npm run build
if errorlevel 1 (
    echo ERROR: Production build failed!
    pause
    exit /b 1
)
echo Production build successful
echo.

REM Step 7: Git commit
echo Step 7: Ready to commit changes...
echo.
echo Modified files:
git status --short
echo.
set /p commit_confirm="Commit these changes? (y/n): "

if /i "%commit_confirm%"=="y" (
    git add .
    git commit -m "Standardize cuisine slugs to clean URLs (pre-launch)" -m "" -m "- Remove '-restaurants' suffix from 10 cuisine slugs" -m "- Update generateStaticParams() to include all 14 cuisines" -m "- Add standardization SQL script and documentation" -m "- SEO optimization: cleaner URLs for better keyword targeting" -m "- No redirects needed (pre-launch migration)" -m "" -m "Affected slugs:" -m "- japanese-restaurants to japanese" -m "- italian-restaurants to italian" -m "- american-restaurants to american" -m "- indian-restaurants to indian" -m "- chinese-restaurants to chinese" -m "- middle-eastern-restaurants to middle-eastern" -m "- mexican-restaurants to mexican" -m "- thai-restaurants to thai" -m "- lebanese-restaurants to lebanese" -m "- french-restaurants to french" -m "" -m "Files changed:" -m "- bin/standardize-cuisine-slugs.sql (new)" -m "- docs/CUISINE_SLUG_STANDARDIZATION.md (new)" -m "- src/app/places-to-eat/[cuisine]/page.tsx (updated)"

    echo Changes committed
    echo.

    set /p push_confirm="Push to GitHub? (y/n): "
    if /i "%push_confirm%"=="y" (
        git push origin main
        echo Changes pushed to GitHub
        echo.
        echo Vercel will auto-deploy. Monitor: https://vercel.com/dashboard
    )
) else (
    echo Skipping commit.
)

echo.
echo ======================================
echo STANDARDIZATION COMPLETE
echo ======================================
echo.
echo Next steps:
echo   1. Monitor Vercel deployment
echo   2. Test live URLs after deployment
echo   3. Verify schema.org markup (Google Rich Results Test)
echo   4. Check Google Search Console (after indexing)
echo.
echo Documentation: docs/CUISINE_SLUG_STANDARDIZATION.md
echo.
pause
