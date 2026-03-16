import { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { Zap, X, ChevronRight } from 'lucide-react'

const EVENTS = [
  {
    category: 'CRISIS',
    color: '#f87171',
    items: [
      { id: 'pandemic',       label: 'Pandemic',           icon: '🦠', desc: 'Novel pathogen spreads globally', effect: { gdp: -0.12, population: -0.02, stability: -0.15, unemployment: 0.08 } },
      { id: 'financial_crash',label: 'Financial Crash',    icon: '📉', desc: 'Global markets collapse 40%',    effect: { gdp: -0.18, unemployment: 0.12, stability: -0.20 } },
      { id: 'nuclear_war',    label: 'Nuclear Exchange',   icon: '☢️', desc: 'Limited nuclear conflict',       effect: { gdp: -0.35, population: -0.08, stability: -0.45, tech_index: -0.10 } },
      { id: 'climate_crisis', label: 'Climate Tipping Point',icon:'🌊',desc: 'Irreversible climate cascade',   effect: { temp_anomaly: 0.8, gdp: -0.10, stability: -0.12 } },
    ]
  },
  {
    category: 'BREAKTHROUGH',
    color: '#34d399',
    items: [
      { id: 'fusion_energy',  label: 'Fusion Energy',      icon: '⚡', desc: 'Limitless clean energy unlocked', effect: { renewable_share: 0.35, gdp: 0.15, temp_anomaly: -0.3 } },
      { id: 'cure_cancer',    label: 'Cancer Cure',        icon: '💊', desc: 'Universal cancer treatment',     effect: { population: 0.03, gdp: 0.05, stability: 0.08 } },
      { id: 'ai_boom',        label: 'AI Productivity Boom',icon:'🤖', desc: 'Automation doubles output',      effect: { gdp: 0.20, tech_index: 0.15, unemployment: 0.06 } },
      { id: 'green_tech',     label: 'Green Revolution',   icon: '🌱', desc: 'Renewable cost hits zero',       effect: { renewable_share: 0.40, gdp: 0.08, temp_anomaly: -0.4 } },
    ]
  },
  {
    category: 'GEOPOLITICAL',
    color: '#fbbf24',
    items: [
      { id: 'world_war',      label: 'World War',          icon: '⚔️', desc: 'Major powers enter open conflict', effect: { gdp: -0.25, stability: -0.40, tech_index: 0.05 } },
      { id: 'world_peace',    label: 'Global Peace Treaty',icon: '🕊️', desc: 'All nations sign peace accord',   effect: { stability: 0.30, gdp: 0.10, renewable_share: 0.08 } },
      { id: 'revolution',     label: 'Revolution',         icon: '✊', desc: 'Political upheaval in target',    effect: { stability: -0.35, gdp: -0.12 } },
      { id: 'trade_war',      label: 'Trade War',          icon: '🚢', desc: 'Global trade routes collapse',    effect: { gdp: -0.08, stability: -0.10, unemployment: 0.04 } },
    ]
  },
]

export default function EventInjector({ targetCountry, onClose, onInject }) {
  const { snapshot, currentYear } = useAppStore()
  const [selected,  setSelected]  = useState(null)
  const [scope,     setScope]     = useState('country')   // 'country' | 'global'
  const [injecting, setInjecting] = useState(false)
  const [done,      setDone]      = useState(false)

  async function handleInject() {
    if (!selected) return
    setInjecting(true)
    await new Promise(r => setTimeout(r, 900))
    onInject({ event: selected, scope, targetCountry, year: currentYear })
    setInjecting(false)
    setDone(true)
    setTimeout(onClose, 1800)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(5,5,10,0.82)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 580, maxHeight: '86vh', overflow: 'hidden',
        background: '#0d0d18',
        border: '1px solid rgba(124,58,237,0.35)',
        borderRadius: 16,
        display: 'flex', flexDirection: 'column',
        animation: 'popIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <style>{`
          @keyframes popIn { from{transform:scale(0.92);opacity:0} to{transform:scale(1);opacity:1} }
          @keyframes ripple {
            0%   { transform: scale(0); opacity: 0.8; }
            100% { transform: scale(4); opacity: 0; }
          }
        `}</style>

        {/* Header */}
        <div style={{
          padding: '18px 22px 14px',
          borderBottom: '1px solid rgba(124,58,237,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={15} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 17, color: '#f1f0ff' }}>
                Butterfly Effect Injector
              </h2>
              <p style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace', color: 'rgba(167,139,250,0.8)', letterSpacing: 1.5 }}>
                YEAR {currentYear} · TARGET: {scope === 'global' ? 'GLOBAL' : (targetCountry || 'SELECT COUNTRY').toUpperCase()}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(124,58,237,0.20)',
            borderRadius: 6, width: 28, height: 28, cursor: 'pointer',
            color: 'rgba(241,240,255,0.5)', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        {/* Scope toggle */}
        <div style={{ padding: '12px 22px 0', display: 'flex', gap: 8, flexShrink: 0 }}>
          {['country', 'global'].map((s) => (
            <button key={s} onClick={() => setScope(s)} style={{
              padding: '5px 14px', borderRadius: 6, cursor: 'pointer',
              fontSize: 11, fontFamily: 'JetBrains Mono,monospace', letterSpacing: 1,
              border: `1px solid ${scope === s ? 'rgba(124,58,237,0.5)' : 'rgba(124,58,237,0.15)'}`,
              background: scope === s ? 'rgba(124,58,237,0.15)' : 'transparent',
              color: scope === s ? '#a78bfa' : 'rgba(241,240,255,0.35)',
              transition: 'all 0.15s', textTransform: 'uppercase',
            }}>
              {s === 'country' ? `${targetCountry || 'Country'} only` : 'Global event'}
            </button>
          ))}
          {scope === 'global' && (
            <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace', color: '#fbbf24', padding: '5px 0', marginLeft: 4 }}>
              ⚠ Affects all nations
            </span>
          )}
        </div>

        {/* Event grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px' }}>
          {EVENTS.map((group) => (
            <div key={group.category} style={{ marginBottom: 18 }}>
              <p style={{
                fontSize: 9, fontFamily: 'JetBrains Mono,monospace',
                color: group.color, letterSpacing: 3,
                marginBottom: 8, opacity: 0.9,
              }}>{group.category}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {group.items.map((ev) => {
                  const isSel = selected?.id === ev.id
                  return (
                    <button key={ev.id} onClick={() => setSelected(isSel ? null : ev)}
                      style={{
                        textAlign: 'left', padding: '11px 13px',
                        borderRadius: 10, cursor: 'pointer',
                        border: `1px solid ${isSel ? group.color + '60' : 'rgba(124,58,237,0.12)'}`,
                        background: isSel ? `${group.color}10` : 'rgba(124,58,237,0.04)',
                        transition: 'all 0.15s',
                        outline: 'none',
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <span style={{ fontSize: 18 }}>{ev.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: isSel ? '#f1f0ff' : 'rgba(241,240,255,0.75)' }}>
                          {ev.label}
                        </span>
                      </div>
                      <p style={{ fontSize: 10, color: 'rgba(241,240,255,0.38)', fontFamily: 'JetBrains Mono,monospace' }}>
                        {ev.desc}
                      </p>
                      {isSel && (
                        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {Object.entries(ev.effect).map(([k, v]) => (
                            <span key={k} style={{
                              fontSize: 9, fontFamily: 'JetBrains Mono,monospace',
                              padding: '2px 6px', borderRadius: 4,
                              background: v > 0 ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
                              color: v > 0 ? '#34d399' : '#f87171',
                              border: `1px solid ${v > 0 ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
                            }}>
                              {k.replace(/_/g,' ')} {v > 0 ? '+' : ''}{(v * 100).toFixed(0)}%
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 22px',
          borderTop: '1px solid rgba(124,58,237,0.12)',
          flexShrink: 0,
          background: 'rgba(124,58,237,0.03)',
        }}>
          {done ? (
            <div style={{
              textAlign: 'center', padding: '10px',
              fontSize: 13, fontFamily: 'JetBrains Mono,monospace',
              color: '#34d399',
            }}>
              ✓ Event injected — watch the ripple effects propagate
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                {selected ? (
                  <p style={{ fontSize: 11, color: 'rgba(241,240,255,0.5)', fontFamily: 'JetBrains Mono,monospace' }}>
                    Ready to inject <span style={{ color: '#a78bfa' }}>{selected.label}</span> in year {currentYear}
                  </p>
                ) : (
                  <p style={{ fontSize: 11, color: 'rgba(241,240,255,0.3)', fontFamily: 'JetBrains Mono,monospace' }}>
                    Select an event above to inject
                  </p>
                )}
              </div>
              <button
                onClick={handleInject}
                disabled={!selected || injecting}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '9px 22px', borderRadius: 8, cursor: selected ? 'pointer' : 'not-allowed',
                  border: '1px solid',
                  borderColor: selected ? 'rgba(124,58,237,0.5)' : 'rgba(124,58,237,0.15)',
                  background: selected ? 'linear-gradient(135deg,#5b21b6,#7c3aed)' : 'rgba(124,58,237,0.06)',
                  color: selected ? '#fff' : 'rgba(241,240,255,0.25)',
                  fontSize: 13, fontWeight: 700,
                  boxShadow: selected ? '0 0 24px rgba(124,58,237,0.35)' : 'none',
                  transition: 'all 0.2s',
                }}>
                {injecting ? (
                  <><span style={{ display:'inline-block',width:13,height:13,border:'2px solid rgba(255,255,255,0.3)',borderTop:'2px solid #fff',borderRadius:'50%',animation:'spin 0.8s linear infinite' }} /> Injecting...</>
                ) : (
                  <><Zap size={14} /> Inject Event</>
                )}
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}