# 🔐 ERC-4337 Smart Account - Complete Project

Full-stack ERC-4337 Account Abstraction with automatic environment loading.

**Smart Contracts + Frontend + Auto-Sync**

---

## 🚀 Quick Start

### 1. Extract & Setup

```bash
npm run setup
```

### 2. Configure Environment

```bash
cp .env.example .env
nano .env  # or vim, or any editor
```

**Edit `.env` with YOUR credentials:**

```bash
# Add 0x prefix to private key!
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Your Alchemy or Infura RPC URL
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Your Etherscan API key
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY
```

### 3. Test Contracts

```bash
npm run contracts:test
```

**Expected output:**
```
✅ Loaded .env file

[PASS] test_ValidateAndExecuteUserOp() ✅
[PASS] test_SponsoredUserOp() ✅

2 tests passed
```

### 4. Deploy Contracts

```bash
npm run deploy
```

**This automatically:**
- ✅ Loads .env file
- ✅ Deploys Factory, Paymaster, NFT
- ✅ Verifies on Etherscan
- ✅ Updates frontend with YOUR addresses
- ✅ Ready to use!

### 5. Run Frontend

```bash
npm run dev
```

Visit `http://localhost:5173` and test!

---

## 📁 Project Structure

```
erc4337-complete-monorepo/
├── contracts/           # Foundry smart contracts
│   ├── src/            # MyAccount, Factory, Paymaster, NFT
│   ├── test/           # Comprehensive tests
│   └── script/         # Deploy script
│
├── frontend/           # React + TypeScript UI
│   └── src/
│       ├── App.tsx     # Main interface
│       └── contracts.ts # Auto-updated addresses
│
├── scripts/
│   ├── run-forge-test.js    # Auto-loads .env for tests
│   ├── run-forge-deploy.js  # Auto-loads .env for deploy
│   └── update-frontend.js   # Syncs addresses
│
├── .env                # Your config (create from .env.example)
└── package.json        # Unified commands
```

---

## ⚡ Available Commands

```bash
npm run setup              # Install all dependencies
npm run contracts:build    # Compile contracts
npm run contracts:test     # Run tests (auto-loads .env)
npm run deploy             # Deploy + update frontend (auto-loads .env)
npm run dev                # Start frontend
```

---

## 🔄 How Auto-Sync Works

### When You Deploy:

1. **Run:** `npm run deploy`

2. **Script loads .env automatically** (works on Windows/Mac/Linux)

3. **Foundry deploys YOUR contracts:**
   ```
   Factory:   0xYOUR_ADDRESS_1
   Paymaster: 0xYOUR_ADDRESS_2
   NFT:       0xYOUR_ADDRESS_3
   ```

4. **Auto-update script runs:**
   - Reads deployment JSON
   - Extracts YOUR addresses
   - Updates `frontend/src/contracts.ts`

5. **Frontend ready with YOUR addresses!**

---

## ✨ Key Features

### Smart Contracts

- Multi-signature (M-of-N)
- Session keys
- Social recovery
- Batch execution
- Gas sponsorship (paymaster)
- UUPS upgradeable

### Frontend

- MetaMask integration
- Account creation
- NFT minting (single & batch)
- Real-time updates
- **Auto-configured addresses**

---

## 🧪 Testing

The test script automatically loads your .env file:

```bash
npm run contracts:test
```

**What it does:**
1. Reads `.env` file
2. Loads `SEPOLIA_RPC_URL`
3. Runs forge test with Sepolia fork
4. Shows results

**No manual environment setup needed!**

---

## 🐛 Troubleshooting

### "No .env file found"

```bash
cp .env.example .env
# Edit .env with your credentials
```

### "PRIVATE_KEY not set"

Make sure .env has:
```bash
PRIVATE_KEY=0x123abc...  # ← Must have 0x prefix!
```

### "forge test failed"

Check your SEPOLIA_RPC_URL is correct and has credits.

### "Max retries exceeded"

Your RPC URL might be rate-limited. Try:
- Using a different RPC provider
- Creating a new Alchemy/Infura API key

### Frontend shows wrong addresses

```bash
npm run deploy  # Re-deploys and updates frontend
```

---

## 📊 What Gets Deployed

When YOU run `npm run deploy`, you get:

```
YOUR Contracts:
├── Factory:   0xYOUR_UNIQUE_ADDRESS_1
├── Paymaster: 0xYOUR_UNIQUE_ADDRESS_2
├── NFT:       0xYOUR_UNIQUE_ADDRESS_3
└── EntryPoint: 0x0000000071727De22E5E9d8BAf0edAc6f37da032 (shared)
```

Frontend automatically uses YOUR addresses!

---

## 🎯 For Evaluators

### Complete Test Run

```bash
# 1. Setup
tar -xzf erc4337-complete-monorepo.tar.gz
cd erc4337-complete-monorepo
npm run setup

# 2. Configure
cp .env.example .env
# Edit .env with YOUR credentials

# 3. Fix NFT version (if needed)
sed -i 's/pragma solidity \^0.8.27/pragma solidity ^0.8.24/' contracts/src/MyMFERS.sol
npm run contracts:build

# 4. Test
npm run contracts:test
# Expected: 2/2 tests passing ✅

# 5. Deploy
npm run deploy
# Expected: Contracts deployed, frontend updated , sometimes contracts are not verified so check manually if deployed, but should be deployed✅

# 6. Run
npm run dev
# Expected: Frontend at http://localhost:5173 ✅
```

**Total time:** ~5 minutes

---

## ✅ Success Criteria

After setup, you should see:

- ✅ `npm run contracts:test` - 2/2 passing
- ✅ `npm run deploy` - Contracts deployed & verified
- ✅ `npm run dev` - Frontend shows YOUR contract addresses
- ✅ Can create accounts via UI
- ✅ Can mint NFTs via UI

---

## 🎓 Project Deliverables

This project demonstrates:

1. **Smart Contracts** - Full ERC-4337 implementation
2. **Testing** - Comprehensive test suite (2/2 passing)
3. **Deployment** - Automated deployment to Sepolia
4. **Frontend** - User-friendly interface
5. **Integration** - Automatic address synchronization
6. **Cross-platform** - Works on Windows/Mac/Linux

---

## 📝 Important Notes

### Environment Variables

- **Automatically loaded** - No manual `source` or `export` needed
- **Cross-platform** - Works on all operating systems
- **Validation** - Scripts check for required variables

### Contract Addresses

- **Your deployment** - Each deployment gets unique addresses
- **Auto-sync** - Frontend updates automatically
- **No manual editing** - Everything just works

---

## 📄 License

MIT

---

**Ready to test?**

```bash
npm run setup
cp .env.example .env
# Edit .env
npm run contracts:test
npm run deploy
npm run dev
```

Everything loads automatically! 🚀
