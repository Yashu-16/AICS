import { useEffect, useState } from 'react'
import { useAppStore } from '../store/appStore'

const COUNTRY_REACTIONS = [
  { name:'USA',          flag:'🇺🇸', reaction:'Implements AGI governance framework',    tone:'neutral' },
  { name:'China',        flag:'🇨🇳', reaction:'Nationalizes all AGI systems',           tone:'warning' },
  { name:'EU',           flag:'🇪🇺', reaction:'Emergency summit convened in Brussels',  tone:'neutral' },
  { name:'India',        flag:'🇮🇳', reaction:'Open-source AGI coalition formed',       tone:'positive' },
  { name:'Russia',       flag:'🇷🇺', reaction:'Military AGI deployment begins',         tone:'danger'  },
  { name:'UK',           flag:'🇬🇧', reaction:'AGI Safety Institute takes command',     tone:'neutral' },
  { name:'Japan',        flag:'🇯🇵', reaction:'Robotic integration begins immediately', tone:'positive' },
  { name:'Brazil',       flag:'🇧🇷', reaction:'Debt restructuring via AGI economics',   tone:'positive' },
]

export default function AGICinematic({ year, onDismiss }) {
  const [phase,    setPhase]    = useState(0)
  const [visibleR, setVisibleR] = useState(0)

  useEffect(() => {
    // Phase 0 → 1 (flash + title)
    const t1 = setTimeout(() => setPhase(1), 100)
    // Phase 1 → 2 (subtitle)
    const t2 = setTimeout(() => setPhase(2), 1200)
    // Phase 2 → 3 (reactions)
    const t3 = setTimeout(() => setPhase(3), 2400)
    return () => [t1,t2,t3].forEach(clearTimeout)
  }, [])

  // Stagger country reactions
  useEffect(() => {
    if (phase < 3) return
    let i = 0
    const iv = setInterval(() => {
      i++
      setVisibleR(i)
      if (i >= COUNTRY_REACTIONS.length) clearInterval(iv)
    }, 200)
    return () => clearInterval(iv)
  }, [phase])

  const toneColor = { positive:'#34d399', neutral:'#a78bfa', warning:'#fbbf24', danger:'#f87171' }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: phase === 0
        ? 'rgba(255,255,255,0.95)'
        : 'rgba(4,2,12,0.97)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      transition: 'background 0.8s ease',
      backdropFilter: 'blur(20px)',
    }}>
      <style>{`
        @keyframes agiFlash { 0%{opacity:1} 100%{opacity:0} }
        @keyframes agiTitle {
          0%  { opacity:0; letter-spacing:0.5em; transform:scale(0.85); }
          100%{ opacity:1; letter-spacing:0.04em; transform:scale(1); }
        }
        @keyframes scanline {
          0%   { transform:translateY(-100%); }
          100% { transform:translateY(100vh); }
        }
        @keyframes glitchL {
          0%,100%{ clip-path:inset(0 0 95% 0) }
          20%{ clip-path:inset(30% 0 50% 0) }
          40%{ clip-path:inset(70% 0 10% 0) }
          60%{ clip-path:inset(15% 0 75% 0) }
          80%{ clip-path:inset(55% 0 30% 0) }
        }
      `}</style>

      {/* Scanline */}
      {phase >= 1 && (
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:1,
        }}>
          <div style={{
            position:'absolute', left:0, right:0, height:2,
            background:'rgba(167,139,250,0.12)',
            animation:'scanline 3s linear infinite',
          }} />
        </div>
      )}

      {/* Glitch overlay */}
      {phase === 1 && (
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          background:'rgba(124,58,237,0.06)',
          animation:'glitchL 0.4s steps(1) 3',
        }} />
      )}

      {/* Main title */}
      {phase >= 1 && (
        <div style={{ textAlign:'center', zIndex:2, marginBottom:40, padding:'0 40px' }}>
          <p style={{
            fontFamily:'JetBrains Mono,monospace', fontSize:12,
            color:'rgba(167,139,250,0.6)', letterSpacing:6, marginBottom:20,
          }}>
            YEAR {year} — SINGULARITY EVENT
          </p>
          <h1 style={{
            fontFamily:'Syne,sans-serif', fontWeight:900,
            fontSize:'clamp(42px,8vw,88px)',
            color:'#f1f0ff', lineHeight:1,
            animation:'agiTitle 1.2s cubic-bezier(0.16,1,0.3,1) forwards',
            textShadow:'0 0 80px rgba(167,139,250,0.4)',
          }}>
            AGI HAS ARRIVED
          </h1>
          {phase >= 2 && (
            <p style={{
              marginTop:20, fontSize:16,
              color:'rgba(241,240,255,0.5)',
              fontFamily:'Space Grotesk,sans-serif',
              animation:'agiTitle 0.8s ease forwards',
              maxWidth:560, margin:'20px auto 0',
            }}>
              Artificial General Intelligence surpasses human-level cognition across all domains.
              The world will never be the same.
            </p>
          )}
        </div>
      )}

      {/* Country reactions */}
      {phase >= 3 && (
        <div style={{
          zIndex:2, width:'100%', maxWidth:720,
          padding:'0 32px', marginTop:10,
        }}>
          <p style={{
            fontSize:10, fontFamily:'JetBrains Mono,monospace',
            color:'rgba(241,240,255,0.28)', letterSpacing:3,
            marginBottom:12, textAlign:'center',
          }}>
            GLOBAL RESPONSES
          </p>
          <div style={{
            display:'grid', gridTemplateColumns:'1fr 1fr',
            gap:8,
          }}>
            {COUNTRY_REACTIONS.slice(0, visibleR).map((r) => (
              <div key={r.name} style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'9px 13px', borderRadius:8,
                background:'rgba(124,58,237,0.06)',
                border:`1px solid ${toneColor[r.tone]}25`,
                animation:'agiTitle 0.3s ease forwards',
              }}>
                <span style={{ fontSize:20, flexShrink:0 }}>{r.flag}</span>
                <div>
                  <p style={{ fontSize:11, fontWeight:600, color:'rgba(241,240,255,0.8)', marginBottom:2 }}>{r.name}</p>
                  <p style={{ fontSize:10, fontFamily:'JetBrains Mono,monospace', color:toneColor[r.tone] }}>{r.reaction}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dismiss */}
      {visibleR >= COUNTRY_REACTIONS.length && (
        <button onClick={onDismiss} style={{
          marginTop:32, zIndex:2,
          padding:'10px 32px', borderRadius:8,
          background:'linear-gradient(135deg,#5b21b6,#7c3aed)',
          border:'1px solid rgba(167,139,250,0.4)',
          color:'#fff', fontSize:13, fontWeight:700,
          cursor:'pointer', letterSpacing:1,
          animation:'agiTitle 0.5s ease forwards',
          boxShadow:'0 0 30px rgba(124,58,237,0.4)',
        }}>
          CONTINUE SIMULATION →
        </button>
      )}
    </div>
  )
}