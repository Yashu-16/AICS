import { useAppStore } from '../../store/appStore'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'

export default function MetricsPanel() {
  const { snapshot, snapshotHistory, events } = useAppStore()

  const chartData = snapshotHistory.length > 2
    ? snapshotHistory.slice(-24).map((s) => ({ gdp: parseFloat(s.world_gdp?.toFixed(1)) }))
    : [{ gdp: 108 }, { gdp: 112 }, { gdp: 116 }, { gdp: 120 }]

  return (
    <div style={{
      width: 280, flexShrink: 0, height: '100%', overflowY: 'auto',
      display: 'flex', flexDirection: 'column', gap: 12, padding: 14,
      background: 'var(--bg-secondary)',
      borderLeft: '1px solid rgba(0,200,255,0.10)',
    }}>

      {/* Global Vitals */}
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Global Vitals</span>
          <span className="badge badge-ok">LIVE</span>
        </div>
        <div style={{ padding: '10px 14px' }}>
          {[
            { label: 'World GDP',    value: `$${snapshot.world_gdp?.toFixed(1)}T`,                      color: '#e8f4ff' },
            { label: 'Population',  value: `${((snapshot.population || 8100) / 1000).toFixed(2)}B`,     color: '#e8f4ff' },
            { label: 'Temp Anomaly',value: `+${snapshot.temp_anomaly?.toFixed(2)}°C`,                   color: '#ffaa00' },
            { label: 'Automation',  value: `${((snapshot.automation_index || 0) * 100).toFixed(0)}%`,   color: '#00c8ff' },
            { label: 'CO₂ (ppm)',   value: `${snapshot.co2_ppm?.toFixed(0)}`,                           color: '#ff4060' },
          ].map((m) => (
            <div key={m.label} className="metric-row">
              <span className="metric-label">{m.label}</span>
              <span className="metric-value" style={{ color: m.color }}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* GDP Sparkline */}
      <div className="panel">
        <div className="panel-head"><span className="panel-title">GDP Trend</span></div>
        <div style={{ padding: '10px 14px', height: 80 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gdpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00c8ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00c8ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{ background: '#0a1520', border: '1px solid rgba(0,200,255,0.2)', borderRadius: 6, fontSize: 11, fontFamily: 'JetBrains Mono,monospace' }}
                formatter={(v) => [`$${v}T`, 'GDP']}
              />
              <Area type="monotone" dataKey="gdp" stroke="#00c8ff" strokeWidth={1.5} fill="url(#gdpGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Domain scores */}
      <div className="panel">
        <div className="panel-head"><span className="panel-title">Domain Scores</span></div>
        <div style={{ padding: '12px 14px' }}>
          {[
            { label: 'Economic Health',    pct: 72, cls: 'prog-green' },
            { label: 'Climate Stability',  pct: 41, cls: 'prog-warn'  },
            { label: 'Geo. Stability',     pct: Math.round((snapshot.geopolitical_stability || 0.65) * 100), cls: 'prog-cyan' },
            { label: 'Tech Progress',      pct: Math.round((snapshot.tech_progress_index    || 0.55) * 100), cls: 'prog-green' },
          ].map((d) => (
            <div key={d.label} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'rgba(232,244,255,0.6)' }}>{d.label}</span>
                <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono,monospace', color: '#00c8ff' }}>{d.pct}</span>
              </div>
              <div className="prog-bar">
                <div className={`prog-fill ${d.cls}`} style={{ width: `${d.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Event feed */}
      <div className="panel" style={{ flex: 1 }}>
        <div className="panel-head">
          <span className="panel-title">Event Feed</span>
          <span className="badge badge-danger">{events.filter((e) => e.severity === 'danger').length} ALERTS</span>
        </div>
        <div style={{ padding: '8px 14px', overflowY: 'auto', maxHeight: 240 }}>
          {events.slice(0, 10).map((ev) => {
            const dot = { danger: '#ff4060', warn: '#ffaa00', ok: '#00ffc8', info: '#00c8ff' }[ev.severity] || '#00c8ff'
            return (
              <div key={ev.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(0,200,255,0.05)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, flexShrink: 0, marginTop: 5 }} />
                <div>
                  <p style={{ fontSize: 12, color: 'rgba(232,244,255,0.65)', lineHeight: 1.5 }}>{ev.text}</p>
                  <p style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace', color: 'rgba(232,244,255,0.3)', marginTop: 2 }}>{ev.year}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}