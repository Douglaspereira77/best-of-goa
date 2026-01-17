#!/usr/bin/env node

/**
 * Best of Goa - Reference Data Seeding Runner
 * 
 * This script runs the reference data seeding SQL script
 * and verifies that all data was seeded successfully.
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('âŒ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runSeeding() {
  log('ðŸŒ± Starting Reference Data Seeding', 'bold');
  log('=' .repeat(60), 'blue');
  
  try {
    // Read the SQL file
    log('\nðŸ“– Reading seed-reference-data.sql...', 'blue');
    const sql = fs.readFileSync('seed-reference-data.sql', 'utf-8');
    
    // Split into individual statements (simple split by semicolon)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
    
    log(`Found ${statements.length} SQL statements to execute\n`, 'blue');
    
    // Execute each statement
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and DO blocks (they need special handling)
      if (statement.startsWith('DO $$') || statement.includes('RAISE NOTICE')) {
        log(`[${i + 1}/${statements.length}] Skipping DO block\n`, 'yellow');
        continue;
      }
      
      log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 60)}...`, 'blue');
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Some errors are expected (like "already exists")
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist') ||
              error.message.includes('relation') && error.message.includes('already exists')) {
            log(`  âš ï¸  Warning: ${error.message}`, 'yellow');
          } else {
            log(`  âŒ Error: ${error.message}`, 'red');
            errorCount++;
          }
        } else {
          log(`  âœ… Success`, 'green');
          successCount++;
        }
      } catch (err) {
        log(`  âŒ Error: ${err.message}`, 'red');
        errorCount++;
      }
      console.log('');
    }
    
    log('\nðŸ“Š EXECUTION RESULTS', 'bold');
    log('=' .repeat(60), 'blue');
    log(`âœ… Successful statements: ${successCount}`, 'green');
    log(`âŒ Failed statements: ${errorCount}`, errorCount > 0 ? 'red' : 'green');
    
    // Verify seeding results
    log('\nðŸ” Verifying seeded data...', 'blue');
    await verifySeeding();
    
  } catch (error) {
    log(`\nâŒ Seeding failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

async function verifySeeding() {
  const tables = [
    { name: 'restaurants_cuisines', expected: 20, description: 'Cuisines' },
    { name: 'restaurants_categories', expected: 10, description: 'Categories' },
    { name: 'restaurants_features', expected: 20, description: 'Features' },
    { name: 'restaurants_meals', expected: 6, description: 'Meals' },
    { name: 'restaurants_good_for', expected: 12, description: 'Good For' },
    { name: 'restaurants_dish_types', expected: 15, description: 'Dish Types' }
  ];
  
  let allPassed = true;
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table.name)
        .select('*');
      
      if (error) {
        log(`âŒ ${table.description}: ${error.message}`, 'red');
        allPassed = false;
      } else {
        const count = data ? data.length : 0;
        const status = count >= table.expected ? 'âœ…' : 'âš ï¸';
        const color = count >= table.expected ? 'green' : 'yellow';
        
        log(`${status} ${table.description}: ${count} records (expected: ${table.expected}+)`, color);
        
        if (count < table.expected) {
          allPassed = false;
        }
      }
    } catch (err) {
      log(`âŒ ${table.description}: ${err.message}`, 'red');
      allPassed = false;
    }
  }
  
  log('\n' + '=' .repeat(60), 'blue');
  
  if (allPassed) {
    log('ðŸŽ‰ ALL REFERENCE DATA SEEDED SUCCESSFULLY!', 'green');
    log('\nNext steps:', 'blue');
    log('1. Create the data mapper service');
    log('2. Test with sample restaurant data');
    log('3. Verify Anthropic API integration');
  } else {
    log('âš ï¸  SOME DATA MAY BE MISSING! Please check the results above.', 'yellow');
    log('\nTroubleshooting:', 'blue');
    log('1. Check if the SQL script ran completely');
    log('2. Verify database permissions');
    log('3. Check for any error messages in the execution');
  }
  
  return allPassed;
}

// Run the seeding
runSeeding()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    log(`âŒ Seeding failed with error: ${error.message}`, 'red');
    process.exit(1);
  });




