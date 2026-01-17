/**
 * Test Redirects Locally
 *
 * This script verifies that all redirects work correctly
 * Run after: npm run dev
 */

const testUrls = [
  // Restaurant slug redirects
  { from: '/places-to-eat/restaurants/Misk.kwt', to: '/places-to-eat/restaurants/misk-restaurant-salmiya' },
  { from: '/places-to-eat/restaurants/BenihanaGoa', to: '/places-to-eat/restaurants/benihana-sabah-al-salem' },
  { from: '/places-to-eat/restaurants/ovokwt', to: '/places-to-eat/restaurants/ovo-restaurant-bnied-al-gar' },
  { from: '/places-to-eat/restaurants/sabaideegroup', to: '/places-to-eat/restaurants/sabaidee-thai-restaurant-mahboula' },
  { from: '/places-to-eat/restaurants/chinagreatwallrest', to: '/places-to-eat/restaurants/china-great-wall-restaurant-salmiya' },
  { from: '/places-to-eat/restaurants/BurgerFi', to: '/places-to-eat/restaurants/burgerfi-rai' },
  { from: '/places-to-eat/restaurants/Misk.kwt)', to: '/places-to-eat/restaurants/misk-restaurant-salmiya' },
  { from: '/places-to-eat/restaurants/sabaideegroup)', to: '/places-to-eat/restaurants/sabaidee-thai-restaurant-mahboula' },

  // Unknown URLs (redirect to hub)
  { from: '/places-to-eat/restaurants/925509257558176', to: '/places-to-eat' },
  { from: '/places-to-eat/restaurants/sharer', to: '/places-to-eat' },
  { from: '/places-to-eat/restaurants/intent', to: '/places-to-eat' },
  { from: '/places-to-eat/restaurants/hardeesarabia', to: '/places-to-eat' },

  // Resorts redirect
  { from: '/places-to-stay/resorts', to: '/places-to-stay/resort-hotels' },
];

console.log('ðŸ§ª Redirect Test Plan\n');
console.log('After deploying to Vercel, run these curl commands:\n');

testUrls.forEach(({ from, to }) => {
  console.log(`# Test: ${from}`);
  console.log(`curl -I https://www.bestofgoa.com${from}`);
  console.log(`# Expected: HTTP/2 301`);
  console.log(`# Expected: location: https://www.bestofgoa.com${to}`);
  console.log('');
});

console.log('\nâœ… Total redirects to test:', testUrls.length);
console.log('\nðŸ“ Note: Run these tests AFTER deploying to Vercel');
console.log('Redirects only work in production build, not in dev mode.');
