import { ethers } from 'ethers'

const PIMLICO_API_KEY = "pim_GT2fGostX279KhCRWvECRs"
const CHAIN_ID = 11155111

const bundlerUrl = `https://api.pimlico.io/v2/${CHAIN_ID}/rpc?apikey=${PIMLICO_API_KEY}`

// Nonce cache - persists across calls
const nonceCache = new Map<string, bigint>()

export interface UserOperationV7 {
  sender: string
  nonce: bigint
  initCode: string
  callData: string
  accountGasLimits: string
  preVerificationGas: bigint
  gasFees: string
  paymasterAndData: string
  signature: string
}

interface UserOperationRpc {
  sender: string
  nonce: string
  callData: string
  callGasLimit: string
  verificationGasLimit: string
  preVerificationGas: string
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  signature: string
  paymaster?: string
  paymasterVerificationGasLimit?: string
  paymasterPostOpGasLimit?: string
  paymasterData?: string
}

const GAS_LIMITS = {
  verificationGasLimit: 500000n,
  callGasLimit: 500000n,
  preVerificationGas: 100000n,
  paymasterVerificationGasLimit: 100000n,
  paymasterPostOpGasLimit: 50000n,
  maxFeePerGas: 50000000000n,
  maxPriorityFeePerGas: 2000000000n
}

function packAccountGasLimits(verificationGasLimit: bigint, callGasLimit: bigint): string {
  const verification = verificationGasLimit.toString(16).padStart(32, '0')
  const call = callGasLimit.toString(16).padStart(32, '0')
  return `0x${verification}${call}`
}

function packGasFees(maxPriorityFeePerGas: bigint, maxFeePerGas: bigint): string {
  const priority = maxPriorityFeePerGas.toString(16).padStart(32, '0')
  const max = maxFeePerGas.toString(16).padStart(32, '0')
  return `0x${priority}${max}`
}

function packPaymasterAndData(paymaster: string): string {
  const paymasterHex = paymaster.slice(2).toLowerCase()
  const verificationGas = GAS_LIMITS.paymasterVerificationGasLimit.toString(16).padStart(32, '0')
  const postOpGas = GAS_LIMITS.paymasterPostOpGasLimit.toString(16).padStart(32, '0')
  return `0x${paymasterHex}${verificationGas}${postOpGas}`
}

function userOpToRpc(userOp: UserOperationV7, paymasterAddress?: string): UserOperationRpc {
  const rpcOp: UserOperationRpc = {
    sender: userOp.sender,
    nonce: `0x${userOp.nonce.toString(16)}`,
    callData: userOp.callData,
    callGasLimit: `0x${GAS_LIMITS.callGasLimit.toString(16)}`,
    verificationGasLimit: `0x${GAS_LIMITS.verificationGasLimit.toString(16)}`,
    preVerificationGas: `0x${GAS_LIMITS.preVerificationGas.toString(16)}`,
    maxFeePerGas: `0x${GAS_LIMITS.maxFeePerGas.toString(16)}`,
    maxPriorityFeePerGas: `0x${GAS_LIMITS.maxPriorityFeePerGas.toString(16)}`,
    signature: userOp.signature
  }

  if (paymasterAddress) {
    rpcOp.paymaster = paymasterAddress
    rpcOp.paymasterVerificationGasLimit = `0x${GAS_LIMITS.paymasterVerificationGasLimit.toString(16)}`
    rpcOp.paymasterPostOpGasLimit = `0x${GAS_LIMITS.paymasterPostOpGasLimit.toString(16)}`
    rpcOp.paymasterData = '0x'
  }

  return rpcOp
}

async function bundlerRpc(method: string, params: unknown[]): Promise<any> {
  console.log('📤 Bundler RPC:', method)
  
  const response = await fetch(bundlerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    })
  })

  const data = await response.json()
  console.log('📥 Bundler response:', data)
  
  if (data.error) {
    let errorMsg = 'Unknown bundler error'
    if (typeof data.error === 'string') {
      errorMsg = data.error
    } else if (data.error.message) {
      errorMsg = data.error.message
    } else if (data.error.data?.message) {
      errorMsg = data.error.data.message
    } else {
      errorMsg = JSON.stringify(data.error)
    }
    throw new Error(errorMsg)
  }
  
  return data.result
}

export async function getNonce(
  provider: ethers.Provider,
  entryPointAddress: string,
  accountAddress: string
): Promise<bigint> {
  const entryPoint = new ethers.Contract(
    entryPointAddress,
    ['function getNonce(address, uint192) view returns (uint256)'],
    provider
  )
  
  // Get on-chain nonce
  const onChainNonce = await entryPoint.getNonce(accountAddress, 0n)
  
  // Get cached nonce
  const cachedNonce = nonceCache.get(accountAddress.toLowerCase())
  
  console.log('🔢 Nonce calculation:')
  console.log('  Account:', accountAddress)
  console.log('  On-chain nonce:', onChainNonce.toString())
  console.log('  Cached nonce:', cachedNonce?.toString() || 'none')
  console.log('  Cache size:', nonceCache.size)
  console.log('  Cache contents:', Array.from(nonceCache.entries()).map(([k, v]) => `${k}: ${v}`))
  
  // IMPORTANT: If cached nonce is more than 1 ahead of on-chain, it's stale (from failed tx)
  // In this case, reset to on-chain nonce
  let nonce = onChainNonce
  if (cachedNonce !== undefined) {
    if (cachedNonce === onChainNonce || cachedNonce === onChainNonce + 1n) {
      // Cache is valid (same as on-chain or exactly 1 ahead for pending tx)
      nonce = cachedNonce
      console.log('  ✅ Using cached nonce:', nonce.toString())
    } else if (cachedNonce > onChainNonce + 1n) {
      // Cache is stale (more than 1 ahead = previous tx failed)
      console.log('  ⚠️ Cache is stale! Resetting to on-chain nonce')
      nonce = onChainNonce
    } else {
      // Cache is behind on-chain (tx confirmed)
      nonce = onChainNonce
      console.log('  ✅ Using on-chain nonce:', nonce.toString())
    }
  } else {
    console.log('  ✅ Using on-chain nonce (no cache):', nonce.toString())
  }
  
  // Update cache for next call
  nonceCache.set(accountAddress.toLowerCase(), nonce + 1n)
  console.log('  📝 Updated cache to:', (nonce + 1n).toString())
  
  return nonce
}

export async function buildUserOp(
  provider: ethers.Provider,
  entryPointAddress: string,
  accountAddress: string,
  target: string,
  value: bigint,
  callData: string,
  paymasterAddress?: string
): Promise<UserOperationV7> {
  console.log('🔧 Building UserOp...')
  
  const nonce = await getNonce(provider, entryPointAddress, accountAddress)

  const accountAbi = ['function execute(address,uint256,bytes)']
  const iface = new ethers.Interface(accountAbi)
  const executeCallData = iface.encodeFunctionData('execute', [target, value, callData])

  const paymasterAndData = paymasterAddress ? packPaymasterAndData(paymasterAddress) : '0x'

  const userOp: UserOperationV7 = {
    sender: accountAddress,
    nonce,
    initCode: '0x',
    callData: executeCallData,
    accountGasLimits: packAccountGasLimits(GAS_LIMITS.verificationGasLimit, GAS_LIMITS.callGasLimit),
    preVerificationGas: GAS_LIMITS.preVerificationGas,
    gasFees: packGasFees(GAS_LIMITS.maxPriorityFeePerGas, GAS_LIMITS.maxFeePerGas),
    paymasterAndData,
    signature: '0x'
  }

  console.log('✅ UserOp built with nonce:', nonce.toString())
  return userOp
}

export async function getUserOpHash(
  provider: ethers.Provider,
  entryPointAddress: string,
  userOp: UserOperationV7
): Promise<string> {
  const entryPoint = new ethers.Contract(
    entryPointAddress,
    ['function getUserOpHash((address,uint256,bytes,bytes,bytes32,uint256,bytes32,bytes,bytes)) view returns (bytes32)'],
    provider
  )

  const userOpArray = [
    userOp.sender,
    userOp.nonce,
    userOp.initCode,
    userOp.callData,
    userOp.accountGasLimits,
    userOp.preVerificationGas,
    userOp.gasFees,
    userOp.paymasterAndData,
    userOp.signature
  ]

  const hash = await entryPoint.getUserOpHash(userOpArray)
  console.log('🔐 UserOp hash:', hash)
  return hash
}

export async function submitUserOp(
  entryPointAddress: string,
  userOp: UserOperationV7,
  paymasterAddress?: string
): Promise<string> {
  console.log('📨 Submitting UserOp to bundler...')
  console.log('  Nonce being submitted:', userOp.nonce.toString())
  
  const rpcUserOp = userOpToRpc(userOp, paymasterAddress)
  
  const userOpHash = await bundlerRpc('eth_sendUserOperation', [
    rpcUserOp,
    entryPointAddress
  ])

  console.log('✅ UserOp submitted:', userOpHash)
  return userOpHash
}

export async function waitForUserOpReceipt(userOpHash: string): Promise<string> {
  console.log('⏳ Waiting for UserOp receipt...')
  
  let receipt = null
  let attempts = 0
  const maxAttempts = 60

  while (!receipt && attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    
    try {
      receipt = await bundlerRpc('eth_getUserOperationReceipt', [userOpHash])
    } catch {
      // Not ready yet
    }
    attempts++
  }

  if (!receipt) {
    throw new Error('Timeout waiting for UserOp receipt')
  }

  const txHash = receipt.receipt.transactionHash
  console.log('✅ Transaction confirmed:', txHash)
  return txHash
}

// Export function to manually clear cache if needed
export function clearNonceCache() {
  nonceCache.clear()
  console.log('🗑️ Nonce cache cleared')
}