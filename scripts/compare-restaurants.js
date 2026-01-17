const fs = require('fs');

console.log('🔍 COMPARING TATAMI vs LÏ BEIRUT DATA STRUCTURE\n');
console.log('='.repeat(80));

// Load both files
const tatami = JSON.parse(fs.readFileSync('tatami-apify-output.json', 'utf-8'));
const liBeirut = JSON.parse(fs.readFileSync('apify-output-full.json', 'utf-8'));

console.log('\n📊 TOP-LEVEL FIELD COMPARISON:');
console.log('─'.repeat(80));

const tatamiKeys = Object.keys(tatami);
const liBeirutKeys = Object.keys(liBeirut);

console.log(`Tatami has ${tatamiKeys.length} top-level keys`);
console.log(`Lï Beirut has ${liBeirutKeys.length} top-level keys`);

// Fields only in Tatami
const onlyInTatami = tatamiKeys.filter(key => !liBeirutKeys.includes(key));
console.log(`\n✅ Fields ONLY in Tatami (${onlyInTatami.length}):`);
onlyInTatami.forEach(key => {
  const value = tatami[key];
  let preview = '';

  if (value === null || value === undefined) {
    preview = ' = null';
  } else if (typeof value === 'object') {
    if (Array.isArray(value)) {
      preview = ` = [${value.length} items]`;
    } else {
      preview = ` = {${Object.keys(value).length} keys}`;
    }
  } else if (typeof value === 'string') {
    preview = ` = "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`;
  } else {
    preview = ` = ${value}`;
  }

  console.log(`  - ${key}${preview}`);
});

// Fields only in Lï Beirut
const onlyInLiBeirut = liBeirutKeys.filter(key => !tatamiKeys.includes(key));
if (onlyInLiBeirut.length > 0) {
  console.log(`\n✅ Fields ONLY in Lï Beirut (${onlyInLiBeirut.length}):`);
  onlyInLiBeirut.forEach(key => {
    console.log(`  - ${key}`);
  });
}

// Check specific important fields
console.log('\n\n🔍 KEY FIELD ANALYSIS:');
console.log('─'.repeat(80));

// Opening Hours
console.log('\n📅 OPENING HOURS:');
console.log(`Tatami: ${tatami.openingHours ? 'YES ✅' : 'NO ❌'}`);
console.log(`Lï Beirut: ${liBeirut.openingHours ? 'YES ✅' : 'NO ❌'}`);

if (tatami.openingHours) {
  console.log('\nTatami Opening Hours Sample:');
  console.log(JSON.stringify(tatami.openingHours.slice(0, 2), null, 2));
}

// Reviews Distribution
console.log('\n\n⭐ REVIEWS DISTRIBUTION:');
console.log(`Tatami: ${tatami.reviewsDistribution ? 'YES ✅' : 'NO ❌'}`);
console.log(`Lï Beirut: ${liBeirut.reviewsDistribution ? 'YES ✅' : 'NO ❌'}`);

if (tatami.reviewsDistribution) {
  console.log('\nTatami Reviews Distribution:');
  console.log(JSON.stringify(tatami.reviewsDistribution, null, 2));
}

// Popular Times
console.log('\n\n📈 POPULAR TIMES:');
console.log(`Tatami popularTimesHistogram: ${tatami.popularTimesHistogram ? 'YES ✅' : 'NO ❌'}`);
console.log(`Lï Beirut popularTimesHistogram: ${liBeirut.popularTimesHistogram ? 'YES ✅' : 'NO ❌'}`);

if (tatami.popularTimesHistogram) {
  console.log('\nTatami Popular Times Sample:');
  console.log(JSON.stringify(tatami.popularTimesHistogram[0], null, 2));
}

// Questions and Answers
console.log('\n\n❓ QUESTIONS & ANSWERS:');
console.log(`Tatami: ${tatami.questionsAndAnswers ? `YES ✅ (${tatami.questionsAndAnswers.length} items)` : 'NO ❌'}`);
console.log(`Lï Beirut: ${liBeirut.questionsAndAnswers ? `YES ✅ (${liBeirut.questionsAndAnswers.length} items)` : 'NO ❌'}`);

// Additional Info
console.log('\n\n📝 ADDITIONAL INFO:');
console.log(`Tatami: ${tatami.additionalInfo ? 'YES ✅' : 'NO ❌'}`);
console.log(`Lï Beirut: ${liBeirut.additionalInfo ? 'YES ✅' : 'NO ❌'}`);

if (tatami.additionalInfo) {
  console.log('\nTatami Additional Info:');
  console.log(JSON.stringify(tatami.additionalInfo, null, 2));
}

// People Also Search
console.log('\n\n🔎 PEOPLE ALSO SEARCH:');
console.log(`Tatami: ${tatami.peopleAlsoSearch ? `YES ✅ (${tatami.peopleAlsoSearch.length} items)` : 'NO ❌'}`);
console.log(`Lï Beirut: ${liBeirut.peopleAlsoSearch ? `YES ✅ (${liBeirut.peopleAlsoSearch.length} items)` : 'NO ❌'}`);

// Review Context Comparison
console.log('\n\n🗨️ REVIEW CONTEXT DEPTH:');
console.log('─'.repeat(80));

const tatamiContexts = tatami.reviews.map(r => Object.keys(r.reviewContext || {}).length);
const liBeirutContexts = liBeirut.reviews.map(r => Object.keys(r.reviewContext || {}).length);

const tatamiAvg = tatamiContexts.reduce((a, b) => a + b, 0) / tatamiContexts.length;
const liBeirutAvg = liBeirutContexts.reduce((a, b) => a + b, 0) / liBeirutContexts.length;

console.log(`Tatami: Avg ${tatamiAvg.toFixed(1)} context fields per review`);
console.log(`Lï Beirut: Avg ${liBeirutAvg.toFixed(1)} context fields per review`);

// Find richest review context
const richestTatamiReview = tatami.reviews.reduce((max, r) =>
  Object.keys(r.reviewContext || {}).length > Object.keys(max.reviewContext || {}).length ? r : max
, tatami.reviews[0]);

console.log('\n📌 Richest Tatami Review Context:');
console.log(JSON.stringify(richestTatamiReview.reviewContext, null, 2));

// Owner Responses
console.log('\n\n💬 OWNER RESPONSES:');
console.log('─'.repeat(80));

const tatamiWithOwnerResponse = tatami.reviews.filter(r => r.responseFromOwnerText).length;
const liBeirutWithOwnerResponse = liBeirut.reviews.filter(r => r.responseFromOwnerText).length;

console.log(`Tatami: ${tatamiWithOwnerResponse}/${tatami.reviews.length} reviews have owner responses`);
console.log(`Lï Beirut: ${liBeirutWithOwnerResponse}/${liBeirut.reviews.length} reviews have owner responses`);

console.log('\n\n' + '='.repeat(80));
console.log('✅ COMPARISON COMPLETE');
console.log('='.repeat(80));
