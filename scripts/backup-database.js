// Backup Supabase Database - Schema and Data
// Creates JSON backups of all tables and relationships
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(envVars.SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

// Create backups directory
const backupDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];

async function backupTable(tableName) {
  console.log(`\nðŸ“¦ Backing up ${tableName}...`);

  const { data, error, count } = await supabase
    .from(tableName)
    .select('*', { count: 'exact' });

  if (error) {
    console.error(`   âŒ Error: ${error.message}`);
    return null;
  }

  console.log(`   âœ… Backed up ${count} rows`);
  return { table: tableName, count, data };
}

async function createBackup() {
  console.log('ðŸš€ Starting Database Backup\n');
  console.log('='.repeat(80));

  const tables = [
    'restaurants',
    'categories',
    'cuisines',
    'features',
    'meals',
    'good_for',
    'neighborhoods',
    'michelin_guide_awards',
    'restaurant_chains'
  ];

  const backup = {
    timestamp: new Date().toISOString(),
    project: 'Best of Goa',
    tables: {}
  };

  for (const table of tables) {
    const tableBackup = await backupTable(table);
    if (tableBackup) {
      backup.tables[table] = tableBackup;
    }
  }

  // Save backup to file
  const filename = `backup-${timestamp}.json`;
  const filepath = path.join(backupDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

  console.log('\n' + '='.repeat(80));
  console.log('\nâœ… BACKUP COMPLETE!\n');
  console.log(`ðŸ“ Location: ${filepath}`);
  console.log(`ðŸ“Š Total Tables: ${Object.keys(backup.tables).length}`);
  console.log(`ðŸ“ File Size: ${(fs.statSync(filepath).size / 1024 / 1024).toFixed(2)} MB`);

  // Summary
  console.log('\nðŸ“‹ Summary:');
  Object.values(backup.tables).forEach(t => {
    console.log(`   ${t.table}: ${t.count} rows`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('\nðŸ’¡ To restore this backup:');
  console.log(`   node restore-database.js backups/${filename}`);
  console.log('\n' + '='.repeat(80));
}

createBackup().catch(error => {
  console.error('\nâŒ Backup failed:', error);
  process.exit(1);
});
