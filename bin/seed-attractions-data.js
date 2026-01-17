#!/usr/bin/env node
/**
 * Seed Attractions Reference Data
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedData() {
  console.log('Seeding Attractions Reference Data...\n');

  // Categories
  const categories = [
    { name: 'Museum', slug: 'museum', name_ar: 'متحف', description: 'Museums and galleries showcasing art, history, and culture', icon: 'icon-building-museum', display_order: 1 },
    { name: 'Park', slug: 'park', name_ar: 'حديقة', description: 'Parks, gardens, and green spaces', icon: 'icon-tree', display_order: 2 },
    { name: 'Landmark', slug: 'landmark', name_ar: 'معلم', description: 'Notable landmarks and monuments', icon: 'icon-monument', display_order: 3 },
    { name: 'Entertainment', slug: 'entertainment', name_ar: 'ترفيه', description: 'Entertainment venues and theme parks', icon: 'icon-ferris-wheel', display_order: 4 },
    { name: 'Cultural', slug: 'cultural', name_ar: 'ثقافي', description: 'Cultural sites and heritage locations', icon: 'icon-building-arch', display_order: 5 },
    { name: 'Nature', slug: 'nature', name_ar: 'طبيعة', description: 'Nature reserves and natural attractions', icon: 'icon-leaf', display_order: 6 },
    { name: 'Shopping', slug: 'shopping', name_ar: 'تسوق', description: 'Major shopping destinations and markets', icon: 'icon-shopping-bag', display_order: 7 },
    { name: 'Historical', slug: 'historical', name_ar: 'تاريخي', description: 'Historical sites and archaeological locations', icon: 'icon-history', display_order: 8 },
    { name: 'Beach', slug: 'beach', name_ar: 'شاطئ', description: 'Beaches and waterfront attractions', icon: 'icon-beach', display_order: 9 },
    { name: 'Religious', slug: 'religious', name_ar: 'ديني', description: 'Mosques, churches, and religious sites', icon: 'icon-building-mosque', display_order: 10 }
  ];

  console.log('Inserting categories...');
  const { error: catError, data: catData } = await supabase
    .from('attraction_categories')
    .upsert(categories, { onConflict: 'name' })
    .select();

  if (catError) {
    console.log('  ❌ Categories error:', catError.message);
  } else {
    console.log(`  ✅ Inserted ${catData.length} categories`);
  }

  // Amenities
  const amenities = [
    { name: 'Free Parking', slug: 'free-parking', name_ar: 'موقف مجاني', category: 'facilities', icon: 'icon-parking', display_order: 1 },
    { name: 'Paid Parking', slug: 'paid-parking', name_ar: 'موقف مدفوع', category: 'facilities', icon: 'icon-parking-circle', display_order: 2 },
    { name: 'Restrooms', slug: 'restrooms', name_ar: 'دورات مياه', category: 'facilities', icon: 'icon-toilet-paper', display_order: 3 },
    { name: 'Gift Shop', slug: 'gift-shop', name_ar: 'متجر هدايا', category: 'facilities', icon: 'icon-gift', display_order: 4 },
    { name: 'Cafe', slug: 'cafe', name_ar: 'مقهى', category: 'facilities', icon: 'icon-coffee', display_order: 5 },
    { name: 'Restaurant', slug: 'restaurant', name_ar: 'مطعم', category: 'facilities', icon: 'icon-tool-kitchen', display_order: 6 },
    { name: 'Lockers', slug: 'lockers', name_ar: 'خزائن', category: 'facilities', icon: 'icon-lock', display_order: 7 },
    { name: 'Prayer Room', slug: 'prayer-room', name_ar: 'مصلى', category: 'facilities', icon: 'icon-pray', display_order: 8 },
    { name: 'Audio Guide', slug: 'audio-guide', name_ar: 'دليل صوتي', category: 'services', icon: 'icon-headphones', display_order: 10 },
    { name: 'Guided Tours', slug: 'guided-tours', name_ar: 'جولات مرشدة', category: 'services', icon: 'icon-user-check', display_order: 11 },
    { name: 'Ticket Counter', slug: 'ticket-counter', name_ar: 'شباك التذاكر', category: 'services', icon: 'icon-ticket', display_order: 12 },
    { name: 'Information Desk', slug: 'information-desk', name_ar: 'مكتب معلومات', category: 'services', icon: 'icon-info-circle', display_order: 13 },
    { name: 'Wheelchair Accessible', slug: 'wheelchair-accessible', name_ar: 'مناسب للكراسي', category: 'accessibility', icon: 'icon-wheelchair', display_order: 20 },
    { name: 'Elevator', slug: 'elevator', name_ar: 'مصعد', category: 'accessibility', icon: 'icon-elevator', display_order: 21 },
    { name: 'Air Conditioned', slug: 'air-conditioned', name_ar: 'مكيف', category: 'comfort', icon: 'icon-air-conditioning', display_order: 30 },
    { name: 'Seating Areas', slug: 'seating-areas', name_ar: 'مناطق جلوس', category: 'comfort', icon: 'icon-armchair', display_order: 31 },
    { name: 'Drinking Water', slug: 'drinking-water', name_ar: 'مياه شرب', category: 'comfort', icon: 'icon-bottle', display_order: 32 },
    { name: 'WiFi Available', slug: 'wifi-available', name_ar: 'واي فاي', category: 'comfort', icon: 'icon-wifi', display_order: 33 },
    { name: 'Baby Changing', slug: 'baby-changing', name_ar: 'غرفة تغيير الحفاضات', category: 'comfort', icon: 'icon-baby-carriage', display_order: 34 },
    { name: 'First Aid', slug: 'first-aid', name_ar: 'إسعافات أولية', category: 'comfort', icon: 'icon-first-aid-kit', display_order: 35 }
  ];

  console.log('Inserting amenities...');
  const { error: amenError, data: amenData } = await supabase
    .from('attraction_amenities')
    .upsert(amenities, { onConflict: 'name' })
    .select();

  if (amenError) {
    console.log('  ❌ Amenities error:', amenError.message);
  } else {
    console.log(`  ✅ Inserted ${amenData.length} amenities`);
  }

  // Features
  const features = [
    { name: 'Indoor', slug: 'indoor', name_ar: 'داخلي', category: 'environment', icon: 'icon-building', display_order: 1 },
    { name: 'Outdoor', slug: 'outdoor', name_ar: 'خارجي', category: 'environment', icon: 'icon-sun', display_order: 2 },
    { name: 'Covered', slug: 'covered', name_ar: 'مغطى', category: 'environment', icon: 'icon-umbrella', display_order: 3 },
    { name: 'Family Friendly', slug: 'family-friendly', name_ar: 'مناسب للعائلات', category: 'audience', icon: 'icon-users', display_order: 10 },
    { name: 'Kid Friendly', slug: 'kid-friendly', name_ar: 'مناسب للأطفال', category: 'audience', icon: 'icon-baby-carriage', display_order: 11 },
    { name: 'Pet Friendly', slug: 'pet-friendly', name_ar: 'يسمح بالحيوانات', category: 'audience', icon: 'icon-dog', display_order: 12 },
    { name: 'Romantic', slug: 'romantic', name_ar: 'رومانسي', category: 'audience', icon: 'icon-heart', display_order: 13 },
    { name: 'Group Friendly', slug: 'group-friendly', name_ar: 'مناسب للمجموعات', category: 'audience', icon: 'icon-users-group', display_order: 14 },
    { name: 'Educational', slug: 'educational', name_ar: 'تعليمي', category: 'activity', icon: 'icon-school', display_order: 20 },
    { name: 'Interactive', slug: 'interactive', name_ar: 'تفاعلي', category: 'activity', icon: 'icon-hand-click', display_order: 21 },
    { name: 'Photography Spot', slug: 'photography-spot', name_ar: 'موقع تصوير', category: 'activity', icon: 'icon-camera', display_order: 22 },
    { name: 'Adventure', slug: 'adventure', name_ar: 'مغامرة', category: 'activity', icon: 'icon-compass', display_order: 23 },
    { name: 'Relaxation', slug: 'relaxation', name_ar: 'استرخاء', category: 'activity', icon: 'icon-leaf', display_order: 24 },
    { name: 'Free Entry', slug: 'free-entry', name_ar: 'دخول مجاني', category: 'special', icon: 'icon-ticket-off', display_order: 30 },
    { name: 'Seasonal', slug: 'seasonal', name_ar: 'موسمي', category: 'special', icon: 'icon-calendar', display_order: 31 },
    { name: 'Night Attraction', slug: 'night-attraction', name_ar: 'جذب ليلي', category: 'special', icon: 'icon-moon', display_order: 32 },
    { name: 'Instagram Worthy', slug: 'instagram-worthy', name_ar: 'جدير بالتصوير', category: 'special', icon: 'icon-brand-instagram', display_order: 33 },
    { name: 'Local Favorite', slug: 'local-favorite', name_ar: 'مفضل محلي', category: 'special', icon: 'icon-star', display_order: 34 }
  ];

  console.log('Inserting features...');
  const { error: featError, data: featData } = await supabase
    .from('attraction_features')
    .upsert(features, { onConflict: 'name' })
    .select();

  if (featError) {
    console.log('  ❌ Features error:', featError.message);
  } else {
    console.log(`  ✅ Inserted ${featData.length} features`);
  }

  console.log('\n✅ Seed data complete!');
}

seedData();
