// frontend/src/components/Topbar.jsx
import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { useWorldVitals } from '../hooks/useWorldVitals'

export default function Topbar() {
  const { scenario, year, running, speed, toggleRun, setSpeed } = useAppStore()
  const { vitals, loading } = useWorldVitals()

  // Dynamic metrics — advance with simulation year
  const yearsElapsed  = Math.max(0, year - 2025)
  const worldGdp      = vitals ? (vitals.world_gdp_t  * Math.pow(1.025, yearsElapsed)) : 105
  const worldPop      = vitals ? (vitals.world_pop_b  * Math.pow(1.007, yearsElapsed)) : 8.1
  const tempAnomaly   = vitals ? (vitals.temp_anomaly + yearsElapsed * 0.018)           : 1.29
  const co2Ppm        = vitals ? (vitals.co2_ppm      + yearsElapsed * 2.5)             : 422

  const metrics = [
    {
      label: 'World GDP',
      value: loading ? '...' : `$${worldGdp.toFixed(1)}T`,
      color: '#a78bfa',
      source: vitals?.sources?.economy,
    },
    {
      label: 'Population',
      value: loading ? '...' : `${worldPop.toFixed(2)}B`,
      color: '#34d399',
      source: vitals?.sources?.economy,
    },
    {
      label: 'Temp Anomaly',
      value: loading ? '...' : `+${tempAnomaly.toFixed(2)}°C`,
      color: tempAnomaly > 1.5 ? '#f87171' : '#fbbf24',
      source: vitals?.sources?.temperature,
    },
    {
      label: 'CO₂ (ppm)',
      value: loading ? '...' : co2Ppm.toFixed(1),
      color: co2Ppm > 420 ? '#f87171' : '#fbbf24',
      source: vitals?.sources?.co2,
    },
  ]

  return (
    <div style={{
      height: 48,
      background: 'rgba(5,5,15,0.95)',
      borderBottom: '1px solid rgba(124,58,237,0.20)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 12,
      flexShrink: 0,
      zIndex: 50,
    }}>

      {/* ── Logo ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#5b21b6,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff', fontFamily: 'Syne, sans-serif', flexShrink: 0 }}>A</div>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: '#f1f0ff', letterSpacing: '-0.02em' }}>AICS</span>
      </div>

      {/* ── Scenario pill ── */}
      <div style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.30)', borderRadius: 20, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa' }} />
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#c4b5fd', letterSpacing: 1 }}>
          SCN {scenario?.toUpperCase?.() || 'BASELINE'}
        </span>
      </div>

      {/* ── Year ── */}
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(241,240,255,0.35)', letterSpacing: 1 }}>{year}</span>

      {/* ── Playback controls ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          onClick={toggleRun}
          style={{ background: running ? 'rgba(52,211,153,0.15)' : 'rgba(124,58,237,0.15)', border: `1px solid ${running ? 'rgba(52,211,153,0.35)' : 'rgba(124,58,237,0.35)'}`, borderRadius: 6, color: running ? '#34d399' : '#a78bfa', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 11 }}
        >
          {running ? '⏸' : '▶'}
        </button>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(241,240,255,0.3)', width: 28 }}>{speed}×</span>
        <button
          onClick={() => setSpeed(Math.min(10, speed + 1))}
          style={{ background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(124,58,237,0.20)', borderRadius: 4, color: '#a78bfa', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 10 }}
        >+</button>
      </div>

      {/* ── Live data source indicator ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: loading ? '#fbbf24' : vitals ? '#34d399' : '#f87171', boxShadow: `0 0 6px ${loading ? '#fbbf24' : vitals ? '#34d399' : '#f87171'}`, animation: loading ? 'pulse 1s ease infinite' : 'none' }} />
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'rgba(241,240,255,0.3)', letterSpacing: 0.5 }}>
          {loading ? 'FETCHING LIVE DATA...' : vitals ? 'NASA · NOAA · WORLD BANK' : 'OFFLINE MODE'}
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* ── Global Vitals ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {metrics.map((m, i) => (
          <div
            key={m.label}
            title={m.source ? `Source: ${m.source}` : ''}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
              padding: '3px 10px',
              borderRight: i < metrics.length - 1 ? '1px solid rgba(124,58,237,0.12)' : 'none',
              cursor: m.source ? 'help' : 'default',
            }}
          >
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: 'rgba(241,240,255,0.28)', letterSpacing: 0.8, marginBottom: 1 }}>{m.label}</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: loading ? 'rgba(241,240,255,0.2)' : m.color, transition: 'color 0.5s' }}>
              {m.value}
            </span>
          </div>
        ))}
      </div>

      {/* ── New Scenario button ── */}
      <button style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.35)', borderRadius: 8, color: '#c4b5fd', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, padding: '5px 12px', cursor: 'pointer', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
        + New Scenario
      </button>

    </div>
  )
}