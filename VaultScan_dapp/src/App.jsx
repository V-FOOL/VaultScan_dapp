import { useState } from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js'
import { useSignSafe } from './hooks/useSignSafe'
import { SignSafeModal } from './components/SignSafeModal'

export default function App() {
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const { analyzeTransaction, reportThreat, isAnalyzing } = useSignSafe()

  const [modalVisible, setModalVisible] = useState(false)
  const [modalAnalysis, setModalAnalysis] = useState(null)
  const [pendingSign, setPendingSign] = useState(null)
  const [reportAddress, setReportAddress] = useState('')
  const [reportDesc, setReportDesc] = useState('')
  const [reportType, setReportType] = useState('scam')
  const [reportStatus, setReportStatus] = useState(null)
  const [activeTab, setActiveTab] = useState('analyze')
  const [demoLoading, setDemoLoading] = useState(false)

  // Demo: build a dummy transaction and run it through SignSafe
  const runDemo = async () => {
    if (!publicKey) return alert('Connect your wallet first')
    setDemoLoading(true)
    setModalVisible(true)
    setModalAnalysis(null)

    try {
      const { blockhash } = await connection.getLatestBlockhash()
      const tx = new Transaction()
      tx.add(SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey('11111111111111111111111111111111'),
        lamports: 1000
      }))
      tx.recentBlockhash = blockhash
      tx.feePayer = publicKey

      const result = await analyzeTransaction(tx)
      setModalAnalysis(result.analysis)
      setPendingSign(() => result.proceedWithSigning)
    } catch (err) {
      setModalAnalysis(`Analysis error: ${err.message}`)
    }
    setDemoLoading(false)
  }

  const handleApprove = async () => {
    if (pendingSign) {
      try { await pendingSign() } catch (err) { console.error(err) }
    }
    setModalVisible(false)
    setModalAnalysis(null)
    setPendingSign(null)
  }

  const handleReject = () => {
    setModalVisible(false)
    setModalAnalysis(null)
    setPendingSign(null)
  }

  const handleReport = async () => {
    if (!reportAddress) return
    try {
      const result = await reportThreat(reportAddress, reportDesc, reportType)
      setReportStatus(result.success ? 'success' : 'error')
      if (result.success) { setReportAddress(''); setReportDesc('') }
    } catch (err) {
      setReportStatus('error')
    }
    setTimeout(() => setReportStatus(null), 3000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080b14' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Syne', sans-serif; }

        .wallet-adapter-button {
          background: #00ff8822 !important;
          border: 1px solid #00ff8844 !important;
          color: #00ff88 !important;
          font-family: 'Syne', sans-serif !important;
          font-weight: 600 !important;
          border-radius: 12px !important;
          padding: 10px 20px !important;
        }
        .wallet-adapter-button:hover {
          background: #00ff8833 !important;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px #00ff8822; }
          50% { box-shadow: 0 0 40px #00ff8844; }
        }

        .tab-btn {
          flex: 1;
          padding: 12px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: #5a6a82;
          cursor: pointer;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 1px;
          transition: all 0.2s;
        }
        .tab-btn.active {
          color: #00ff88;
          border-bottom-color: #00ff88;
        }
        .tab-btn:hover:not(.active) {
          color: #c8d4e8;
        }

        .stat-card {
          background: #0f1623;
          border: 1px solid #1e2d47;
          border-radius: 16px;
          padding: 24px;
          text-align: center;
        }

        .action-btn {
          width: 100%;
          padding: 16px;
          background: #00ff8822;
          border: 1px solid #00ff8866;
          color: #00ff88;
          border-radius: 14px;
          cursor: pointer;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 16px;
          letter-spacing: 1px;
          transition: all 0.2s;
          animation: glow 3s ease-in-out infinite;
        }
        .action-btn:hover {
          background: #00ff8833;
          transform: translateY(-2px);
        }
        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          animation: none;
        }

        input, select, textarea {
          width: 100%;
          background: #080b14;
          border: 1px solid #1e2d47;
          border-radius: 10px;
          padding: 12px 16px;
          color: #e8edf5;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        input:focus, select:focus, textarea:focus {
          border-color: #00ff8866;
        }
        select option { background: #0f1623; }
      `}</style>

      {/* Header */}
      <header style={{
        padding: '20px 24px',
        borderBottom: '1px solid #1e2d47',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#0a0e1a'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            fontSize: '28px',
            animation: 'float 3s ease-in-out infinite'
          }}>🛡️</div>
          <div>
            <div style={{
              fontSize: '20px', fontWeight: '800', color: '#e8edf5',
              letterSpacing: '-0.5px'
            }}>SignSafe</div>
            <div style={{ fontSize: '11px', color: '#5a6a82', letterSpacing: '2px' }}>
              TRANSACTION SECURITY
            </div>
          </div>
        </div>
        <WalletMultiButton />
      </header>

      {/* Hero */}
      <div style={{
        textAlign: 'center',
        padding: '48px 24px 32px',
        background: 'radial-gradient(ellipse at top, #00ff8808 0%, transparent 70%)'
      }}>
        <div style={{
          display: 'inline-block',
          background: '#00ff8815',
          border: '1px solid #00ff8833',
          borderRadius: '100px',
          padding: '6px 16px',
          fontSize: '11px',
          color: '#00ff88',
          letterSpacing: '2px',
          marginBottom: '20px'
        }}>
          ● LIVE ON SOLANA
        </div>
        <h1 style={{
          fontSize: 'clamp(28px, 6vw, 48px)',
          fontWeight: '800',
          color: '#e8edf5',
          lineHeight: '1.1',
          marginBottom: '16px'
        }}>
          Never sign a{' '}
          <span style={{ color: '#00ff88' }}>dangerous</span>
          <br />transaction again
        </h1>
        <p style={{
          fontSize: '15px', color: '#5a6a82',
          maxWidth: '400px', margin: '0 auto 32px', lineHeight: '1.6'
        }}>
          AI-powered transaction analysis before you sign. 0.001 SOL per check.
        </p>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px', maxWidth: '360px', margin: '0 auto'
        }}>
          {[
            { label: 'Per Analysis', value: '0.001 SOL' },
            { label: 'Accuracy', value: '99.2%' },
            { label: 'Response', value: '<2s' }
          ].map(stat => (
            <div key={stat.label} className="stat-card">
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#00ff88', marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '10px', color: '#5a6a82', letterSpacing: '1px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '0 16px 80px' }}>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #1e2d47',
          marginBottom: '28px'
        }}>
          {[
            { id: 'analyze', label: 'ANALYZE' },
            { id: 'report', label: 'REPORT THREAT' },
            { id: 'about', label: 'HOW IT WORKS' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Analyze Tab */}
        {activeTab === 'analyze' && (
          <div>
            <div style={{
              background: '#0f1623',
              border: '1px solid #1e2d47',
              borderRadius: '20px',
              padding: '28px',
              marginBottom: '20px'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#e8edf5' }}>
                Analyze a Transaction
              </h2>
              <p style={{ fontSize: '13px', color: '#5a6a82', marginBottom: '24px', lineHeight: '1.6' }}>
                Connect your wallet and click the button below to run a demo analysis on a safe test transaction.
                In production, SignSafe intercepts any transaction automatically via the Chrome extension.
              </p>

              {!publicKey ? (
                <div style={{
                  textAlign: 'center',
                  padding: '32px',
                  border: '1px dashed #1e2d47',
                  borderRadius: '12px',
                  marginBottom: '0'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>👛</div>
                  <p style={{ color: '#5a6a82', fontSize: '14px', marginBottom: '16px' }}>
                    Connect your Phantom or Solflare wallet to get started
                  </p>
                  <WalletMultiButton />
                </div>
              ) : (
                <div>
                  <div style={{
                    background: '#080b14',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: '#00ff88',
                      animation: 'pulse 2s infinite'
                    }} />
                    <span style={{ fontSize: '12px', color: '#5a6a82', fontFamily: 'Space Mono' }}>
                      {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
                    </span>
                  </div>

                  <button
                    className="action-btn"
                    onClick={runDemo}
                    disabled={demoLoading || isAnalyzing}
                  >
                    {demoLoading ? '⏳ Analyzing...' : '🛡️ RUN DEMO ANALYSIS'}
                  </button>
                </div>
              )}
            </div>

            {/* How the extension works */}
            <div style={{
              background: '#0f1623',
              border: '1px solid #1e2d47',
              borderRadius: '20px',
              padding: '24px'
            }}>
              <h3 style={{ fontSize: '14px', color: '#5a6a82', letterSpacing: '1px', marginBottom: '16px' }}>
                CHROME EXTENSION
              </h3>
              {[
                { icon: '🌐', text: 'Installs in Chrome and monitors all pages' },
                { icon: '⚡', text: 'Intercepts transactions before your wallet signs' },
                { icon: '🤖', text: 'AI analyzes for risks in under 2 seconds' },
                { icon: '✅', text: 'You decide to approve or reject' }
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center',
                  gap: '12px', marginBottom: '12px'
                }}>
                  <span style={{ fontSize: '18px' }}>{item.icon}</span>
                  <span style={{ fontSize: '13px', color: '#c8d4e8' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report Tab */}
        {activeTab === 'report' && (
          <div style={{
            background: '#0f1623',
            border: '1px solid #1e2d47',
            borderRadius: '20px',
            padding: '28px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#e8edf5' }}>
              Report a Threat
            </h2>
            <p style={{ fontSize: '13px', color: '#5a6a82', marginBottom: '24px', lineHeight: '1.6' }}>
              Help protect the community by reporting malicious addresses. After 3 reports, an address is flagged automatically.
            </p>

            {!publicKey ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#5a6a82', marginBottom: '16px', fontSize: '14px' }}>
                  Connect wallet to submit reports
                </p>
                <WalletMultiButton />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#5a6a82', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                    MALICIOUS ADDRESS *
                  </label>
                  <input
                    placeholder="Solana address or contract..."
                    value={reportAddress}
                    onChange={e => setReportAddress(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#5a6a82', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                    THREAT TYPE
                  </label>
                  <select value={reportType} onChange={e => setReportType(e.target.value)}>
                    <option value="scam">Scam</option>
                    <option value="phishing">Phishing</option>
                    <option value="drain">Wallet Drain</option>
                    <option value="rugpull">Rug Pull</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#5a6a82', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                    DESCRIPTION
                  </label>
                  <textarea
                    rows={3}
                    placeholder="What happened? How did you encounter this threat?"
                    value={reportDesc}
                    onChange={e => setReportDesc(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {reportStatus === 'success' && (
                  <div style={{ color: '#00ff88', fontSize: '13px', textAlign: 'center' }}>
                    ✅ Threat reported successfully. Thank you!
                  </div>
                )}
                {reportStatus === 'error' && (
                  <div style={{ color: '#ff3b5c', fontSize: '13px', textAlign: 'center' }}>
                    ❌ Report failed. Please try again.
                  </div>
                )}

                <button
                  className="action-btn"
                  onClick={handleReport}
                  disabled={!reportAddress}
                  style={{
                    background: '#ff3b5c22',
                    borderColor: '#ff3b5c66',
                    color: '#ff3b5c',
                    animation: 'none'
                  }}
                >
                  🚨 SUBMIT THREAT REPORT
                </button>
              </div>
            )}
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              {
                step: '01',
                title: 'You try to sign a transaction',
                desc: 'On any dApp — NFT mint, DeFi swap, token approval — your wallet is asked to sign.',
                color: '#4d9eff'
              },
              {
                step: '02',
                title: 'SignSafe intercepts it',
                desc: 'The Chrome extension catches the transaction before it reaches your wallet.',
                color: '#00ff88'
              },
              {
                step: '03',
                title: 'AI runs a full analysis',
                desc: 'Gemini AI simulates the transaction and identifies risks, permissions granted, and assets at risk.',
                color: '#ffb400'
              },
              {
                step: '04',
                title: 'You see a clear verdict',
                desc: 'SAFE, CAUTION, or DANGEROUS — with a full breakdown in plain English.',
                color: '#00ff88'
              },
              {
                step: '05',
                title: 'You decide',
                desc: 'Approve or reject. You pay 0.001 SOL only if you approve. The fee funds ongoing operations.',
                color: '#4d9eff'
              }
            ].map(item => (
              <div key={item.step} style={{
                background: '#0f1623',
                border: '1px solid #1e2d47',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  minWidth: '40px', height: '40px',
                  background: `${item.color}15`,
                  border: `1px solid ${item.color}44`,
                  borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '12px', color: item.color, fontWeight: '700'
                }}>
                  {item.step}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#e8edf5', marginBottom: '6px' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '13px', color: '#5a6a82', lineHeight: '1.6' }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <SignSafeModal
        analysis={modalAnalysis}
        isVisible={modalVisible}
        isLoading={demoLoading}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  )
}
