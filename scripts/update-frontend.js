#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📝 Updating frontend with deployed contract addresses...\n');

// Read the latest deployment
const broadcastPath = path.join(__dirname, '../contracts/broadcast/Deploy.s.sol/11155111/run-latest.json');

if (!fs.existsSync(broadcastPath)) {
  console.error('❌ No deployment found! Please run: npm run contracts:deploy first');
  process.exit(1);
}

const deployment = JSON.parse(fs.readFileSync(broadcastPath, 'utf8'));

// Extract deployed addresses
let factory, paymaster, nft;

deployment.transactions.forEach(tx => {
  if (tx.transactionType === 'CREATE') {
    const contractName = tx.contractName;
    const address = tx.contractAddress;
    
    if (contractName === 'MyAccountFactory') factory = address;
    if (contractName === 'MyPaymaster') paymaster = address;
    if (contractName === 'MyMFERS') nft = address;
  }
});

if (!factory || !paymaster || !nft) {
  console.error('❌ Could not find all contract addresses in deployment');
  process.exit(1);
}

console.log('✅ Found deployed contracts:');
console.log(`   Factory:   ${factory}`);
console.log(`   Paymaster: ${paymaster}`);
console.log(`   NFT:       ${nft}\n`);

// Update frontend contracts.ts
const contractsPath = path.join(__dirname, '../frontend/src/contracts.ts');
const contractsContent = `// Auto-generated from deployment - DO NOT EDIT MANUALLY
// Last updated: ${new Date().toISOString()}

export const CONTRACTS = {
  FACTORY: '${factory}',
  PAYMASTER: '${paymaster}',
  NFT: '${nft}',
  ENTRYPOINT: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
}

export const FACTORY_ABI = [
  'function createAccount(address[] calldata owners, uint256 threshold, address[] calldata guardians, uint256 guardianThreshold, uint256 salt) public returns (address)',
  'function getAddress(address[] calldata owners, uint256 threshold, address[] calldata guardians, uint256 guardianThreshold, uint256 salt) public view returns (address)',
]

export const ACCOUNT_ABI = [
  'function execute(address dest, uint256 value, bytes calldata functionData) external',
  'function executeBatch(address[] calldata dest, uint256[] calldata value, bytes[] calldata data) external',
  'function threshold() public view returns (uint256)',
  'function getOwners() external view returns (address[] memory)',
  'function isOwner(address) public view returns (bool)',
  'function setSessionKey(address key, uint48 expiresAt, bool oneTime) external',
  'function revokeSessionKey(address key) external',
  'function getSessionKey(address key) external view returns (tuple(uint48 expiresAt, bool oneTime, bool used))',
  'function addOwner(address newOwner) external',
  'function removeOwner(address owner) external',
  'function setThreshold(uint256 newThreshold) external',
  'function setGuardian(address g, bool allowed) external',
  'function isGuardian(address) public view returns (bool)',
  'function approveRecovery(bytes32 recoveryHash) external',
  'function executeRecovery(address[] calldata newOwners, uint256 newThreshold) external',
]

export const NFT_ABI = [
  'function mint(address to) external returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
]

export const PAYMASTER_ABI = [
  'function deposit() public payable',
  'function withdrawTo(address payable withdrawAddress, uint256 amount) external',
]
`;

fs.writeFileSync(contractsPath, contractsContent);

console.log('✅ Frontend updated successfully!\n');
console.log('🎉 You can now run: npm run dev\n');
