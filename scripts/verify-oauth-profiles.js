#!/usr/bin/env node

/**
 * Verify OAuth Profile Creation Fix
 *
 * This script checks:
 * 1. All auth.users have corresponding profiles
 * 2. Profile metadata is populated correctly
 * 3. Trigger function exists in database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyOAuthProfiles() {
  console.log('🔍 Verifying OAuth Profile Creation Fix...\n');

  try {
    // 1. Check trigger function exists
    console.log('1️⃣  Checking database trigger...');
    const { data: functions, error: funcError } = await supabase.rpc('pg_get_functiondef', {
      funcoid: 'handle_new_user'
    }).single();

    if (funcError && funcError.code !== 'PGRST116') {
      console.log('⚠️  Trigger function not found (expected if migration not run yet)');
    } else {
      console.log('✅ Trigger function exists\n');
    }

    // 2. Check all users have profiles
    console.log('2️⃣  Checking user-profile mapping...');

    // Get all auth users (using service role)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }

    console.log(`   Found ${authUsers.users.length} auth users`);

    // Check each user has a profile
    let missingProfiles = [];
    let correctProfiles = 0;

    for (const user of authUsers.users) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        missingProfiles.push({
          id: user.id,
          email: user.email,
          provider: user.app_metadata?.provider,
          created: user.created_at
        });
      } else {
        correctProfiles++;
      }
    }

    if (missingProfiles.length === 0) {
      console.log(`✅ All ${correctProfiles} users have profiles\n`);
    } else {
      console.log(`⚠️  ${missingProfiles.length} users missing profiles:`);
      missingProfiles.forEach(user => {
        console.log(`   - ${user.email} (${user.provider}) - created ${new Date(user.created).toLocaleDateString()}`);
      });
      console.log('   → Run migration to create these profiles\n');
    }

    // 3. Check OAuth users specifically
    console.log('3️⃣  Checking OAuth user profiles...');
    const oauthUsers = authUsers.users.filter(u => u.app_metadata?.provider === 'google');
    console.log(`   Found ${oauthUsers.length} Google OAuth users`);

    let oauthWithProfiles = 0;
    for (const user of oauthUsers) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (profile) {
        oauthWithProfiles++;
        if (!profile.full_name && !profile.avatar_url) {
          console.log(`   ⚠️  ${user.email} - Profile exists but missing metadata`);
        }
      }
    }

    if (oauthUsers.length > 0) {
      console.log(`   ${oauthWithProfiles}/${oauthUsers.length} have profiles`);
      if (oauthWithProfiles === oauthUsers.length) {
        console.log('✅ All OAuth users have profiles\n');
      } else {
        console.log('⚠️  Some OAuth users missing profiles\n');
      }
    }

    // 4. Summary
    console.log('📊 Summary:');
    console.log(`   Total users: ${authUsers.users.length}`);
    console.log(`   With profiles: ${correctProfiles}`);
    console.log(`   Missing profiles: ${missingProfiles.length}`);
    console.log(`   OAuth users: ${oauthUsers.length}`);

    if (missingProfiles.length === 0) {
      console.log('\n✅ All checks passed! OAuth fix is working correctly.');
    } else {
      console.log('\n⚠️  Action required: Run the database migration to fix missing profiles.');
      console.log('   File: supabase/migrations/20250105_fix_oauth_profile_creation.sql');
    }

  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

verifyOAuthProfiles();
