#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load .env file
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.error('Please copy .env.example to .env and configure it.');
  process.exit(1);
}

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

// Validate required variables
if (!process.env.PRIVATE_KEY) {
  console.error('❌ PRIVATE_KEY not set in .env');
  process.exit(1);
}

if (!process.env.SEPOLIA_RPC_URL) {
  console.error('❌ SEPOLIA_RPC_URL not set in .env');
  process.exit(1);
}

console.log('🚀 Deploying contracts to Sepolia...\n');

try {
  execSync(
    'cd contracts && forge script script/Deploy.s.sol:DeployScript --rpc-url sepolia --broadcast --verify',
    {
      stdio: 'inherit',
      env: { ...process.env }
    }
  );
  console.log('\n✅ Deployment complete!');
} catch (error) {
  console.error('\n❌ Deployment failed');
  process.exit(1);
}
