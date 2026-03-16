import { useEffect, useState } from 'react'

const STEPS = [
  'Initializing simulation core...',
  'Loading global datasets...',
  'Calibrating climate models...',
  'Bootstrapping agent network...',
  'Ready.',
]

export default function Loader() {
  const [progress, setProgress] = useState(0)
  const step = Math.min(STEPS.length - 1, Math.floor((progress / 100) * STEPS.length))

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(interval); return 100 }
        return p + 1.4
      })
    }, 30)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#020408',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 32,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 64, letterSpacing: -2, color: '#e8f4ff' }}>
          AI<span style={{ color: '#00c8ff' }}>CS</span>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: 'rgba(232,244,255,0.35)', letterSpacing: 4, marginTop: 8 }}>
          AI CIVILIZATION SIMULATOR
        </div>
      </div>

      <div style={{ width: 280 }}>
        <div style={{ height: 2, background: 'rgba(0,200,255,0.12)', borderRadius: 1, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'linear-gradient(90deg,#0080ff,#00c8ff)',
            borderRadius: 1, transition: 'width 0.1s linear',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: 'rgba(232,244,255,0.4)' }}>
            {STEPS[step]}
          </span>
          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#00c8ff' }}>
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'rgba(232,244,255,0.20)', letterSpacing: 2 }}>
        v1.0.0 · PRODUCTION BUILD
      </div>
    </div>
  )
}