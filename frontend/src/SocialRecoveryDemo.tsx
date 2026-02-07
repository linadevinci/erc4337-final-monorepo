import { useState } from 'react'
import { ethers } from 'ethers'
import { getContracts, ACCOUNT_ABI } from './contracts'

interface SocialRecoveryDemoProps {
  provider: ethers.BrowserProvider | null
  signer: ethers.Signer | null
  userAddress: string
}

function SocialRecoveryDemo({ provider, signer, userAddress }: SocialRecoveryDemoProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [accountAddress, setAccountAddress] = useState('')
  const [guardianAddress, setGuardianAddress] = useState('')
  const [newOwnerAddress, setNewOwnerAddress] = useState('')
  const [recoveryHash, setRecoveryHash] = useState('')

  const addGuardian = async () => {
    if (!signer || !accountAddress || !guardianAddress) {
      setMessage({ type: 'error', text: 'Please fill all fields' })
      return
    }

    try {
      setLoading(true)
      const account = new ethers.Contract(accountAddress, ACCOUNT_ABI, signer)
      
      console.log('👥 Adding guardian:', guardianAddress)
      
      // Encode setGuardian call
      const setGuardianCallData = account.interface.encodeFunctionData('setGuardian', [
        guardianAddress,
        true
      ])
      
      // Call via execute() wrapper
      const tx = await account.execute(accountAddress, 0, setGuardianCallData)
      setMessage({ type: 'success', text: 'Adding guardian...' })
      await tx.wait()
      
      setMessage({ type: 'success', text: 'Guardian added successfully!' })
    } catch (error: any) {
      console.error('Guardian error:', error)
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const initiateRecovery = async () => {
    if (!newOwnerAddress) {
      setMessage({ type: 'error', text: 'Enter new owner address' })
      return
    }

    try {
      // Calculate recovery hash
      const newOwners = [newOwnerAddress]
      const newThreshold = 1
      
      // Hash the recovery parameters (same as contract does)
      const abiCoder = ethers.AbiCoder.defaultAbiCoder()
      const encoded = abiCoder.encode(
        ['address[]', 'uint256'],
        [newOwners, newThreshold]
      )
      const hash = ethers.keccak256(encoded)
      
      setRecoveryHash(hash)
      setMessage({ 
        type: 'success', 
        text: `Recovery hash generated. Share with guardians for approval.` 
      })
      
      console.log('🔐 Recovery initiated:')
      console.log('  New owners:', newOwners)
      console.log('  Threshold:', newThreshold)
      console.log('  Hash:', hash)
    } catch (error: any) {
      console.error('Hash calculation error:', error)
      setMessage({ type: 'error', text: error.message })
    }
  }

  const guardianApprove = async () => {
    if (!signer || !accountAddress || !recoveryHash) {
      setMessage({ type: 'error', text: 'Need account address and recovery hash' })
      return
    }

    try {
      setLoading(true)
      const account = new ethers.Contract(accountAddress, ACCOUNT_ABI, signer)
      
      console.log('✅ Guardian approving recovery:', recoveryHash)
      console.log('  Guardian (you):', userAddress)
      
      // Call approveRecovery DIRECTLY (not through execute!)
      // The guardian must call this function themselves
      const tx = await account.approveRecovery(recoveryHash)
      setMessage({ type: 'success', text: 'Guardian approving recovery...' })
      await tx.wait()
      
      setMessage({ type: 'success', text: 'Guardian approved recovery!' })
    } catch (error: any) {
      console.error('Approval error:', error)
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const executeRecovery = async () => {
    if (!signer || !accountAddress || !newOwnerAddress) return

    try {
      setLoading(true)
      const account = new ethers.Contract(accountAddress, ACCOUNT_ABI, signer)
      
      const newOwners = [newOwnerAddress]
      const newThreshold = 1
      
      console.log('🔄 Executing recovery:')
      console.log('  New owners:', newOwners)
      console.log('  New threshold:', newThreshold)
      
      // Call executeRecovery DIRECTLY (not through execute!)
      // Anyone can call this once enough guardians have approved
      const tx = await account.executeRecovery(newOwners, newThreshold)
      setMessage({ type: 'success', text: 'Executing recovery...' })
      await tx.wait()
      
      setMessage({ type: 'success', text: '✅ Recovery executed! Account ownership changed.' })
    } catch (error: any) {
      console.error('Recovery execution error:', error)
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2>🆘 Social Recovery</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Add trusted guardians who can help recover your account if you lose access.
        Guardians must approve a recovery before it can be executed.
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
          placeholder="0x... (your smart account)"
        />

        <div style={{ marginTop: '16px', padding: '12px', background: '#f0f9ff', borderRadius: '8px' }}>
          <strong>Step 1: Add Guardian</strong>
          <label style={{ marginTop: '8px' }}>Guardian Address (trusted friend)</label>
          <input
            className="input"
            type="text"
            value={guardianAddress}
            onChange={(e) => setGuardianAddress(e.target.value)}
            placeholder="0x..."
          />
          <button 
            className="button" 
            onClick={addGuardian}
            disabled={loading}
            style={{ marginTop: '8px', width: '100%' }}
          >
            ➕ Add Guardian
          </button>
        </div>

        <div style={{ marginTop: '16px', padding: '12px', background: '#fef3f2', borderRadius: '8px' }}>
          <strong>Step 2: Initiate Recovery (if lost access)</strong>
          <label style={{ marginTop: '8px' }}>New Owner Address</label>
          <input
            className="input"
            type="text"
            value={newOwnerAddress}
            onChange={(e) => setNewOwnerAddress(e.target.value)}
            placeholder="0x... (your new wallet)"
          />
          <button 
            className="button button-secondary" 
            onClick={initiateRecovery}
            style={{ marginTop: '8px', width: '100%' }}
          >
            🔐 Calculate Recovery Hash
          </button>
        </div>

        {recoveryHash && (
          <>
            <div style={{ marginTop: '16px', padding: '12px', background: '#f0fdf4', borderRadius: '8px' }}>
              <strong>Step 3: Guardian Approval</strong>
              <p style={{ fontSize: '0.875rem', marginTop: '8px', wordBreak: 'break-all' }}>
                Recovery Hash: <code style={{ fontSize: '0.75rem' }}>{recoveryHash}</code>
              </p>
              <button 
                className="button" 
                onClick={guardianApprove}
                disabled={loading}
                style={{ marginTop: '8px', width: '100%' }}
              >
                ✅ Approve as Guardian
              </button>
              <small style={{ display: 'block', marginTop: '8px', color: '#666' }}>
                Important: You must be the guardian address to approve!
              </small>
            </div>

            <div style={{ marginTop: '16px', padding: '12px', background: '#fff5f5', borderRadius: '8px' }}>
              <strong>Step 4: Execute Recovery</strong>
              <button 
                className="button button-danger" 
                onClick={executeRecovery}
                disabled={loading}
                style={{ marginTop: '8px', width: '100%' }}
              >
                🔄 Execute Recovery (Change Ownership)
              </button>
              <small style={{ display: 'block', marginTop: '8px', color: '#c53030' }}>
                ⚠️ This will change the account owner to: {newOwnerAddress.slice(0, 10)}...{newOwnerAddress.slice(-4)}
              </small>
            </div>
          </>
        )}

        <div style={{ marginTop: '16px', padding: '12px', background: '#fffbeb', borderRadius: '8px' }}>
          <strong>ℹ️ How Social Recovery Works:</strong>
          <ol style={{ fontSize: '0.875rem', marginTop: '8px', paddingLeft: '20px', color: '#666' }}>
            <li><strong>Add guardians</strong> - Owner calls setGuardian() via execute()</li>
            <li><strong>Calculate recovery hash</strong> - Hash of new owner + threshold</li>
            <li><strong>Guardians approve</strong> - Each guardian calls approveRecovery() DIRECTLY (not via execute!)</li>
            <li><strong>Execute recovery</strong> - Anyone calls executeRecovery() once threshold met</li>
          </ol>
          <p style={{ fontSize: '0.75rem', marginTop: '8px', color: '#c53030' }}>
            ⚠️ Note: approveRecovery() checks msg.sender == guardian, so it must be called directly by the guardian, not through the account's execute() function!
          </p>
        </div>
      </div>
    </div>
  )
}

export default SocialRecoveryDemo
