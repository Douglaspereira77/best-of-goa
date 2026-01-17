// Workaround script to handle Next.js trace file permission errors on Windows
const { spawn } = require('child_process');
const path = require('path');

const nextDev = spawn('npx', ['next', 'dev'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: '1',
  },
});

nextDev.on('error', (error) => {
  // Ignore trace file permission errors
  if (error.message && error.message.includes('trace')) {
    console.warn('Warning: Trace file permission error (non-fatal)');
    return;
  }
  console.error('Error:', error);
});

nextDev.on('exit', (code) => {
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  nextDev.kill('SIGINT');
});
process.on('SIGTERM', () => {
  nextDev.kill('SIGTERM');
});






























