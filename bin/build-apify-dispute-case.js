#!/usr/bin/env node

/**
 * Build Apify Billing Dispute Case
 *
 * Gathers all evidence for billing dispute with Apify
 */

require('dotenv').config({ path: '.env.local' });

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_BASE_URL = process.env.APIFY_BASE_URL || 'https://api.apify.com/v2';

async function buildDisputeCase() {
  console.log('ðŸ“‹ APIFY BILLING DISPUTE CASE BUILDER\n');
  console.log('â•'.repeat(80) + '\n');

  try {
    // Target run that had the issue
    const targetRunId = 'ngUkI0fVu3TxJNf4V';
    const actorId = 'compass~crawler-google-places';

    console.log('ðŸŽ¯ TARGET RUN INFORMATION:\n');
    console.log(`Run ID: ${targetRunId}`);
    console.log(`Actor: ${actorId}\n`);

    // Fetch run details
    const runUrl = `${APIFY_BASE_URL}/acts/${actorId}/runs/${targetRunId}?token=${APIFY_API_TOKEN}`;
    const runResponse = await fetch(runUrl);

    if (!runResponse.ok) {
      throw new Error(`Failed to fetch run details: ${runResponse.status}`);
    }

    const runData = await runResponse.json();
    const run = runData.data;

    console.log('â•'.repeat(80));
    console.log('1. WHEN THE OVERCHARGING OCCURRED\n');
    console.log('â”€'.repeat(80));
    console.log(`Date: ${new Date(run.startedAt).toLocaleString()}`);
    console.log(`Started: ${run.startedAt}`);
    console.log(`Finished: ${run.finishedAt}`);
    console.log(`Duration: ${Math.round(run.stats.crawlerRuntimeMillis / 1000)} seconds`);
    console.log(`Status: ${run.status}`);
    console.log(`Build ID: ${run.buildId}\n`);

    // Fetch input parameters
    console.log('â•'.repeat(80));
    console.log('2. YOUR RUN DETAILS - INPUT PARAMETERS\n');
    console.log('â”€'.repeat(80));

    if (run.defaultKeyValueStoreId) {
      const inputUrl = `${APIFY_BASE_URL}/key-value-stores/${run.defaultKeyValueStoreId}/records/INPUT?token=${APIFY_API_TOKEN}`;
      const inputResponse = await fetch(inputUrl);

      if (inputResponse.ok) {
        const input = await inputResponse.json();
        console.log('Input Configuration:');
        console.log(JSON.stringify(input, null, 2));
        console.log('\nâš ï¸  KEY PARAMETER: maxCrawledPlaces =', input.maxCrawledPlaces || 'NOT SET');
        console.log('   Expected Behavior: Should stop after extracting', input.maxCrawledPlaces || 1, 'place(s)\n');
      }
    }

    // Fetch dataset to see what was actually scraped
    console.log('â•'.repeat(80));
    console.log('3. ACTUAL RESULTS - WHAT WAS SCRAPED\n');
    console.log('â”€'.repeat(80));

    if (run.defaultDatasetId) {
      const datasetUrl = `${APIFY_BASE_URL}/datasets/${run.defaultDatasetId}/items?token=${APIFY_API_TOKEN}`;
      const datasetResponse = await fetch(datasetUrl);

      if (datasetResponse.ok) {
        const results = await datasetResponse.json();
        console.log(`Total Places Scraped: ${results.length}`);
        console.log(`\nFirst 5 Results:\n`);

        results.slice(0, 5).forEach((place, idx) => {
          console.log(`${idx + 1}. ${place.title || 'N/A'}`);
          console.log(`   Place ID: ${place.placeId || 'N/A'}`);
          console.log(`   Address: ${place.address || 'N/A'}`);
          console.log(`   Category: ${place.categoryName || 'N/A'}\n`);
        });

        if (results.length > 5) {
          console.log(`... and ${results.length - 5} more places\n`);
        }
      }
    }

    // Usage and cost
    console.log('â•'.repeat(80));
    console.log('4. BILLING CHARGES\n');
    console.log('â”€'.repeat(80));

    if (run.usage) {
      console.log('Usage Metrics:');
      console.log(`  Compute Units: ${run.usage.COMPUTE_UNITS || 0}`);
      console.log(`  Dataset Writes: ${run.usage.DATASET_WRITES || 0}`);
      console.log(`  Dataset Reads: ${run.usage.DATASET_READS || 0}\n`);
    }

    // Calculate costs
    const datasetUrl = `${APIFY_BASE_URL}/datasets/${run.defaultDatasetId}/items?token=${APIFY_API_TOKEN}`;
    const datasetResponse = await fetch(datasetUrl);
    const results = await datasetResponse.json();
    const actualPlacesScraped = results.length;

    console.log('Pay-Per-Event Pricing Calculation:\n');
    console.log('Base Charges:');
    console.log('  â€¢ Actor start: $0.007 per run');
    console.log('  â€¢ Place scraped: $0.004 per place\n');

    const expectedPlaces = 1;
    const expectedCost = 0.007 + (expectedPlaces * 0.004);
    const actualCost = 0.007 + (actualPlacesScraped * 0.004);
    const overcharge = actualCost - expectedCost;

    console.log('Expected Charges (with maxCrawledPlaces=1):');
    console.log(`  â€¢ Actor start: $0.007`);
    console.log(`  â€¢ Places (${expectedPlaces}): ${expectedPlaces} Ã— $0.004 = $${(expectedPlaces * 0.004).toFixed(3)}`);
    console.log(`  â€¢ TOTAL EXPECTED: $${expectedCost.toFixed(3)}\n`);

    console.log('Actual Charges:');
    console.log(`  â€¢ Actor start: $0.007`);
    console.log(`  â€¢ Places (${actualPlacesScraped}): ${actualPlacesScraped} Ã— $0.004 = $${(actualPlacesScraped * 0.004).toFixed(3)}`);
    console.log(`  â€¢ TOTAL ACTUAL: $${actualCost.toFixed(3)}\n`);

    console.log('â•'.repeat(80));
    console.log('5. SPECIFIC CHARGES BELIEVED TO BE INCORRECT\n');
    console.log('â”€'.repeat(80));
    console.log(`âŒ OVERCHARGE: $${overcharge.toFixed(3)}\n`);
    console.log('Breakdown:');
    console.log(`  â€¢ You were charged for ${actualPlacesScraped} places`);
    console.log(`  â€¢ You should have been charged for ${expectedPlaces} place`);
    console.log(`  â€¢ Excess charge: ${actualPlacesScraped - expectedPlaces} places Ã— $0.004 = $${((actualPlacesScraped - expectedPlaces) * 0.004).toFixed(3)}\n`);

    console.log('â•'.repeat(80));
    console.log('6. EVIDENCE OF BUG\n');
    console.log('â”€'.repeat(80));
    console.log('The maxCrawledPlaces parameter was explicitly set to 1 in the input configuration,');
    console.log('but the actor scraped 24 places instead. This violates the documented behavior');
    console.log('of the parameter which should limit the number of places crawled.\n');

    console.log('Comparison with other runs from the same batch:\n');
    console.log('Run            | Restaurant         | maxCrawledPlaces | Actual Scraped | Status');
    console.log('â”€'.repeat(80));
    console.log('OnINoL8W... | Review CafÃ©        | 1                | 1              | âœ… Correct');
    console.log('ucZj9ysfx... | Sala Thai          | 1                | 1              | âœ… Correct');
    console.log('ngUkI0fVu... | Versus Versace     | 1                | 24             | âŒ BUG');
    console.log('u4n8u8Q8W... | Dogmatic           | 1                | 1              | âœ… Correct\n');

    console.log('This demonstrates that the parameter works correctly in most cases,');
    console.log('but failed specifically for this run.\n');

    // Generate summary document
    console.log('â•'.repeat(80));
    console.log('7. DISPUTE SUMMARY\n');
    console.log('â”€'.repeat(80));
    console.log(`
APIFY BILLING DISPUTE

Account: [Your Apify Account Email]
Actor: compass/crawler-google-places
Run ID: ${targetRunId}
Date: ${new Date(run.startedAt).toLocaleDateString()}
Time: ${new Date(run.startedAt).toLocaleTimeString()} UTC

ISSUE:
The maxCrawledPlaces parameter was set to 1 but the actor scraped 24 places,
resulting in an overcharge of $${overcharge.toFixed(3)}.

EVIDENCE:
1. Input parameter maxCrawledPlaces was explicitly set to 1
2. Actor scraped 24 places instead of stopping after 1
3. Other runs in the same batch with identical parameters worked correctly
4. Search query: "Versus Versace Caffe Goa"

REQUESTED RESOLUTION:
Refund of $${overcharge.toFixed(3)} for the ${actualPlacesScraped - expectedPlaces} excess places scraped beyond the configured limit.

RUN DETAILS:
- Run ID: ${targetRunId}
- Started: ${run.startedAt}
- Finished: ${run.finishedAt}
- Build: ${run.buildId}
- Dataset ID: ${run.defaultDatasetId}

Thank you for investigating this billing issue.
`);

    console.log('â•'.repeat(80));
    console.log('\nâœ… Dispute case documentation complete!\n');
    console.log('ðŸ’¡ Next steps:');
    console.log('   1. Copy the dispute summary above');
    console.log('   2. Contact Apify support: https://apify.com/contact');
    console.log('   3. Attach this information to your support ticket');
    console.log('   4. Reference Run ID: ' + targetRunId + '\n');

  } catch (error) {
    console.error('âŒ Error building dispute case:', error.message);
    process.exit(1);
  }
}

buildDisputeCase();
