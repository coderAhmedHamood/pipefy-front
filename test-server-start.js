// Simple test to start the backend server
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Pipefy Backend Server...');
console.log('📁 Current directory:', process.cwd());

// Change to api directory and start server
const apiPath = path.join(__dirname, 'api');
console.log('📁 API directory:', apiPath);

const serverProcess = spawn('node', ['server.js'], {
  cwd: apiPath,
  stdio: 'inherit',
  shell: true
});

serverProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
});

serverProcess.on('close', (code) => {
  console.log(`🔚 Server process exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  serverProcess.kill('SIGTERM');
  process.exit(0);
});
