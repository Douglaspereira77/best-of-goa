const fs = require('fs');
const path = require('path');

// Read the session file
const sessionFile = process.argv[2];
const lines = fs.readFileSync(sessionFile, 'utf-8').split('\n').filter(line => line.trim());

let operations = [];
let currentOp = null;

lines.forEach((line, index) => {
  try {
    const entry = JSON.parse(line);

    // Track usage data
    if (entry.type === 'usage') {
      const timestamp = entry.timestamp ? new Date(entry.timestamp) : null;
      const hour = timestamp ? timestamp.getHours() : null;

      // Only include entries from 12pm-5pm (noon to 5pm)
      if (hour !== null && hour >= 12 && hour < 17) {
        const inputTokens = entry.usage?.input_tokens || 0;
        const outputTokens = entry.usage?.output_tokens || 0;
        const cacheCreation = entry.usage?.cache_creation_input_tokens || 0;
        const cacheRead = entry.usage?.cache_read_input_tokens || 0;
        const totalTokens = inputTokens + outputTokens + cacheCreation + cacheRead;

        // Estimate cost (rough calculation)
        // Sonnet 4.5: $3/M input, $15/M output, $3.75/M cache write, $0.30/M cache read
        const cost = (inputTokens * 3 / 1000000) +
                     (outputTokens * 15 / 1000000) +
                     (cacheCreation * 3.75 / 1000000) +
                     (cacheRead * 0.30 / 1000000);

        operations.push({
          timestamp: timestamp ? timestamp.toISOString() : 'unknown',
          time: timestamp ? timestamp.toLocaleTimeString() : 'unknown',
          inputTokens,
          outputTokens,
          cacheCreation,
          cacheRead,
          totalTokens,
          cost: cost.toFixed(4),
          model: entry.model || 'unknown'
        });
      }
    }
  } catch (e) {
    // Skip invalid JSON lines
  }
});

// Sort by cost (descending)
operations.sort((a, b) => parseFloat(b.cost) - parseFloat(a.cost));

// Display top 20 most expensive operations
console.log('\n=== TOP 20 MOST EXPENSIVE OPERATIONS (12pm-5pm) ===\n');
console.log('Time     | Model        | Input    | Output   | Cache Create | Cache Read  | Total      | Cost');
console.log('---------|--------------|----------|----------|--------------|-------------|------------|--------');

operations.slice(0, 20).forEach(op => {
  console.log(
    `${op.time.padEnd(8)} | ` +
    `${op.model.substring(0, 12).padEnd(12)} | ` +
    `${op.inputTokens.toString().padStart(8)} | ` +
    `${op.outputTokens.toString().padStart(8)} | ` +
    `${op.cacheCreation.toString().padStart(12)} | ` +
    `${op.cacheRead.toString().padStart(11)} | ` +
    `${op.totalTokens.toString().padStart(10)} | ` +
    `$${op.cost}`
  );
});

// Summary stats
const totalCost = operations.reduce((sum, op) => sum + parseFloat(op.cost), 0);
const totalTokens = operations.reduce((sum, op) => sum + op.totalTokens, 0);

console.log('\n=== SUMMARY ===');
console.log(`Total operations in 12pm-5pm window: ${operations.length}`);
console.log(`Total tokens: ${totalTokens.toLocaleString()}`);
console.log(`Total estimated cost: $${totalCost.toFixed(2)}`);
