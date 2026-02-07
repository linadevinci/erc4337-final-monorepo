import { useState } from 'react'
import { ethers } from 'ethers'
import { getContracts, ACCOUNT_ABI, NFT_ABI } from './contracts'
import { buildUserOp, getUserOpHash, submitUserOp, waitForUserOpReceipt } from './bundler'

interface SessionKeysDemoProps {
  provider: ethers.BrowserProvider | null
  signer: ethers.Signer | null
  userAddress: string
}

function SessionKeysDemo({ provider, signer, userAddress }: SessionKeysDemoProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [accountAddress, setAccountAddress] = useState('')
  const [sessionKeyAddress, setSessionKeyAddress] = useState('')
  const [sessionKeyPrivateKey, setSessionKeyPrivateKey] = useState('')
  const [validHours, setValidHours] = useState('1')
  const [oneTime, setOneTime] = useState(false)
  const [sessionKeyInfo, setSessionKeyInfo] = useState<any>(null)

  const generateSessionKey = () => {
    const wallet = ethers.Wallet.createRandom()
    setSessionKeyAddress(wallet.address)
    setSessionKeyPrivateKey(wallet.privateKey)
    setMessage({ type: 'success', text: 'Session key generated! Copy the private key below.' })
  }

  const copyPrivateKey = () => {
    navigator.clipboard.writeText(sessionKeyPrivateKey)
    setMessage({ type: 'success', text: 'Private key copied to clipboard!' })
  }

  const addSessionKey = async () => {
    if (!signer || !provider || !accountAddress || !sessionKeyAddress) {
      setMessage({ type: 'error', text: 'Please fill all fields' })
      return
    }

    try {
      setLoading(true)
      const CONTRACTS = getContracts()
      const account = new ethers.Contract(accountAddress, ACCOUNT_ABI, signer)
      
      const hoursInSeconds = parseInt(validHours) * 3600
      const expiresAt = Math.floor(Date.now() / 1000) + hoursInSeconds
      
      console.log('🔑 Adding session key via UserOp...')
      
      const setKeyCallData = account.interface.encodeFunctionData('setSessionKey', [
        sessionKeyAddress,
        expiresAt,
        oneTime
      ])
      
      const userOp = await buildUserOp(
        provider,
        CONTRACTS.ENTRYPOINT,
        accountAddress,
        accountAddress,
        0n,
        setKeyCallData,
        CONTRACTS.PAYMASTER
      )
      
      const hash = await getUserOpHash(provider, CONTRACTS.ENTRYPOINT, userOp)
      const ownerSignature = await signer.signMessage(ethers.getBytes(hash))
      
      const coder = ethers.AbiCoder.defaultAbiCoder()
      const innerData = coder.encode(['address[]', 'bytes[]'], [[userAddress], [ownerSignature]])
      userOp.signature = coder.encode(['uint8', 'bytes'], [0, innerData])
      
      setMessage({ type: 'success', text: 'Submitting to bundler...' })
      const opHash = await submitUserOp(CONTRACTS.ENTRYPOINT, userOp, CONTRACTS.PAYMASTER)
      
      setMessage({ type: 'success', text: 'Waiting for confirmation...' })
      const txHash = await waitForUserOpReceipt(opHash)
      
      setMessage({ type: 'success', text: `Session key added! Wait 10s for nonce to update...` })
      
      // Wait for nonce to update on-chain
      await new Promise(resolve => setTimeout(resolve, 10000))
      
      await checkSessionKey()
      setMessage({ type: 'success', text: '✅ Ready to use session key!' })
    } catch (error: any) {
      console.error('❌ Session key error:', error)
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const checkSessionKey = async () => {
    if (!provider || !accountAddress || !sessionKeyAddress) return

    try {
      const account = new ethers.Contract(accountAddress, ACCOUNT_ABI, provider)
      const keyInfo = await account.getSessionKey(sessionKeyAddress)
      
      setSessionKeyInfo({
        expiresAt: Number(keyInfo[0]),
        oneTime: keyInfo[1],
        used: keyInfo[2]
      })
      
      console.log('📊 Session key status:', {
        expires: new Date(Number(keyInfo[0]) * 1000).toLocaleString(),
        oneTime: keyInfo[1],
        used: keyInfo[2]
      })
    } catch (error) {
      console.error('Error checking session key:', error)
    }
  }

  const useSessionKey = async () => {
    if (!provider || !accountAddress || !sessionKeyPrivateKey) {
      setMessage({ type: 'error', text: 'Need account address and session key private key' })
      return
    }

    try {
      setLoading(true)
      const CONTRACTS = getContracts()
      const sessionWallet = new ethers.Wallet(sessionKeyPrivateKey)
      const nft = new ethers.Contract(CONTRACTS.NFT, NFT_ABI, provider)
      
      console.log('🎨 Minting NFT via session key...')
      console.log('  Session key:', sessionWallet.address)
      console.log('  Account:', accountAddress)
      
      const mintCallData = nft.interface.encodeFunctionData('mint', [accountAddress])
      
      const userOp = await buildUserOp(
        provider,
        CONTRACTS.ENTRYPOINT,
        accountAddress,
        CONTRACTS.NFT,
        0n,
        mintCallData,
        CONTRACTS.PAYMASTER
      )
      
      const hash = await getUserOpHash(provider, CONTRACTS.ENTRYPOINT, userOp)
      const sessionSignature = await sessionWallet.signMessage(ethers.getBytes(hash))
      
      const coder = ethers.AbiCoder.defaultAbiCoder()
      const innerData = coder.encode(['address', 'bytes'], [sessionWallet.address, sessionSignature])
      userOp.signature = coder.encode(['uint8', 'bytes'], [1, innerData])
      
      setMessage({ type: 'success', text: 'Submitting session key UserOp...' })
      const opHash = await submitUserOp(CONTRACTS.ENTRYPOINT, userOp, CONTRACTS.PAYMASTER)
      
      setMessage({ type: 'success', text: 'Waiting for confirmation...' })
      const txHash = await waitForUserOpReceipt(opHash)
      
      setMessage({ type: 'success', text: `✅ NFT minted! Tx: ${txHash.slice(0, 10)}...` })
      
      await checkSessionKey()
    } catch (error: any) {
      console.error('❌ Mint error:', error)
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const revokeSessionKey = async () => {
    if (!signer || !provider || !accountAddress || !sessionKeyAddress) return

    try {
      setLoading(true)
      const CONTRACTS = getContracts()
      const account = new ethers.Contract(accountAddress, ACCOUNT_ABI, signer)
      
      const revokeCallData = account.interface.encodeFunctionData('revokeSessionKey', [sessionKeyAddress])
      
      const userOp = await buildUserOp(
        provider,
        CONTRACTS.ENTRYPOINT,
        accountAddress,
        accountAddress,
        0n,
        revokeCallData,
        CONTRACTS.PAYMASTER
      )
      
      const hash = await getUserOpHash(provider, CONTRACTS.ENTRYPOINT, userOp)
      const signature = await signer.signMessage(ethers.getBytes(hash))
      
      const coder = ethers.AbiCoder.defaultAbiCoder()
      const innerData = coder.encode(['address[]', 'bytes[]'], [[userAddress], [signature]])
      userOp.signature = coder.encode(['uint8', 'bytes'], [0, innerData])
      
      setMessage({ type: 'success', text: 'Revoking session key...' })
      const opHash = await submitUserOp(CONTRACTS.ENTRYPOINT, userOp, CONTRACTS.PAYMASTER)
      const txHash = await waitForUserOpReceipt(opHash)
      
      setMessage({ type: 'success', text: 'Session key revoked!' })
      setSessionKeyInfo(null)
    } catch (error: any) {
      console.error('Revoke error:', error)
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2>🔑 Session Keys (Pimlico Bundler)</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Grant temporary permissions using ERC-4337. Session keys can execute transactions 
        without your main wallet signature.
      </p>

      {message && (
        <div className={message.type === 'success' ? 'success-box' : 'error-box'}>
          {message.text}
        </div>
      )}

      <div className="form-group">
        <label>Smart Account Address</label>
        <input
          className="input"
          type="text"
          value={accountAddress}
          onChange={(e) => setAccountAddress(e.target.value)}
          placeholder="0x..."
        />

        <div style={{ marginTop: '16px', padding: '12px', background: '#f0f9ff', borderRadius: '8px' }}>
          <strong>Step 1: Generate Session Key</strong>
          <button 
            className="button" 
            onClick={generateSessionKey}
            style={{ marginTop: '8px', width: '100%' }}
          >
            🎲 Generate Random Session Key
          </button>
        </div>

        {sessionKeyAddress && (
          <>
            <label style={{ marginTop: '16px' }}>Session Key Address</label>
            <input className="input" type="text" value={sessionKeyAddress} disabled style={{ background: '#f0f0f0' }} />

            <label>Private Key</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type="text"
                value={sessionKeyPrivateKey}
                readOnly
                style={{ background: '#fff5f5', paddingRight: '100px', fontFamily: 'monospace', fontSize: '0.75rem' }}
              />
              <button
                className="button"
                onClick={copyPrivateKey}
                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', padding: '6px 12px' }}
              >
                📋 Copy
              </button>
            </div>
            <small style={{ color: '#c53030', fontSize: '0.75rem' }}>⚠️ Save this private key!</small>

            <label style={{ marginTop: '16px' }}>Valid for (hours)</label>
            <input className="input" type="number" value={validHours} onChange={(e) => setValidHours(e.target.value)} />

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
              <input type="checkbox" checked={oneTime} onChange={(e) => setOneTime(e.target.checked)} />
              One-time use only
            </label>

            <div style={{ marginTop: '16px', padding: '12px', background: '#f0fdf4', borderRadius: '8px' }}>
              <strong>Step 2: Register Key</strong>
              <button className="button button-secondary" onClick={addSessionKey} disabled={loading} style={{ marginTop: '8px', width: '100%' }}>
                ➕ Add Session Key (Gasless)
              </button>
              <small style={{ display: 'block', marginTop: '8px', color: '#666', fontSize: '0.75rem' }}>
                Wait 10 seconds after adding for nonce to update
              </small>
            </div>

            {sessionKeyInfo && (
              <div className="info-box" style={{ marginTop: '16px' }}>
                <strong>Status:</strong><br />
                <code>Expires: {new Date(sessionKeyInfo.expiresAt * 1000).toLocaleString()}</code><br />
                <code>One-time: {sessionKeyInfo.oneTime ? 'Yes' : 'No'}</code><br />
                <code>Used: {sessionKeyInfo.used ? 'Yes ❌' : 'No ✅'}</code>
              </div>
            )}

            {sessionKeyInfo && !sessionKeyInfo.used && (
              <div style={{ marginTop: '16px', padding: '12px', background: '#fef3f2', borderRadius: '8px' }}>
                <strong>Step 3: Use Key</strong>
                <button className="button" onClick={useSessionKey} disabled={loading} style={{ marginTop: '8px', width: '100%' }}>
                  🎨 Mint NFT (Session Key)
                </button>
              </div>
            )}

            {sessionKeyInfo && (
              <button className="button button-danger" onClick={revokeSessionKey} disabled={loading} style={{ marginTop: '16px', width: '100%' }}>
                🗑️ Revoke Key
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default SessionKeysDemo
