import { useState } from 'react'

export function SignSafeModal({ analysis, onApprove, onReject, isVisible, isLoading }) {
  const [confirming, setConfirming] = useState(false)

  if (!isVisible) return null

  const isDANGEROUS = analysis?.includes('DANGEROUS')
  const isCAUTION = analysis?.includes('CAUTION')
  const isSAFE = analysis?.includes('SAFE') && !isDANGEROUS

  const accentColor = isDANGEROUS ? '#ff3b5c' : isCAUTION ? '#ffb400' : '#00ff88'
  const verdict = isDANGEROUS ? 'DANGEROUS' : isCAUTION ? 'CAUTION' : 'SAFE'
  const verdictEmoji = isDANGEROUS ? '🚨' : isCAUTION ? '⚠️' : '✅'

  const handleApprove = async () => {
    setConfirming(true)
    await onApprove()
    setConfirming(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(8,11,20,0.95)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '16px'
    }}>
      <div style={{
        background: '#0f1623',
        border: `1px solid ${accentColor}44`,
        borderRadius: '20px',
        padding: '32px',
        maxWidth: '520px',
        width: '100%',
        boxShadow: `0 0 60px ${accentColor}22`,
        animation: 'slideUp 0.3s ease'
      }}>
        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: `${accentColor}15`, display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '24px'
          }}>🛡️</div>
          <div>
            <div style={{ fontSize: '11px', color: '#5a6a82', letterSpacing: '2px', marginBottom: '2px' }}>
              SIGNSAFE ANALYSIS
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: accentColor }}>
              {verdictEmoji} {verdict}
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              border: `3px solid ${accentColor}33`,
              borderTop: `3px solid ${accentColor}`,
              margin: '0 auto 16px',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ color: '#5a6a82', fontSize: '14px' }}>Analyzing transaction security...</p>
          </div>
        )}

        {/* Analysis report */}
        {!isLoading && analysis && (
          <div style={{
            background: '#080b14',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid #1e2d47',
            maxHeight: '320px',
            overflowY: 'auto'
          }}>
            {analysis.split('\n').map((line, i) => {
              const isLabel = line.match(/^(VERDICT|SUMMARY|PERMISSIONS|ASSETS AT RISK|CONTRACTS|RED FLAGS|RECOMMENDATION|COMMUNITY ALERT):/);
              return (
                <div key={i} style={{
                  marginBottom: '8px',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: isLabel ? accentColor : '#c8d4e8',
                  fontFamily: isLabel ? "'Space Mono', monospace" : 'inherit',
                  fontWeight: isLabel ? '700' : '400'
                }}>
                  {line || '\u00A0'}
                </div>
              )
            })}
          </div>
        )}

        {/* Fee notice */}
        <div style={{
          background: '#1e2d4722',
          border: '1px solid #1e2d47',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '14px' }}>💳</span>
          <span style={{ fontSize: '12px', color: '#5a6a82' }}>
            Service fee: <strong style={{ color: '#c8d4e8' }}>0.001 SOL</strong> charged on approval
          </span>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onReject} style={{
            flex: 1, padding: '14px',
            background: 'transparent',
            border: '1px solid #1e2d47',
            color: '#5a6a82', borderRadius: '12px',
            cursor: 'pointer', fontSize: '15px',
            fontFamily: "'Syne', sans-serif",
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
            onMouseEnter={e => { e.target.style.borderColor = '#ff3b5c'; e.target.style.color = '#ff3b5c' }}
            onMouseLeave={e => { e.target.style.borderColor = '#1e2d47'; e.target.style.color = '#5a6a82' }}
          >
            ✕ Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={confirming}
            style={{
              flex: 1, padding: '14px',
              background: isDANGEROUS ? '#ff3b5c22' : `${accentColor}22`,
              border: `1px solid ${isDANGEROUS ? '#ff3b5c' : accentColor}`,
              color: isDANGEROUS ? '#ff3b5c' : accentColor,
              borderRadius: '12px', cursor: confirming ? 'not-allowed' : 'pointer',
              fontSize: '15px', fontFamily: "'Syne', sans-serif", fontWeight: '600',
              opacity: confirming ? 0.7 : 1
            }}
          >
            {confirming ? 'Signing...' : isDANGEROUS ? '⚠️ Sign Anyway' : '✓ Approve & Sign'}
          </button>
        </div>

        {isDANGEROUS && (
          <p style={{ color: '#ff3b5c', fontSize: '11px', textAlign: 'center', marginTop: '12px' }}>
            ⚠️ SignSafe strongly recommends against signing this transaction
          </p>
        )}
      </div>
    </div>
  )
}
