/**
 * Reset password for info@bestofgoa.com
 * Uses Supabase Admin API to bypass email flow
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('âŒ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetPassword() {
  const EMAIL = 'info@bestofgoa.com';
  const NEW_PASSWORD = 'BestOfGoa2026!'; // Temporary password - change after login

  console.log('ðŸ” Looking up user...');

  // Get user by email
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('âŒ Error listing users:', listError);
    return;
  }

  const user = users.users.find(u => u.email === EMAIL);

  if (!user) {
    console.error(`âŒ User not found: ${EMAIL}`);
    console.log('\nðŸ“‹ Available users:');
    users.users.forEach(u => console.log(`  - ${u.email} (${u.id})`));
    return;
  }

  console.log(`âœ… Found user: ${user.email} (ID: ${user.id})`);

  // Update password using admin API
  console.log('\nðŸ” Resetting password...');

  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: NEW_PASSWORD }
  );

  if (error) {
    console.error('âŒ Error updating password:', error);
    return;
  }

  console.log('\nâœ… Password reset successful!');
  console.log('\nðŸ“§ Email:', EMAIL);
  console.log('ðŸ”‘ Temporary Password:', NEW_PASSWORD);
  console.log('\nâš ï¸  IMPORTANT: Change this password after logging in!');
  console.log('   Go to: https://www.bestofgoa.com/login');
}

resetPassword().catch(console.error);
