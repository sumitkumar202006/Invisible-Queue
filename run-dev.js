import { spawn } from 'child_process';
import process from 'process';

console.log('====================================================');
console.log('   Starting Invisible Queue (Full-Stack Dev Mode)   ');
console.log('====================================================');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// 1. Start Server (Port 5000)
const server = spawn(npmCmd, ['run', 'dev'], {
  cwd: './server',
  stdio: 'inherit',
  shell: true
});

// 2. Start Client (Port 5173)
const client = spawn(npmCmd, ['run', 'dev'], {
  cwd: './client',
  stdio: 'inherit',
  shell: true
});

const cleanup = () => {
  console.log('\nShutting down dev servers...');
  server.kill();
  client.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
