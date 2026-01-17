const fs = require('fs');

console.log('🔍 ANALYZING DOWNLOADED RESTAURANTS JSON (v2 - Parse Stringified Fields)\n');
console.log('='.repeat(80));

// Load the file
const restaurants = JSON.parse(fs.readFileSync('C:/Users/Douglas/Downloads/restaurants_rows.json', 'utf-8'));

console.log(`\n📊 TOTAL RESTAURANTS: ${restaurants.length}`);
console.log('='.repeat(80));

// Parse stringified JSON fields
restaurants.forEach(restaurant => {
  // Parse apify_output if it's a string
  if (typeof restaurant.apify_output === 'string') {
    try {
      restaurant.apify_output = JSON.parse(restaurant.apify_output);
    } catch (e) {
      console.error(`Failed to parse apify_output for ${restaurant.name}:`, e.message);
    }
  }

  // Parse other fields if needed
  if (typeof restaurant.firecrawl_output === 'string') {
    try {
      restaurant.firecrawl_output = JSON.parse(restaurant.firecrawl_output);
    } catch (e) {
      // Ignore
    }
  }

  if (typeof restaurant.job_progress === 'string') {
    try {
      restaurant.job_progress = JSON.parse(restaurant.job_progress);
    } catch (e) {
      // Ignore
    }
  }
});

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
  if (withWebsite.length > 0) {
    console.log(`   Examples: ${withWebsite.slice(0, 3).map(r => r.name).join(', ')}`);
  }

  console.log(`\n✅ popularTimesHistogram: ${withPopularTimes.length}/${withApifyOutput.length} (${(withPopularTimes.length/withApifyOutput.length*100).toFixed(1)}%)`);
  if (withPopularTimes.length > 0) {
    console.log(`   Examples: ${withPopularTimes.slice(0, 3).map(r => r.name).join(', ')}`);
  }

  console.log(`\n✅ questionsAndAnswers: ${withQA.length}/${withApifyOutput.length} (${(withQA.length/withApifyOutput.length*100).toFixed(1)}%)`);
  if (withQA.length > 0) {
    console.log(`   Examples: ${withQA.slice(0, 3).map(r => r.name).join(', ')}`);
  }

  console.log(`\n✅ additionalInfo: ${withAdditionalInfo.length}/${withApifyOutput.length} (${(withAdditionalInfo.length/withApifyOutput.length*100).toFixed(1)}%)`);
  if (withAdditionalInfo.length > 0) {
    console.log(`   Examples: ${withAdditionalInfo.slice(0, 3).map(r => r.name).join(', ')}`);
  }

  // Find Lï Beirut and Tatami specifically
  console.log('\n\n🔍 COMPARING SPECIFIC RESTAURANTS:');
  console.log('─'.repeat(80));

  const liBeirut = restaurants.find(r => r.name.toLowerCase().includes('beirut'));
  const tatami = restaurants.find(r => r.name.toLowerCase().includes('tatami'));

  if (liBeirut && liBeirut.apify_output) {
    console.log(`\n📍 Lï Beirut:`);
    console.log(`   Total fields: ${Object.keys(liBeirut.apify_output).length}`);
    console.log(`   Website: ${liBeirut.apify_output.website ? '✅ ' + liBeirut.apify_output.website : '❌'}`);
    console.log(`   PopularTimes: ${liBeirut.apify_output.popularTimesHistogram ? '✅' : '❌'}`);
    console.log(`   Q&A: ${liBeirut.apify_output.questionsAndAnswers ? '✅' : '❌'}`);
    console.log(`   AdditionalInfo: ${liBeirut.apify_output.additionalInfo ? `✅ (${Object.keys(liBeirut.apify_output.additionalInfo).length} categories)` : '❌'}`);

    if (liBeirut.apify_output.additionalInfo) {
      console.log(`   AdditionalInfo categories: ${Object.keys(liBeirut.apify_output.additionalInfo).join(', ')}`);
    }
  }

  if (tatami && tatami.apify_output) {
    console.log(`\n📍 Tatami Japanese Restaurant:`);
    console.log(`   Total fields: ${Object.keys(tatami.apify_output).length}`);
    console.log(`   Website: ${tatami.apify_output.website ? '✅ ' + tatami.apify_output.website : '❌'}`);
    console.log(`   PopularTimes: ${tatami.apify_output.popularTimesHistogram ? '✅' : '❌'}`);
    console.log(`   Q&A: ${tatami.apify_output.questionsAndAnswers ? '✅' : '❌'}`);
    console.log(`   AdditionalInfo: ${tatami.apify_output.additionalInfo ? `✅ (${Object.keys(tatami.apify_output.additionalInfo).length} categories)` : '❌'}`);

    if (tatami.apify_output.additionalInfo) {
      console.log(`   AdditionalInfo categories: ${Object.keys(tatami.apify_output.additionalInfo).join(', ')}`);
    }
  }

  // Show what's different
  if (liBeirut && tatami && liBeirut.apify_output && tatami.apify_output) {
    console.log('\n\n⚡ KEY DIFFERENCES:');
    console.log('─'.repeat(80));

    const liBeirutKeys = Object.keys(liBeirut.apify_output);
    const tatamiKeys = Object.keys(tatami.apify_output);

    const onlyInTatami = tatamiKeys.filter(k => !liBeirutKeys.includes(k));
    const onlyInLiBeirut = liBeirutKeys.filter(k => !tatamiKeys.includes(k));

    if (onlyInTatami.length > 0) {
      console.log(`\nFields ONLY in Tatami (${onlyInTatami.length}):`);
      onlyInTatami.forEach(key => {
        console.log(`  - ${key}`);
      });
    }

    if (onlyInLiBeirut.length > 0) {
      console.log(`\nFields ONLY in Lï Beirut (${onlyInLiBeirut.length}):`);
      onlyInLiBeirut.forEach(key => {
        console.log(`  - ${key}`);
      });
    }

    if (onlyInTatami.length === 0 && onlyInLiBeirut.length === 0) {
      console.log('\n✅ Both restaurants have the SAME field structure!');
    }
  }
}

console.log('\n\n' + '='.repeat(80));
console.log('✅ ANALYSIS COMPLETE');
console.log('='.repeat(80));
