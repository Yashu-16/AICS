import { useAppStore } from '../store/appStore'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const TT = {
  contentStyle: { background: '#0a1520', border: '1px solid rgba(0,200,255,0.2)', borderRadius: 6, fontSize: 11, fontFamily: 'JetBrains Mono,monospace' },
}

export default function Geopolitics() {
  const { snapshot, snapshotHistory } = useAppStore()

  const hist = snapshotHistory.length > 2 ? snapshotHistory : [
    { year: 2025, geopolitical_stability: 0.65 },
    { year: 2030, geopolitical_stability: 0.60 },
    { year: 2040, geopolitical_stability: 0.52 },
    { year: 2050, geopolitical_stability: 0.48 },
  ]

  const chartData = hist.slice(-40).map((s) => ({
    year:      Math.floor(s.year),
    stability: parseFloat(((s.geopolitical_stability || 0.65) * 100).toFixed(1)),
    tension:   parseFloat((((1 - (s.geopolitical_stability || 0.65))) * 100).toFixed(1)),
  }))

  const stability = snapshot.geopolitical_stability || 0.65
  const tension   = 1 - stability

  const BLOCS = [
    { name: 'USA-led Western Alliance',  stability: 72, members: 38, color: '#00c8ff' },
    { name: 'China-Russia Axis',         stability: 58, members: 12, color: '#ffaa00' },
    { name: 'Global South Coalition',    stability: 44, members: 67, color: '#00ffc8' },
    { name: 'Non-Aligned Nations',       stability: 51, members: 55, color: 'rgba(232,244,255,0.5)' },
  ]

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 28 }}>Geopolitics</h1>
        <p style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#00c8ff', marginTop: 4 }}>GLOBAL POLITICAL STABILITY</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { label: 'Global Stability',  value: `${(stability * 100).toFixed(0)}/100`,  sub: 'Composite index',     color: stability > 0.6 ? '#00ffc8' : '#ff4060' },
          { label: 'Global Tension',    value: `${(tension * 100).toFixed(0)}%`,       sub: 'Conflict pressure',   color: tension > 0.5 ? '#ff4060' : '#ffaa00' },
          { label: 'Active Conflicts',  value: `${Math.round(tension * 14)}`,          sub: 'Regional conflicts',  color: '#ff4060' },
          { label: 'Trade Openness',    value: `${Math.round(stability * 85)}%`,       sub: 'Global trade index',  color: '#00c8ff' },
        ].map((k) => (
          <div key={k.label} className="panel" style={{ padding: 18 }}>
            <p style={{ fontSize: 11, fontFamily: 'JetBrains Mono,monospace', color: 'rgba(232,244,255,0.4)', marginBottom: 8 }}>{k.label}</p>
            <p style={{ fontSize: 26, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace', color: k.color }}>{k.value}</p>
            <p style={{ fontSize: 11, color: 'rgba(232,244,255,0.35)', marginTop: 4 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        <div className="panel">
          <div className="panel-head"><span className="panel-title">Stability vs Tension (%)</span></div>
          <div style={{ padding: 16, height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,200,255,0.06)" />
                <XAxis dataKey="year" tick={{ fill: 'rgba(232,244,255,0.35)', fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }} />
                <YAxis tick={{ fill: 'rgba(232,244,255,0.35)', fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }} />
                <Tooltip {...TT} />
                <Line type="monotone" dataKey="stability" stroke="#00ffc8" strokeWidth={2} dot={false} name="Stability" />
                <Line type="monotone" dataKey="tension"   stroke="#ff4060" strokeWidth={2} dot={false} name="Tension" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bloc power map */}
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Geopolitical Blocs</span></div>
          <div style={{ padding: '14px 16px' }}>
            {BLOCS.map((b) => (
              <div key={b.name} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div>
                    <span style={{ fontSize: 12, color: '#e8f4ff' }}>{b.name}</span>
                    <span style={{ fontSize: 11, color: 'rgba(232,244,255,0.35)', marginLeft: 8 }}>{b.members} nations</span>
                  </div>
                  <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono,monospace', color: b.color }}>{b.stability}/100</span>
                </div>
                <div className="prog-bar">
                  <div className="prog-fill" style={{ width: `${b.stability}%`, background: b.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Country stability table */}
        <div className="panel" style={{ gridColumn: '1 / -1' }}>
          <div className="panel-head"><span className="panel-title">Country Stability Index</span></div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'JetBrains Mono,monospace', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0,200,255,0.12)' }}>
                  {['Country', 'Stability', 'Status', 'Tech Index'].map((h) => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, color: 'rgba(232,244,255,0.4)', letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(snapshot.country_data || {}).slice(0, 8).map(([name, c]) => {
                  const s = c.stability || 0.5
                  const statusColor = s > 0.7 ? '#00ffc8' : s > 0.45 ? '#ffaa00' : '#ff4060'
                  const statusText  = s > 0.7 ? 'Stable'  : s > 0.45 ? 'Tense'  : 'Unstable'
                  return (
                    <tr key={name} style={{ borderBottom: '1px solid rgba(0,200,255,0.05)' }}>
                      <td style={{ padding: '10px 16px', color: '#e8f4ff' }}>{name}</td>
                      <td style={{ padding: '10px 16px', color: statusColor }}>{(s * 100).toFixed(0)}/100</td>
                      <td style={{ padding: '10px 16px' }}><span className="badge" style={{ background: `${statusColor}18`, color: statusColor }}>{statusText}</span></td>
                      <td style={{ padding: '10px 16px', color: '#00c8ff' }}>{((c.tech_index || 0) * 100).toFixed(0)}%</td>
                    </tr>
                  )
                })}
                {Object.keys(snapshot.country_data || {}).length === 0 && (
                  <tr><td colSpan={4} style={{ padding: '24px 16px', textAlign: 'center', color: 'rgba(232,244,255,0.3)' }}>Run a simulation to see live data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  )
}