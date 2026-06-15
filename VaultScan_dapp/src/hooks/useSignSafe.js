import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { SystemProgram, Transaction, PublicKey } from '@solana/web3.js'
import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'https://signsafe-api.onrender.com'
const FEE_LAMPORTS = 1000000 // 0.001 SOL

export function useSignSafe() {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  const [analysis, setAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState(null)

  const analyzeTransaction = async (transaction) => {
    if (!publicKey) throw new Error('Wallet not connected')
    setIsAnalyzing(true)
    setError(null)

    try {
      const serialized = Buffer.from(
        transaction.serialize({ requireAllSignatures: false })
      ).toString('base64')

      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serializedTransaction: serialized, chain: 'solana' })
      })

      if (!response.ok) throw new Error('API request failed')
      const result = await response.json()
      setAnalysis(result.analysis)
      setIsAnalyzing(false)

      return {
        analysis: result.analysis,
        treasuryWallets: result.treasuryWallets,
        proceedWithSigning: async () => {
          await collectFeeAndSign(transaction, result.treasuryWallets)
        }
      }
    } catch (err) {
      setError(err.message)
      setIsAnalyzing(false)
      throw err
    }
  }

  const collectFeeAndSign = async (originalTransaction, wallets) => {
    const feeTx = new Transaction()
    const devCut = Math.floor(FEE_LAMPORTS * 0.5)
    const opsCut = Math.floor(FEE_LAMPORTS * 0.3)
    const commCut = FEE_LAMPORTS - devCut - opsCut

    feeTx.add(
      SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: new PublicKey(wallets.dev), lamports: devCut }),
      SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: new PublicKey(wallets.ops), lamports: opsCut }),
      SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: new PublicKey(wallets.community), lamports: commCut })
    )

    const { blockhash } = await connection.getLatestBlockhash()
    feeTx.recentBlockhash = blockhash
    feeTx.feePayer = publicKey

    await sendTransaction(feeTx, connection)
    await sendTransaction(originalTransaction, connection)
  }

  const reportThreat = async (maliciousAddress, description, threatType) => {
    if (!publicKey) throw new Error('Wallet not connected')
    const response = await fetch(`${API_URL}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reporter_wallet: publicKey.toString(),
        malicious_address: maliciousAddress,
        chain: 'solana',
        description,
        threat_type: threatType
      })
    })
    return response.json()
  }

  return { analyzeTransaction, reportThreat, analysis, isAnalyzing, error }
}
