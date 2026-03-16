import { useAppStore } from '../../store/appStore'

const MODES = [
  { key: 'gdp',         label: 'ECONOMY' },
  { key: 'climate',     label: 'CLIMATE' },
  { key: 'population',  label: 'POPULATION' },
  { key: 'technology',  label: 'TECHNOLOGY' },
  { key: 'geopolitics', label: 'GEOPOLITICS' },
]

export default function GlobeControls() {
  const { globeMode, setGlobeMode, currentYear, activeScenario } = useAppStore()
  return (
    <>
      <div style={{ position: 'absolute', top: 24, left: 24, pointerEvents: 'none' }}>
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 32, letterSpacing: -1, color: '#e8f4ff' }}>
          EARTH {currentYear}
        </h2>
        <p style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#00c8ff', marginTop: 4, letterSpacing: 1 }}>
          {activeScenario.name.toUpperCase()}
        </p>
      </div>

      <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
        {MODES.map((m) => (
          <button key={m.key} onClick={() => setGlobeMode(m.key)} style={{
            fontFamily: 'JetBrains Mono,monospace', fontSize: 10, letterSpacing: 1,
            padding: '7px 14px', borderRadius: 6, cursor: 'pointer',
            backdropFilter: 'blur(8px)', transition: 'all 0.2s',
            background: globeMode === m.key ? 'rgba(0,200,255,0.15)' : 'rgba(2,8,20,0.85)',
            border: `1px solid ${globeMode === m.key ? 'rgba(0,200,255,0.5)' : 'rgba(0,200,255,0.15)'}`,
            color: globeMode === m.key ? '#00c8ff' : 'rgba(232,244,255,0.5)',
          }}>
            {m.label}
          </button>
        ))}
      </div>
    </>
  )
}