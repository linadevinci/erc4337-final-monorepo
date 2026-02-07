#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📝 Extracting deployed contract addresses...\n');

// Read the latest deployment
const broadcastPath = path.join(__dirname, '../contracts/broadcast/Deploy.s.sol/11155111/run-latest.json');

if (!fs.existsSync(broadcastPath)) {
  console.error('❌ No deployment found!');
  console.error('Run: npm run contracts:deploy first\n');
  process.exit(1);
}

const deployment = JSON.parse(fs.readFileSync(broadcastPath, 'utf8'));

// Extract deployed addresses - ONLY from CREATE transactions
let factory, paymaster, nft, accountImpl;

deployment.transactions.forEach(tx => {
  // Only look at CREATE transactions (not CALL)
  if (tx.transactionType === 'CREATE' && tx.contractName && tx.contractAddress) {
    console.log(`   Found: ${tx.contractName} at ${tx.contractAddress}`);
    
    if (tx.contractName === 'MyAccountFactory') {
      factory = tx.contractAddress;
    }
    if (tx.contractName === 'MyPaymaster') {
      paymaster = tx.contractAddress;
    }
    if (tx.contractName === 'MyMFERS') {
      nft = tx.contractAddress;
    }
    if (tx.contractName === 'MyAccount') {
      accountImpl = tx.contractAddress;
    }
  }
});

if (!factory || !paymaster || !nft) {
  console.error('\n❌ Could not find all contract addresses in deployment');
  console.error(`   Factory: ${factory || 'NOT FOUND'}`);
  console.error(`   Paymaster: ${paymaster || 'NOT FOUND'}`);
  console.error(`   NFT: ${nft || 'NOT FOUND'}`);
  process.exit(1);
}

console.log('\n✅ Extracted contract addresses:');
console.log(`   Factory:   ${factory}`);
console.log(`   Paymaster: ${paymaster}`);
console.log(`   NFT:       ${nft}`);
if (accountImpl) {
  console.log(`   Account Implementation: ${accountImpl}`);
}

// Create deployed config
const config = {
  network: 'sepolia',
  chainId: 11155111,
  contracts: {
    factory: factory,
    paymaster: paymaster,
    nft: nft,
    entrypoint: '0x0000000071727De22E5E9d8BAf0edAc6f37da032'
  },
  deployedAt: new Date().toISOString()
};

// Write to frontend public folder
const configPath = path.join(__dirname, '../frontend/public/deployed-contracts.json');

// Create public folder if doesn't exist
const publicDir = path.dirname(configPath);
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

console.log('\n✅ Config file created at: frontend/public/deployed-contracts.json');
console.log('✅ Frontend will load these addresses dynamically!\n');