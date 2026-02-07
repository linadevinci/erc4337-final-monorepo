import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { getContracts, FACTORY_ABI, ACCOUNT_ABI } from './contracts'

interface MultiSigDemoProps {
  provider: ethers.BrowserProvider | null
  signer: ethers.Signer | null
  userAddress: string
}

function MultiSigDemo({ provider, signer, userAddress }: MultiSigDemoProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [owner2Address, setOwner2Address] = useState('')
  const [owner3Address, setOwner3Address] = useState('')
  const [threshold, setThreshold] = useState('2')
  const [multiSigAccountAddress, setMultiSigAccountAddress] = useState('')
  const [salt, setSalt] = useState('100')
  
  const [accountOwners, setAccountOwners] = useState<string[]>([])
  const [accountThreshold, setAccountThreshold] = useState(0)

  const createMultiSigAccount = async () => {
    if (!signer) return
    if (!owner2Address || !owner3Address) {
      setMessage({ type: 'error', text: 'Please enter all owner addresses' })
      return
    }

    try {
      setLoading(true)
      const CONTRACTS = getContracts()
      const factory = new ethers.Contract(CONTRACTS.FACTORY, FACTORY_ABI, signer)
      
      const owners = [userAddress, owner2Address, owner3Address]
      const guardians: string[] = []
      const thresholdValue = parseInt(threshold)
      
      console.log('🔧 Creating multi-sig account:')
      console.log('  Owners:', owners)
      console.log('  Threshold:', thresholdValue)
      
      // Calculate address first
      const calculatedAddress = await factory.getFunction("getAddress")(
        owners,
        thresholdValue,
        guardians,
        0,
        parseInt(salt)
      )
      
      setMultiSigAccountAddress(calculatedAddress)
      
      // Create account
      const tx = await factory.createAccount(
        owners,
        thresholdValue,
        guardians,
        0,
        parseInt(salt)
      )
      
      setMessage({ type: 'success', text: 'Creating multi-sig account...' })
      await tx.wait()
      
      setMessage({ type: 'success', text: `Multi-sig account created! Requires ${thresholdValue} of ${owners.length} signatures.` })
      
      // Load account info
      await loadAccountInfo(calculatedAddress)
    } catch (error: any) {
      console.error('Multi-sig creation error:', error)
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const loadAccountInfo = async (accountAddr: string) => {
    if (!provider) return

    try {
      const accountABI = [
        'function getOwners() view returns (address[])',
        'function threshold() view returns (uint256)'
      ]
      const account = new ethers.Contract(accountAddr, accountABI, provider)
      
      const owners = await account.getOwners()
      const thresh = await account.threshold()
      
      setAccountOwners(owners)
      setAccountThreshold(Number(thresh))
      
      console.log('📊 Multi-sig info:')
      console.log('  Owners:', owners)
      console.log('  Threshold:', thresh.toString())
    } catch (error) {
      console.error('Error loading account info:', error)
    }
  }

  const addOwner = async () => {
    if (!signer || !multiSigAccountAddress) return

    const newOwner = prompt('Enter new owner address:')
    if (!newOwner) return

    try {
      setLoading(true)
      const account = new ethers.Contract(multiSigAccountAddress, ACCOUNT_ABI, signer)
      
      // Encode the addOwner call
      const addOwnerCallData = account.interface.encodeFunctionData('addOwner', [newOwner])
      
      // Call via execute() wrapper
      const tx = await account.execute(multiSigAccountAddress, 0, addOwnerCallData)
      setMessage({ type: 'success', text: 'Adding owner...' })
      await tx.wait()
      
      setMessage({ type: 'success', text: 'Owner added successfully!' })
      await loadAccountInfo(multiSigAccountAddress)
    } catch (error: any) {
      console.error('Add owner error:', error)
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const changeThreshold = async () => {
    if (!signer || !multiSigAccountAddress) return

    const newThreshold = prompt(`Enter new threshold (max: ${accountOwners.length}):`)
    if (!newThreshold) return
    
    const thresholdNum = parseInt(newThreshold)
    if (thresholdNum > accountOwners.length) {
      setMessage({ type: 'error', text: `Threshold cannot exceed number of owners (${accountOwners.length})` })
      return
    }

    try {
      setLoading(true)
      const account = new ethers.Contract(multiSigAccountAddress, ACCOUNT_ABI, signer)
      
      // Encode the setThreshold call
      const setThresholdCallData = account.interface.encodeFunctionData('setThreshold', [thresholdNum])
      
      // Call via execute() wrapper
      const tx = await account.execute(multiSigAccountAddress, 0, setThresholdCallData)
      setMessage({ type: 'success', text: 'Updating threshold...' })
      await tx.wait()
      
      setMessage({ type: 'success', text: 'Threshold updated!' })
      await loadAccountInfo(multiSigAccountAddress)
    } catch (error: any) {
      console.error('Change threshold error:', error)
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2>👥 Multi-Signature Account</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Create an account requiring multiple signatures for transactions (e.g., 2-of-3 multisig)
      </p>

      {message && (
        <div className={message.type === 'success' ? 'success-box' : 'error-box'}>
          {message.text}
        </div>
      )}

      {!multiSigAccountAddress ? (
        <div className="form-group">
          <label>Owner 1 (You)</label>
          <input
            className="input"
            type="text"
            value={userAddress}
            disabled
            style={{ background: '#f0f0f0' }}
          />

          <label>Owner 2 Address</label>
          <input
            className="input"
            type="text"
            value={owner2Address}
            onChange={(e) => setOwner2Address(e.target.value)}
            placeholder="0x..."
          />

          <label>Owner 3 Address</label>
          <input
            className="input"
            type="text"
            value={owner3Address}
            onChange={(e) => setOwner3Address(e.target.value)}
            placeholder="0x..."
          />

          <label>Threshold (signatures required)</label>
          <select 
            className="input" 
            value={threshold} 
            onChange={(e) => setThreshold(e.target.value)}
          >
            <option value="1">1 of 3</option>
            <option value="2">2 of 3 (Recommended)</option>
            <option value="3">3 of 3</option>
          </select>

          <label>Account ID</label>
          <input
            className="input"
            type="number"
            value={salt}
            onChange={(e) => setSalt(e.target.value)}
            placeholder="100"
          />

          <button 
            className="button button-secondary" 
            onClick={createMultiSigAccount} 
            disabled={loading}
            style={{ marginTop: '16px' }}
          >
            Create Multi-Sig Account
          </button>
        </div>
      ) : (
        <div>
          <div className="info-box">
            <strong>Multi-Sig Account Address:</strong><br />
            <code>{multiSigAccountAddress}</code>
            <br /><br />
            
            <strong>Threshold:</strong> {accountThreshold} of {accountOwners.length} signatures required
            <br /><br />

            <strong>Owners:</strong>
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              {accountOwners.map((owner, idx) => (
                <li key={idx}>
                  <code>{owner}</code>
                  {owner.toLowerCase() === userAddress.toLowerCase() && ' (You)'}
                </li>
              ))}
            </ul>
          </div>

          <div className="button-group" style={{ marginTop: '16px' }}>
            <button className="button" onClick={addOwner} disabled={loading}>
              ➕ Add Owner
            </button>
            <button className="button" onClick={changeThreshold} disabled={loading}>
              🔢 Change Threshold
            </button>
            <button 
              className="button button-danger" 
              onClick={() => setMultiSigAccountAddress('')}
            >
              🔄 Create New
            </button>
          </div>

          <div style={{ marginTop: '16px', padding: '12px', background: '#f0f9ff', borderRadius: '8px' }}>
            <strong style={{ color: '#0369a1' }}>ℹ️ How Multi-Sig Works:</strong>
            <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '8px' }}>
              This account requires {accountThreshold} owner signature(s) to execute transactions. 
              Since you're the only connected owner, you can call management functions (add/remove owners, change threshold) 
              directly. For actual transaction execution with {accountThreshold}-of-{accountOwners.length} validation, 
              you'd need to collect {accountThreshold} signatures off-chain and submit together via EntryPoint/UserOp.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default MultiSigDemo

