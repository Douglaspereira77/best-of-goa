const fs = require('fs');

const sessionFile = process.argv[2];
const lines = fs.readFileSync(sessionFile, 'utf-8').split('\n').filter(line => line.trim());

let tasks = [];

lines.forEach((line) => {
  try {
    const entry = JSON.parse(line);

    // Look for assistant messages with usage data
    if (entry.type === 'assistant' && entry.message && entry.message.usage && entry.timestamp) {
      const timestamp = new Date(entry.timestamp);
      const hour = timestamp.getHours();

      // Only 12pm-5pm (hours 12-16)
      if (hour >= 12 && hour < 17) {
        const usage = entry.message.usage;
        const inputTokens = usage.input_tokens || 0;
        const outputTokens = usage.output_tokens || 0;
        const cacheCreation = usage.cache_creation_input_tokens || 0;
        const cacheRead = usage.cache_read_input_tokens || 0;
        const totalTokens = inputTokens + outputTokens + cacheCreation + cacheRead;

        // Estimate cost
        const cost = (inputTokens * 3 / 1000000) +
                     (outputTokens * 15 / 1000000) +
                     (cacheCreation * 3.75 / 1000000) +
                     (cacheRead * 0.30 / 1000000);

        // Extract summary from assistant response
        let taskSummary = 'Unknown task';
        if (entry.message.content && Array.isArray(entry.message.content)) {
          const textContent = entry.message.content.find(c => c.type === 'text');
          if (textContent && textContent.text) {
            // Try to find "COMPLETION SUMMARY:"
            const summaryMatch = textContent.text.match(/COMPLETION SUMMARY:([^\n]+)/);
            if (summaryMatch) {
              taskSummary = summaryMatch[1].trim().substring(0, 100);
            } else {
              // Get first line of response
              taskSummary = textContent.text.split('\n')[0].substring(0, 100);
            }
          }
        }

        tasks.push({
          timestamp: timestamp.toISOString(),
          time: timestamp.toLocaleTimeString(),
          model: entry.message.model || 'unknown',
          inputTokens,
          outputTokens,
          cacheCreation,
          cacheRead,
          totalTokens,
          cost,
          taskSummary
        });
      }
    }
  } catch (e) {
    // Skip invalid lines
  }
});

// Sort by cost descending
tasks.sort((a, b) => b.cost - a.cost);

console.log('\n=== TOP 20 MOST EXPENSIVE TASKS (12pm-5pm) ===\n');
tasks.slice(0, 20).forEach((task, i) => {
  console.log(`${i + 1}. [${task.time}] $${task.cost.toFixed(4)}`);
  console.log(`   Model: ${task.model}`);
  console.log(`   Tokens: ${task.totalTokens.toLocaleString()} (Input: ${task.inputTokens.toLocaleString()}, Output: ${task.outputTokens.toLocaleString()}, Cache: ${(task.cacheCreation + task.cacheRead).toLocaleString()})`);
  console.log(`   Task: ${task.taskSummary}`);
  console.log('');
});

// Summary
const totalCost = tasks.reduce((sum, t) => sum + t.cost, 0);
const totalTokens = tasks.reduce((sum, t) => sum + t.totalTokens, 0);

console.log('=== SUMMARY ===');
console.log(`Total responses in 12pm-5pm: ${tasks.length}`);
console.log(`Total tokens: ${totalTokens.toLocaleString()}`);
console.log(`Total cost: $${totalCost.toFixed(2)}`);
