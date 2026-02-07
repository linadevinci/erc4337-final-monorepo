// Dynamic contract addresses loader
// Automatically loads from /deployed-contracts.json

interface ContractsConfig {
  FACTORY: string;
  PAYMASTER: string;
  NFT: string;
  ENTRYPOINT: string;
}

// Default fallback addresses (demo mode)
let CONTRACTS: ContractsConfig = {
  FACTORY: '0x157F0193B557E79c82a87a5199c16f0a672fEcc6',
  PAYMASTER: '0xD8407E3f8b1a7df59e52A2bbf17401cA6D4C4bc8',
  NFT: '0xE6347646b9B2939B7c15Dbc01451A450218e2ADF',
  ENTRYPOINT: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
};

// Load deployed contracts from JSON
async function loadContracts() {
  try {
    const response = await fetch('/deployed-contracts.json');
    if (response.ok) {
      const data = await response.json();
      
      // Update CONTRACTS with deployed addresses
      CONTRACTS = {
        FACTORY: data.contracts.factory,
        PAYMASTER: data.contracts.paymaster,
        NFT: data.contracts.nft,
        ENTRYPOINT: data.contracts.entrypoint,
      };
      
      console.log('✅ Loaded deployed contracts:', CONTRACTS);
      return true;
    }
  } catch (error) {
    console.warn('⚠️  Using fallback addresses (deployed-contracts.json not found)');
  }
  return false;
}

// Initialize immediately
const configLoaded = loadContracts();

// Export function to ensure config is loaded before use
export async function ensureContractsLoaded() {
  await configLoaded;
  return CONTRACTS;
}

// Export function to get current contracts
export function getContracts(): ContractsConfig {
  return CONTRACTS;
}

// Export the CONTRACTS object (will be updated after load)
export { CONTRACTS };

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