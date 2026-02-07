#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load .env file
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        process.env[key] = value;
      }
    }
  });
  console.log('✅ Loaded .env file\n');
} else {
  console.log('⚠️  No .env file found, using defaults\n');
}

// Run forge test
const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo';

try {
  execSync(`cd contracts && forge test -vvv --fork-url ${rpcUrl}`, {
    stdio: 'inherit',
    env: { ...process.env }
  });
} catch (error) {
  console.error('\n❌ Tests failed');
  process.exit(1);
}
