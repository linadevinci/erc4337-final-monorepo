import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { ensureContractsLoaded, getContracts, FACTORY_ABI, ACCOUNT_ABI, NFT_ABI } from './contracts'
import MultiSigDemo from './MultiSigDemo'
import SessionKeysDemo from './SessionKeysDemo'
import SocialRecoveryDemo from './SocialRecoveryDemo'

type TabType = 'basic' | 'multisig' | 'session' | 'recovery'

function App() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [userAddress, setUserAddress] = useState<string>('')
  const [accountAddress, setAccountAddress] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [configLoaded, setConfigLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('basic')
  
  const [salt, setSalt] = useState('0')
  const [nftBalance, setNftBalance] = useState('0')
  const [txHash, setTxHash] = useState('')

  useEffect(() => {
    ensureContractsLoaded().then(() => {
      setConfigLoaded(true)
      console.log('📍 Active contracts:', getContracts())
    })
    
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum)
      setProvider(provider)
    }
  }, [])

  const connectWallet = async () => {
    if (!provider) {
      setMessage({ type: 'error', text: 'Please install MetaMask!' })
      return
    }

    try {
      setLoading(true)
      await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      
      setSigner(signer)
      setUserAddress(address)
      setMessage({ type: 'success', text: `Connected: ${address}` })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const calculateAccountAddress = async () => {
    if (!signer || !configLoaded) return

    try {
      setLoading(true)
      const CONTRACTS = getContracts()
      const factory = new ethers.Contract(CONTRACTS.FACTORY, FACTORY_ABI, signer)
      
      const owners = [userAddress]
      const guardians: string[] = []
      const threshold = 1
      const saltValue = parseInt(salt)
      
      const address = await factory.getFunction("getAddress")(
        owners,
        threshold,
        guardians,
        0,
        saltValue
      )
      
      console.log('🔍 Calculated account address:', address)
      setAccountAddress(address)
      setMessage({ type: 'success', text: `Account address calculated! (Not deployed yet)` })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const createAccount = async () => {
    if (!signer || !configLoaded) return

    try {
      setLoading(true)
      const CONTRACTS = getContracts()
      const factory = new ethers.Contract(CONTRACTS.FACTORY, FACTORY_ABI, signer)
      
      const owners = [userAddress]
      const guardians: string[] = []
      const threshold = 1
      
      const tx = await factory.createAccount(
        owners,
        threshold,
        guardians,
        0,
        parseInt(salt)
      )
      
      setMessage({ type: 'success', text: 'Creating account...' })
      const receipt = await tx.wait()
      setTxHash(receipt.hash)
      
      const address = await factory.getFunction("getAddress")(
        owners,
        threshold,
        guardians,
        0,
        parseInt(salt)
      )
      
      setAccountAddress(address)
      setMessage({ type: 'success', text: `Account created successfully!` })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const checkAccountExists = async () => {
    if (!provider || !accountAddress) return

    try {
      const code = await provider.getCode(accountAddress)
      const exists = code !== '0x'
      setMessage({ 
        type: exists ? 'success' : 'error', 
        text: exists ? '✅ Account exists on-chain!' : '❌ Account not deployed yet' 
      })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  const fundAccount = async () => {
    if (!signer || !accountAddress) return

    try {
      setLoading(true)
      const tx = await signer.sendTransaction({
        to: accountAddress,
        value: ethers.parseEther('0.01')
      })
      
      setMessage({ type: 'success', text: 'Sending 0.01 ETH...' })
      const receipt = await tx.wait()
      setTxHash(receipt.hash)
      setMessage({ type: 'success', text: 'Account funded with 0.01 ETH!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const mintNFT = async () => {
    if (!signer || !accountAddress || !configLoaded) return

    try {
      setLoading(true)
      const CONTRACTS = getContracts()
      const account = new ethers.Contract(accountAddress, ACCOUNT_ABI, signer)
      const nft = new ethers.Contract(CONTRACTS.NFT, NFT_ABI, signer)
      
      const mintCallData = nft.interface.encodeFunctionData('mint', [accountAddress])
      const tx = await account.execute(CONTRACTS.NFT, 0, mintCallData)
      setMessage({ type: 'success', text: 'Minting NFT...' })
      
      const receipt = await tx.wait()
      setTxHash(receipt.hash)
      setMessage({ type: 'success', text: 'NFT minted successfully!' })
      
      await checkNFTBalance()
    } catch (error: any) {
      console.error('Mint error:', error)
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const mintBatch = async () => {
    if (!signer || !accountAddress || !configLoaded) return

    try {
      setLoading(true)
      const CONTRACTS = getContracts()
      const account = new ethers.Contract(accountAddress, ACCOUNT_ABI, signer)
      const nft = new ethers.Contract(CONTRACTS.NFT, NFT_ABI, signer)
      
      const targets = [CONTRACTS.NFT, CONTRACTS.NFT, CONTRACTS.NFT]
      const values = [0, 0, 0]
      const datas = [
        nft.interface.encodeFunctionData('mint', [accountAddress]),
        nft.interface.encodeFunctionData('mint', [accountAddress]),
        nft.interface.encodeFunctionData('mint', [accountAddress]),
      ]
      
      const tx = await account.executeBatch(targets, values, datas)
      setMessage({ type: 'success', text: 'Batch minting 3 NFTs...' })
      
      const receipt = await tx.wait()
      setTxHash(receipt.hash)
      setMessage({ type: 'success', text: 'Batch mint successful! ⚡ Gas saved vs 3 separate txs' })
      
      await checkNFTBalance()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const checkNFTBalance = async () => {
    if (!provider || !accountAddress || !configLoaded) return

    try {
      const CONTRACTS = getContracts()
      const nft = new ethers.Contract(CONTRACTS.NFT, NFT_ABI, provider)
      const balance = await nft.balanceOf(accountAddress)
      setNftBalance(balance.toString())
    } catch (error: any) {
      console.error('Error checking NFT balance:', error)
    }
  }

  useEffect(() => {
    if (accountAddress && provider && configLoaded) {
      checkNFTBalance()
    }
  }, [accountAddress, provider, configLoaded])

  const CONTRACTS = configLoaded ? getContracts() : { FACTORY: '', PAYMASTER: '', NFT: '', ENTRYPOINT: '' }

  return (
    <div className="container">
      <div className="header">
        <h1>🔐 ERC-4337 Smart Account Workshop</h1>
        <p>Complete Account Abstraction Demo - Sepolia Testnet</p>
      </div>

      {!configLoaded && (
        <div className="card">
          <p>Loading contract addresses...</p>
        </div>
      )}

      {configLoaded && (
        <>
          <div className="card">
            <h2>Connection</h2>
            {!signer ? (
              <button className="button" onClick={connectWallet} disabled={loading}>
                {loading ? 'Connecting...' : 'Connect Wallet'}
              </button>
            ) : (
              <div className="info-box">
                <strong>Connected:</strong> {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                <br />
                <span className="status status-connected">Connected</span>
              </div>
            )}
          </div>

          {message && (
            <div className={message.type === 'success' ? 'success-box' : 'error-box'}>
              {message.text}
            </div>
          )}

          {signer && (
            <>
              {/* Tab Navigation */}
              <div className="card">
                <div className="button-group">
                  <button
                    className={activeTab === 'basic' ? 'button' : 'button button-secondary'}
                    onClick={() => setActiveTab('basic')}
                  >
                    🏠 Basic Account
                  </button>
                  <button
                    className={activeTab === 'multisig' ? 'button' : 'button button-secondary'}
                    onClick={() => setActiveTab('multisig')}
                  >
                    👥 Multi-Sig
                  </button>
                  <button
                    className={activeTab === 'session' ? 'button' : 'button button-secondary'}
                    onClick={() => setActiveTab('session')}
                  >
                    🔑 Session Keys
                  </button>
                  <button
                    className={activeTab === 'recovery' ? 'button' : 'button button-secondary'}
                    onClick={() => setActiveTab('recovery')}
                  >
                    🆘 Recovery
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === 'basic' && (
                <>
                  <div className="card">
                    <h2>1. Create Smart Account</h2>
                    <div className="form-group">
                      <label>Account ID (salt for deterministic addressing)</label>
                      <input
                        className="input"
                        type="number"
                        value={salt}
                        onChange={(e) => setSalt(e.target.value)}
                        placeholder="0"
                      />
                      <small style={{ color: '#666', fontSize: '0.875rem' }}>
                        Same ID + owner = same address (even before deployment!)
                      </small>
                    </div>
                    
                    <div className="button-group">
                      <button className="button" onClick={calculateAccountAddress} disabled={loading}>
                        📍 Calculate Address (Pre-Deploy)
                      </button>
                      <button className="button button-secondary" onClick={createAccount} disabled={loading}>
                        🚀 Deploy Account
                      </button>
                    </div>

                    {accountAddress && (
                      <div className="info-box" style={{ marginTop: '16px' }}>
                        <strong>Smart Account Address:</strong><br />
                        <code>{accountAddress}</code>
                        <br />
                        <button 
                          className="button" 
                          onClick={checkAccountExists} 
                          style={{ marginTop: '12px', fontSize: '0.875rem', padding: '8px 16px' }}
                        >
                          ✅ Check if Deployed
                        </button>
                      </div>
                    )}
                  </div>

                  {accountAddress && (
                    <>
                      <div className="card">
                        <h2>2. Fund Account</h2>
                        <div className="button-group">
                          <button 
                            className="button"
                            onClick={fundAccount}
                            disabled={loading}
                          >
                            💸 Send 0.01 ETH
                          </button>
                          <button 
                            className="button" 
                            onClick={() => {
                              navigator.clipboard.writeText(accountAddress)
                              setMessage({ type: 'success', text: 'Address copied!' })
                            }}
                          >
                            📋 Copy Address
                          </button>
                        </div>
                      </div>

                      <div className="grid">
                        <div className="card">
                          <h2>3. Mint NFT</h2>
                          <p style={{ marginBottom: '16px', color: '#666', fontSize: '0.875rem' }}>
                            Execute single transaction via smart account
                          </p>
                          <button className="button button-secondary" onClick={mintNFT} disabled={loading}>
                            🎨 Mint 1 NFT
                          </button>
                        </div>

                        <div className="card">
                          <h2>4. Batch Transactions</h2>
                          <p style={{ marginBottom: '16px', color: '#666', fontSize: '0.875rem' }}>
                            Atomic execution - all or nothing
                          </p>
                          <button className="button button-secondary" onClick={mintBatch} disabled={loading}>
                            ⚡ Batch Mint 3 NFTs
                          </button>
                        </div>
                      </div>

                      <div className="card">
                        <h2>NFT Balance</h2>
                        <div className="info-box">
                          <strong>Total NFTs owned by smart account:</strong> {nftBalance}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {activeTab === 'multisig' && (
                <MultiSigDemo 
                  provider={provider} 
                  signer={signer} 
                  userAddress={userAddress} 
                />
              )}

              {activeTab === 'session' && (
                <SessionKeysDemo 
                  provider={provider} 
                  signer={signer} 
                  userAddress={userAddress} 
                />
              )}

              {activeTab === 'recovery' && (
                <SocialRecoveryDemo 
                  provider={provider} 
                  signer={signer} 
                  userAddress={userAddress} 
                />
              )}

              <div className="card">
                <h2>Contract Addresses</h2>
                <div style={{ fontSize: '0.875rem' }}>
                  <p><strong>Factory:</strong> <code>{CONTRACTS.FACTORY}</code></p>
                  <p><strong>Paymaster:</strong> <code>{CONTRACTS.PAYMASTER}</code></p>
                  <p><strong>NFT:</strong> <code>{CONTRACTS.NFT}</code></p>
                  <p><strong>EntryPoint v0.7:</strong> <code>{CONTRACTS.ENTRYPOINT}</code></p>
                </div>
              </div>

              {txHash && (
                <div className="card">
                  <h2>Last Transaction</h2>
                  <div className="tx-hash">
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#667eea' }}
                    >
                      View on Etherscan →
                    </a>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

export default App
