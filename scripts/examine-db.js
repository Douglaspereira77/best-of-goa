// Temporary script to examine Supabase database structure
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Read .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(
  envVars.SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function examineDatabase() {
  console.log('=== EXAMINING SUPABASE DATABASE ===\n');

  // Query information_schema to get table structures
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .order('table_name');

  if (tablesError) {
    console.error('Error fetching tables:', tablesError);
    // Try direct SQL query instead
    const { data: rpcTables, error: rpcError } = await supabase.rpc('exec_sql', {
      sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    });

    if (rpcError) {
      console.log('Cannot query information_schema, will examine specific tables directly\n');
    }
  } else {
    console.log('Available tables:', tables?.map(t => t.table_name).join(', '));
  }

  // Examine restaurants table
  console.log('\n=== RESTAURANTS TABLE ===');
  const { data: restaurants, error: restaurantsError } = await supabase
    .from('restaurants')
    .select('*')
    .limit(1);

  if (restaurantsError) {
    console.error('Error:', restaurantsError);
  } else if (restaurants && restaurants.length > 0) {
    console.log('\nSample restaurant record:');
    console.log(JSON.stringify(restaurants[0], null, 2));
    console.log('\nRestaurants columns:', Object.keys(restaurants[0]).join(', '));
  } else {
    console.log('No restaurants found in table');
  }

  // Examine restaurants_dishes table
  console.log('\n\n=== RESTAURANTS_DISHES TABLE ===');
  const { data: dishes, error: dishesError } = await supabase
    .from('restaurants_dishes')
    .select('*')
    .limit(1);

  if (dishesError) {
    console.error('Error:', dishesError);
  } else if (dishes && dishes.length > 0) {
    console.log('\nSample dish record:');
    console.log(JSON.stringify(dishes[0], null, 2));
    console.log('\nRestaurants_dishes columns:', Object.keys(dishes[0]).join(', '));
  } else {
    console.log('No dishes found in table');
  }

  // Check all tables to see what exists
  console.log('\n\n=== ATTEMPTING TO LIST ALL TABLES ===');
  const commonTables = ['restaurants', 'restaurants_dishes', 'categories', 'locations', 'reviews', 'users', 'images'];
  for (const tableName of commonTables) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (!error) {
      console.log(`✓ Table "${tableName}" exists`);
    }
  }

  // Get counts
  const { count: restaurantCount } = await supabase
    .from('restaurants')
    .select('*', { count: 'exact', head: true });

  const { count: dishCount } = await supabase
    .from('restaurants_dishes')
    .select('*', { count: 'exact', head: true });

  console.log('\n\n=== SUMMARY ===');
  console.log(`Total restaurants: ${restaurantCount || 0}`);
  console.log(`Total dishes: ${dishCount || 0}`);

  // Try to get schema information by examining the database with an insert attempt
  console.log('\n\n=== EXAMINING RESTAURANTS SCHEMA ===');
  console.log('Attempting to get column information...');

  // Query PostgREST OpenAPI schema endpoint
  try {
    const schemaUrl = `${envVars.SUPABASE_URL}/rest/v1/`;
    const response = await fetch(schemaUrl, {
      headers: {
        'apikey': envVars.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${envVars.SUPABASE_ANON_KEY}`
      }
    });

    if (response.ok) {
      const schema = await response.json();
      console.log('Schema retrieved:', JSON.stringify(schema, null, 2));
    }
  } catch (error) {
    console.log('Could not retrieve schema via REST API');
  }

  // Check restaurant_imports table structure
  console.log('\n\n=== RESTAURANT_IMPORTS TABLE ===');
  const { data: imports, error: importsError } = await supabase
    .from('restaurant_imports')
    .select('*')
    .limit(1);

  if (importsError) {
    console.error('Error:', importsError);
  } else if (imports && imports.length > 0) {
    console.log('\nSample import record:');
    console.log(JSON.stringify(imports[0], null, 2));
    console.log('\nRestaurant_imports columns:', Object.keys(imports[0]).join(', '));
  } else {
    console.log('No imports found in table');
    console.log('Checking if table exists...');
    const { count: importCount } = await supabase
      .from('restaurant_imports')
      .select('*', { count: 'exact', head: true });
    console.log(`Restaurant_imports table has ${importCount || 0} records`);
  }
}

examineDatabase().catch(console.error);
