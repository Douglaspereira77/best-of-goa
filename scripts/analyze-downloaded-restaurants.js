const fs = require('fs');

console.log('🔍 ANALYZING DOWNLOADED RESTAURANTS JSON\n');
console.log('='.repeat(80));

// Load the file
const restaurants = JSON.parse(fs.readFileSync('C:/Users/Douglas/Downloads/restaurants_rows.json', 'utf-8'));

console.log(`\n📊 TOTAL RESTAURANTS: ${restaurants.length}`);
console.log('='.repeat(80));

// Analyze the structure
if (restaurants.length > 0) {
  console.log('\n📋 SAMPLE RESTAURANT STRUCTURE (First restaurant):');
  console.log('─'.repeat(80));

  const firstRestaurant = restaurants[0];
  const keys = Object.keys(firstRestaurant);

  console.log(`\nTotal fields: ${keys.length}`);
  console.log('\nField list:');
  keys.forEach(key => {
    const value = firstRestaurant[key];
    let typeInfo = '';

    if (value === null || value === undefined) {
      typeInfo = 'null';
    } else if (typeof value === 'object') {
      if (Array.isArray(value)) {
        typeInfo = `array[${value.length}]`;
      } else {
        typeInfo = `object{${Object.keys(value).length} keys}`;
      }
    } else if (typeof value === 'string') {
      typeInfo = `string(${value.length} chars)`;
    } else {
      typeInfo = typeof value;
    }

    console.log(`  - ${key}: ${typeInfo}`);
  });
}

// Check which restaurants have apify_output
console.log('\n\n📦 APIFY_OUTPUT ANALYSIS:');
console.log('─'.repeat(80));

const withApifyOutput = restaurants.filter(r => r.apify_output !== null && r.apify_output !== undefined);
console.log(`\nRestaurants with apify_output: ${withApifyOutput.length}/${restaurants.length}`);

if (withApifyOutput.length > 0) {
  console.log('\n🔍 Analyzing apify_output structure differences...\n');

  // Count field variations
  const fieldCounts = {};

  withApifyOutput.forEach(restaurant => {
    const apifyKeys = Object.keys(restaurant.apify_output || {});
    const keyCount = apifyKeys.length;

    if (!fieldCounts[keyCount]) {
      fieldCounts[keyCount] = {
        count: 0,
        restaurantNames: []
      };
    }

    fieldCounts[keyCount].count++;
    if (fieldCounts[keyCount].restaurantNames.length < 5) {
      fieldCounts[keyCount].restaurantNames.push(restaurant.name);
    }
  });

  console.log('📊 Distribution of apify_output field counts:');
  console.log('─'.repeat(80));

  Object.keys(fieldCounts).sort((a, b) => b - a).forEach(count => {
    const data = fieldCounts[count];
    console.log(`\n${count} fields: ${data.count} restaurants`);
    console.log(`  Examples: ${data.restaurantNames.join(', ')}`);
  });

  // Find restaurants with most fields vs least fields
  const sorted = withApifyOutput.map(r => ({
    name: r.name,
    fieldCount: Object.keys(r.apify_output || {}).length,
    hasWebsite: !!r.apify_output?.website,
    hasPopularTimes: !!r.apify_output?.popularTimesHistogram,
    hasQA: !!r.apify_output?.questionsAndAnswers,
    hasAdditionalInfo: !!r.apify_output?.additionalInfo,
    additionalInfoSize: r.apify_output?.additionalInfo ? Object.keys(r.apify_output.additionalInfo).length : 0
  })).sort((a, b) => b.fieldCount - a.fieldCount);

  console.log('\n\n🏆 TOP 10 RESTAURANTS (Most Apify Fields):');
  console.log('─'.repeat(80));
  sorted.slice(0, 10).forEach((r, i) => {
    console.log(`${i + 1}. ${r.name}`);
    console.log(`   Fields: ${r.fieldCount} | Website: ${r.hasWebsite ? '✅' : '❌'} | PopularTimes: ${r.hasPopularTimes ? '✅' : '❌'} | Q&A: ${r.hasQA ? '✅' : '❌'} | AdditionalInfo: ${r.hasAdditionalInfo ? `✅(${r.additionalInfoSize})` : '❌'}`);
  });

  console.log('\n\n📉 BOTTOM 10 RESTAURANTS (Least Apify Fields):');
  console.log('─'.repeat(80));
  sorted.slice(-10).reverse().forEach((r, i) => {
    console.log(`${i + 1}. ${r.name}`);
    console.log(`   Fields: ${r.fieldCount} | Website: ${r.hasWebsite ? '✅' : '❌'} | PopularTimes: ${r.hasPopularTimes ? '✅' : '❌'} | Q&A: ${r.hasQA ? '✅' : '❌'} | AdditionalInfo: ${r.hasAdditionalInfo ? `✅(${r.additionalInfoSize})` : '❌'}`);
  });

  // Check for specific fields
  console.log('\n\n🔍 SPECIFIC FIELD PRESENCE:');
  console.log('─'.repeat(80));

  const withWebsite = withApifyOutput.filter(r => r.apify_output?.website);
  const withPopularTimes = withApifyOutput.filter(r => r.apify_output?.popularTimesHistogram);
  const withQA = withApifyOutput.filter(r => r.apify_output?.questionsAndAnswers);
  const withAdditionalInfo = withApifyOutput.filter(r => r.apify_output?.additionalInfo);

  console.log(`\n✅ website: ${withWebsite.length}/${withApifyOutput.length} (${(withWebsite.length/withApifyOutput.length*100).toFixed(1)}%)`);
  console.log(`✅ popularTimesHistogram: ${withPopularTimes.length}/${withApifyOutput.length} (${(withPopularTimes.length/withApifyOutput.length*100).toFixed(1)}%)`);
  console.log(`✅ questionsAndAnswers: ${withQA.length}/${withApifyOutput.length} (${(withQA.length/withApifyOutput.length*100).toFixed(1)}%)`);
  console.log(`✅ additionalInfo: ${withAdditionalInfo.length}/${withApifyOutput.length} (${(withAdditionalInfo.length/withApifyOutput.length*100).toFixed(1)}%)`);

  // Find Lï Beirut and Tatami specifically
  console.log('\n\n🔍 FINDING SPECIFIC RESTAURANTS:');
  console.log('─'.repeat(80));

  const liBeirut = restaurants.find(r => r.name.toLowerCase().includes('beirut'));
  const tatami = restaurants.find(r => r.name.toLowerCase().includes('tatami'));

  if (liBeirut) {
    console.log(`\n📍 Lï Beirut:`);
    console.log(`   Fields: ${Object.keys(liBeirut.apify_output || {}).length}`);
    console.log(`   Website: ${liBeirut.apify_output?.website ? '✅' : '❌'}`);
    console.log(`   PopularTimes: ${liBeirut.apify_output?.popularTimesHistogram ? '✅' : '❌'}`);
    console.log(`   Q&A: ${liBeirut.apify_output?.questionsAndAnswers ? '✅' : '❌'}`);
    console.log(`   AdditionalInfo: ${liBeirut.apify_output?.additionalInfo ? `✅ (${Object.keys(liBeirut.apify_output.additionalInfo).length} categories)` : '❌'}`);
  }

  if (tatami) {
    console.log(`\n📍 Tatami:`);
    console.log(`   Fields: ${Object.keys(tatami.apify_output || {}).length}`);
    console.log(`   Website: ${tatami.apify_output?.website ? '✅' : '❌'}`);
    console.log(`   PopularTimes: ${tatami.apify_output?.popularTimesHistogram ? '✅' : '❌'}`);
    console.log(`   Q&A: ${tatami.apify_output?.questionsAndAnswers ? '✅' : '❌'}`);
    console.log(`   AdditionalInfo: ${tatami.apify_output?.additionalInfo ? `✅ (${Object.keys(tatami.apify_output.additionalInfo).length} categories)` : '❌'}`);
  }
}

console.log('\n\n' + '='.repeat(80));
console.log('✅ ANALYSIS COMPLETE');
console.log('='.repeat(80));
