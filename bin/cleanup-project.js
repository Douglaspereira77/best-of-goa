#!/usr/bin/env node

/**
 * Project Cleanup Script
 * Moves obsolete scripts and files to archive directories
 */

const fs = require('fs');
const path = require('path');

// Scripts to keep (essential/active)
const KEEP_SCRIPTS = [
  'extract-from-csv-direct.js',
  'find-incomplete-restaurants.js',
  'delete-incomplete-restaurants.js',
  'check-enhancement-status.js',
  'batch-enhance-all.js',
  'ai-enhance-only.js',
  'cleanup-project.js',  // This script itself
  'README_EXTRACTION_SCRIPTS.md'
];

// Move files to archive
function moveToArchive(sourcePattern, destDir) {
  const files = fs.readdirSync('bin').filter(f => f.match(sourcePattern));
  let moved = 0;

  files.forEach(file => {
    if (!KEEP_SCRIPTS.includes(file)) {
      const source = path.join('bin', file);
      const dest = path.join('bin', 'archive', destDir, file);

      try {
        if (fs.existsSync(source) && !fs.existsSync(dest)) {
          fs.renameSync(source, dest);
          moved++;
        }
      } catch (err) {
        console.error(`Error moving ${file}:`, err.message);
      }
    }
  });

  return moved;
}

console.log('🧹 PROJECT CLEANUP\n');
console.log('═══════════════════════════════════════════════════════════\n');

// Diagnostic scripts
console.log('📦 Moving diagnostic scripts...');
let count = moveToArchive(/^(check|debug|verify|validate|analyze|audit|compare|find|list|view|search|scrape)-.*\.js$/, 'diagnostics');
console.log(`   Moved ${count} files to bin/archive/diagnostics/\n`);

// Fix scripts
console.log('📦 Moving fix/migration scripts...');
count = moveToArchive(/^(fix|migrate|run|retry|rerun|populate|add|update|trigger|batch|execute)-.*\.js$/, 'fixes');
console.log(`   Moved ${count} files to bin/archive/fixes/\n`);

// Extraction scripts
console.log('📦 Moving extraction scripts...');
count = moveToArchive(/^extract-(images|restaurant|khaneen|tripadvisor).*\.js$/, 'obsolete');
console.log(`   Moved ${count} files to bin/archive/obsolete/\n`);

console.log('═══════════════════════════════════════════════════════════');
console.log('✅ CLEANUP COMPLETE\n');

console.log('📊 Scripts remaining in bin/:');
const remaining = fs.readdirSync('bin').filter(f => f.endsWith('.js') || f.endsWith('.md'));
remaining.forEach(f => console.log(`   - ${f}`));

console.log('\n💡 Archive directories:');
console.log('   - bin/archive/diagnostics/');
console.log('   - bin/archive/fixes/');
console.log('   - bin/archive/obsolete/\n');
