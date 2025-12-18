const { spawn } = require('child_process');
const path = require('path');

console.log('🔄 Restarting backend server...');

// Kill existing node processes
const killProcess = spawn('taskkill', ['/F', '/IM', 'node.exe'], {
  stdio: 'inherit',
  shell: true
});

killProcess.on('close', (code) => {
  console.log('✅ Previous processes terminated');
  
  // Start new server
  console.log('🚀 Starting new server...');
  const server = spawn('npm', ['start'], {
    cwd: path.resolve(__dirname),
    stdio: 'inherit',
    shell: true
  });
  
  server.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
  
  server.on('error', (err) => {
    console.error('Failed to start server:', err);
  });
});
