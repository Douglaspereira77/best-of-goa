import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function applyMigration() {
  console.log('=' .repeat(80))
  console.log('APPLYING ADVANCED RATING SYSTEM MIGRATION')
  console.log('=' .repeat(80))
  console.log()

  const sql = fs.readFileSync(
    join(__dirname, '..', 'supabase', 'migrations', '20251113_advanced_rating_system.sql'),
    'utf8'
  )

  console.log('Migration SQL:')
  console.log(sql)
  console.log()
  console.log('=' .repeat(80))
  console.log()

  // Split SQL into individual statements and execute
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`Executing ${statements.length} SQL statements...`)
  console.log()

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';'

    // Skip if it's just a comment
    if (statement.trim().startsWith('--')) continue

    console.log(`[${i + 1}/${statements.length}] Executing...`)

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement })

      if (error) {
        // Try direct execution for DDL statements
        console.log(`   Trying direct execution...`)
        // Note: Supabase JS client doesn't support DDL directly
        // We'll need to use SQL editor or PostgREST
        console.log(`   ⚠️  Please run this statement manually in Supabase SQL Editor:`)
        console.log(`   ${statement.substring(0, 100)}...`)
      } else {
        console.log(`   ✅ Success`)
      }
    } catch (err) {
      console.log(`   ⚠️  ${err.message}`)
      console.log(`   Statement: ${statement.substring(0, 100)}...`)
    }

    console.log()
  }

  console.log('=' .repeat(80))
  console.log('MIGRATION INSTRUCTIONS:')
  console.log('=' .repeat(80))
  console.log()
  console.log('Since Supabase JS client cannot execute DDL, please:')
  console.log()
  console.log('1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql')
  console.log('2. Copy the SQL from: supabase/migrations/20251113_advanced_rating_system.sql')
  console.log('3. Paste and run in the SQL Editor')
  console.log()
  console.log('OR run using Supabase CLI if you have it installed:')
  console.log('   npx supabase db push')
  console.log()
}

applyMigration().catch(console.error)
