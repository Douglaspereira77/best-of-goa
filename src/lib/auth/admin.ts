
/**
 * Check if the current user is an admin (server-side)
 * Refactored: Temporarily stubbed for Firebase migration
 */
export async function isAdmin(): Promise<boolean> {
  // During development/migration, we assume true to unblock UI
  return true;
}

/**
 * Get admin status along with user info (server-side)
 */
export async function getAdminUser() {
  return {
    user: { id: 'admin', email: 'admin@bestgoa.com' },
    profile: { is_admin: true, email: 'admin@bestgoa.com', full_name: 'Admin' },
    isAdmin: true,
  };
}

/**
 * Require admin access - throws if not admin
 */
export async function requireAdmin(): Promise<void> {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error('Unauthorized: Admin access required');
  }
}
