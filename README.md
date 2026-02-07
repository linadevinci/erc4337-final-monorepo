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

# Expected: Contracts deployed, frontend updated , sometimes contracts are not verified so check manually if deployed, but should be deployed✅


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



## 🎓 Project Deliverables

This project demonstrates:

1. **Smart Contracts** - Full ERC-4337 implementation
2. **Testing** - Comprehensive test suite (2/2 passing)
3. **Deployment** - Automated deployment to Sepolia
4. **Frontend** - User-friendly interface
5. **Integration** - Automatic address synchronization
6. **Cross-platform** - Works on Windows/Mac/Linux

