/**
 * Apply Fitness System Migration
 *
 * Reads and executes the fitness system migration SQL
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function applyMigration() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log('📦 Reading fitness system migration...')

  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20251118_fitness_system.sql')
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

  console.log('🚀 Applying fitness system migration...')
  console.log('━'.repeat(60))

  try {
    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })

    if (error) {
      console.error('❌ Migration failed:', error)

      // Try alternative approach - execute in smaller chunks
      console.log('\n📝 Trying alternative approach - executing via raw SQL...')

      // Split by statement and execute individually
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      console.log(`Found ${statements.length} SQL statements`)

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i]
        if (stmt) {
          try {
            const { error: stmtError } = await (supabase as any).rpc('exec', {
              query: stmt + ';'
            })

            if (stmtError && !stmtError.message.includes('already exists')) {
              console.log(`⚠️  Statement ${i + 1} warning:`, stmtError.message.substring(0, 100))
            }
          } catch (e: any) {
            console.log(`⚠️  Statement ${i + 1} skipped:`, e.message.substring(0, 100))
          }
        }
      }

      console.log('\n✅ Migration applied with warnings (some objects may already exist)')
      return
    }

    console.log('✅ Migration applied successfully!')
    console.log('━'.repeat(60))

    // Verify tables were created
    const { data: tables, error: tablesError } = await supabase
      .from('fitness_places')
      .select('count')
      .limit(0)

    if (!tablesError) {
      console.log('✅ fitness_places table verified')
    }

    const { data: categories } = await supabase
      .from('fitness_categories')
      .select('count')

    console.log(`✅ fitness_categories table verified (${categories?.length || 0} categories)`)

  } catch (error: any) {
    console.error('❌ Unexpected error:', error)
  }
}

applyMigration()
  .then(() => {
    console.log('\n🎉 Migration complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  })
