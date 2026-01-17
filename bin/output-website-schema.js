require('dotenv').config({ path: '.env.local' });

// Import the generator function
const { generateWebSiteSchema } = require('../src/lib/schema/global/website.ts');

// Generate the schema
const websiteSchema = generateWebSiteSchema();

// Output as formatted JSON
console.log(JSON.stringify(websiteSchema, null, 2));
