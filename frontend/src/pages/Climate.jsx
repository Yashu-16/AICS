import { useAppStore } from '../store/appStore'
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts'

const TT = {
  contentStyle: { background: '#0a1520', border: '1px solid rgba(0,200,255,0.2)', borderRadius: 6, fontSize: 11, fontFamily: 'JetBrains Mono,monospace' },
}

export default function Climate() {
  const { snapshot, snapshotHistory } = useAppStore()

  const hist = snapshotHistory.length > 2 ? snapshotHistory : [
    { year: 2025, temp_anomaly: 1.20, co2_ppm: 422, sea_level_rise_cm: 22 },
    { year: 2030, temp_anomaly: 1.35, co2_ppm: 438, sea_level_rise_cm: 24 },
    { year: 2040, temp_anomaly: 1.60, co2_ppm: 462, sea_level_rise_cm: 29 },
    { year: 2050, temp_anomaly: 1.90, co2_ppm: 490, sea_level_rise_cm: 36 },
  ]

  const chartData = hist.slice(-40).map((s) => ({
    year:     Math.floor(s.year),
    temp:     parseFloat((s.temp_anomaly || 0).toFixed(3)),
    co2:      parseFloat((s.co2_ppm || 0).toFixed(1)),
    sea:      parseFloat((s.sea_level_rise_cm || 0).toFixed(2)),
  }))

  const temp   = snapshot.temp_anomaly   || 1.2
  const co2    = snapshot.co2_ppm        || 422
  const sea    = snapshot.sea_level_rise_cm || 22
  const risk   = Math.min(100, Math.round(((temp - 1.0) / 3.5) * 100))
  const riskColor = risk > 70 ? '#ff4060' : risk > 40 ? '#ffaa00' : '#00ffc8'

  const RISKS = [
    { region: 'Southeast Asia',     impact: 'Coastal flooding',    risk: Math.min(100, Math.round(temp * 38)), color: temp > 2 ? '#ff4060' : '#ffaa00' },
    { region: 'Sub-Saharan Africa', impact: 'Drought & crop loss', risk: Math.min(100, Math.round(temp * 32)), color: temp > 2 ? '#ff4060' : '#ffaa00' },
    { region: 'Arctic',             impact: 'Ice sheet collapse',  risk: Math.min(100, Math.round(temp * 42)), color: '#ff4060' },
    { region: 'Mediterranean',      impact: 'Desertification',     risk: Math.min(100, Math.round(temp * 28)), color: '#ffaa00' },
    { region: 'Pacific Islands',    impact: 'Submersion risk',     risk: Math.min(100, Math.round(temp * 35)), color: temp > 2 ? '#ff4060' : '#ffaa00' },
  ]

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 28 }}>Climate</h1>
        <p style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#00c8ff', marginTop: 4 }}>GLOBAL CLIMATE INDICATORS</p>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { label: 'Temp Anomaly', value: `+${temp.toFixed(2)}°C`,  sub: 'vs 1850 baseline', color: temp > 2 ? '#ff4060' : '#ffaa00' },
          { label: 'CO₂ (ppm)',    value: co2.toFixed(0),            sub: 'Atmospheric',      color: '#ff4060' },
          { label: 'Sea Level',    value: `+${sea.toFixed(1)} cm`,   sub: 'Rise since 2000',  color: '#00c8ff' },
          { label: 'Climate Risk', value: `${risk}/100`,             sub: 'Global index',     color: riskColor },
        ].map((k) => (
          <div key={k.label} className="panel" style={{ padding: 18 }}>
            <p style={{ fontSize: 11, fontFamily: 'JetBrains Mono,monospace', color: 'rgba(232,244,255,0.4)', marginBottom: 8 }}>{k.label}</p>
            <p style={{ fontSize: 26, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace', color: k.color }}>{k.value}</p>
            <p style={{ fontSize: 11, color: 'rgba(232,244,255,0.35)', marginTop: 4 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        <div className="panel">
          <div className="panel-head"><span className="panel-title">Temperature Anomaly (°C)</span></div>
          <div style={{ padding: 16, height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="tempG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ff4060" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ff4060" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,200,255,0.06)" />
                <XAxis dataKey="year" tick={{ fill: 'rgba(232,244,255,0.35)', fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }} />
                <YAxis tick={{ fill: 'rgba(232,244,255,0.35)', fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }} />
                <Tooltip {...TT} formatter={(v) => [`+${v}°C`, 'Anomaly']} />
                <ReferenceLine y={1.5} stroke="#ffaa00" strokeDasharray="4 4" label={{ value: '1.5°C', fill: '#ffaa00', fontSize: 10 }} />
                <ReferenceLine y={2.0} stroke="#ff4060" strokeDasharray="4 4" label={{ value: '2.0°C', fill: '#ff4060', fontSize: 10 }} />
                <Area type="monotone" dataKey="temp" stroke="#ff4060" strokeWidth={2} fill="url(#tempG)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><span className="panel-title">Atmospheric CO₂ (ppm)</span></div>
          <div style={{ padding: 16, height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,200,255,0.06)" />
                <XAxis dataKey="year" tick={{ fill: 'rgba(232,244,255,0.35)', fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }} />
                <YAxis tick={{ fill: 'rgba(232,244,255,0.35)', fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }} />
                <Tooltip {...TT} formatter={(v) => [`${v} ppm`, 'CO₂']} />
                <ReferenceLine y={450} stroke="#ffaa00" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="co2" stroke="#ff6030" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><span className="panel-title">Sea Level Rise (cm)</span></div>
          <div style={{ padding: 16, height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="seaG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0080ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0080ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,200,255,0.06)" />
                <XAxis dataKey="year" tick={{ fill: 'rgba(232,244,255,0.35)', fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }} />
                <YAxis tick={{ fill: 'rgba(232,244,255,0.35)', fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }} />
                <Tooltip {...TT} formatter={(v) => [`+${v} cm`, 'Sea level']} />
                <Area type="monotone" dataKey="sea" stroke="#0080ff" strokeWidth={2} fill="url(#seaG)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional risk matrix */}
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Regional Risk Matrix</span></div>
          <div style={{ padding: '14px 16px' }}>
            {RISKS.map((r) => (
              <div key={r.region} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div>
                    <span style={{ fontSize: 12, color: '#e8f4ff' }}>{r.region}</span>
                    <span style={{ fontSize: 11, color: 'rgba(232,244,255,0.4)', marginLeft: 8 }}>{r.impact}</span>
                  </div>
                  <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono,monospace', color: r.color }}>{r.risk}/100</span>
                </div>
                <div className="prog-bar">
                  <div className="prog-fill" style={{ width: `${r.risk}%`, background: r.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}