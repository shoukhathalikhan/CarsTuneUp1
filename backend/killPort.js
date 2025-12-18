const { exec } = require('child_process');

exec('netstat -ano | findstr :5000', (error, stdout, stderr) => {
  if (stdout) {
    const lines = stdout.split('\n');
    lines.forEach(line => {
      const match = line.match(/\s+(\d+)$/);
      if (match) {
        const pid = match[1];
        console.log(`Killing process ${pid} on port 5000...`);
        exec(`taskkill /PID ${pid} /F`, (killError) => {
          if (killError) {
            console.error(`Failed to kill process ${pid}:`, killError.message);
          } else {
            console.log(`Successfully killed process ${pid}`);
          }
        });
      }
    });
  } else {
    console.log('No processes found on port 5000');
  }
});
