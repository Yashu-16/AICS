import { useAppStore } from '../store/appStore'
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'

const TT = {
  contentStyle: { background: '#0a1520', border: '1px solid rgba(0,200,255,0.2)', borderRadius: 6, fontSize: 11, fontFamily: 'JetBrains Mono,monospace' },
  labelStyle:   { color: 'rgba(232,244,255,0.5)' },
}

export default function Economy() {
  const { snapshot, snapshotHistory } = useAppStore()

  const hist = snapshotHistory.length > 2 ? snapshotHistory : [
    { year: 2025, world_gdp: 108, unemployment_rate: 0.055, renewable_share: 0.30, gini_coefficient: 0.42 },
    { year: 2030, world_gdp: 122, unemployment_rate: 0.062, renewable_share: 0.38, gini_coefficient: 0.44 },
    { year: 2035, world_gdp: 138, unemployment_rate: 0.081, renewable_share: 0.47, gini_coefficient: 0.46 },
    { year: 2040, world_gdp: 155, unemployment_rate: 0.110, renewable_share: 0.58, gini_coefficient: 0.49 },
  ]

  const chartData = hist.slice(-40).map((s) => ({
    year:         Math.floor(s.year),
    gdp:          parseFloat((s.world_gdp || 0).toFixed(1)),
    unemployment: parseFloat(((s.unemployment_rate || 0) * 100).toFixed(1)),
    renewable:    parseFloat(((s.renewable_share || 0) * 100).toFixed(1)),
    gini:         parseFloat((s.gini_coefficient || 0).toFixed(3)),
  }))

  const countryRows = Object.entries(snapshot.country_data || {}).slice(0, 10)

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 28 }}>Economy</h1>
        <p style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#00c8ff', marginTop: 4 }}>GLOBAL ECONOMIC INDICATORS</p>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { label: 'World GDP',       value: `$${(snapshot.world_gdp || 108).toFixed(1)}T`,                            sub: 'Trillion USD' },
          { label: 'Unemployment',    value: `${((snapshot.unemployment_rate || 0.055) * 100).toFixed(1)}%`,            sub: 'Global average' },
          { label: 'Renewables',      value: `${((snapshot.renewable_share || 0.30) * 100).toFixed(0)}%`,               sub: 'Energy mix' },
          { label: 'Gini Index',      value: (snapshot.gini_coefficient || 0.42).toFixed(3),                            sub: 'Inequality' },
        ].map((k) => (
          <div key={k.label} className="panel" style={{ padding: 18 }}>
            <p style={{ fontSize: 11, fontFamily: 'JetBrains Mono,monospace', color: 'rgba(232,244,255,0.4)', marginBottom: 8 }}>{k.label}</p>
            <p style={{ fontSize: 26, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace', color: '#00c8ff' }}>{k.value}</p>
            <p style={{ fontSize: 11, color: 'rgba(232,244,255,0.35)', marginTop: 4 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* GDP chart */}
        <div className="panel">
          <div className="panel-head"><span className="panel-title">World GDP (Trillion USD)</span></div>
          <div style={{ padding: 16, height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gdpG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00c8ff" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00c8ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,200,255,0.06)" />
                <XAxis dataKey="year" tick={{ fill: 'rgba(232,244,255,0.35)', fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }} />
                <YAxis tick={{ fill: 'rgba(232,244,255,0.35)', fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }} />
                <Tooltip {...TT} formatter={(v) => [`$${v}T`, 'GDP']} />
                <Area type="monotone" dataKey="gdp" stroke="#00c8ff" strokeWidth={2} fill="url(#gdpG)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Unemployment chart */}
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Global Unemployment (%)</span></div>
          <div style={{ padding: 16, height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,200,255,0.06)" />
                <XAxis dataKey="year" tick={{ fill: 'rgba(232,244,255,0.35)', fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }} />
                <YAxis tick={{ fill: 'rgba(232,244,255,0.35)', fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }} />
                <Tooltip {...TT} formatter={(v) => [`${v}%`, 'Unemployment']} />
                <Line type="monotone" dataKey="unemployment" stroke="#ffaa00" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Renewable energy */}
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Renewable Energy Share (%)</span></div>
          <div style={{ padding: 16, height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="renG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00ffc8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00ffc8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,200,255,0.06)" />
                <XAxis dataKey="year" tick={{ fill: 'rgba(232,244,255,0.35)', fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }} />
                <YAxis tick={{ fill: 'rgba(232,244,255,0.35)', fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }} />
                <Tooltip {...TT} formatter={(v) => [`${v}%`, 'Renewables']} />
                <Area type="monotone" dataKey="renewable" stroke="#00ffc8" strokeWidth={2} fill="url(#renG)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gini inequality */}
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Gini Inequality Index</span></div>
          <div style={{ padding: 16, height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,200,255,0.06)" />
                <XAxis dataKey="year" tick={{ fill: 'rgba(232,244,255,0.35)', fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }} />
                <YAxis domain={[0.3, 0.8]} tick={{ fill: 'rgba(232,244,255,0.35)', fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }} />
                <Tooltip {...TT} formatter={(v) => [v, 'Gini']} />
                <Line type="monotone" dataKey="gini" stroke="#ff4060" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Country table */}
      <div className="panel">
        <div className="panel-head"><span className="panel-title">Country Economic Snapshot</span></div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'JetBrains Mono,monospace', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,200,255,0.12)' }}>
                {['Country', 'GDP (T)', 'Unemployment', 'Renewables', 'Stability'].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, color: 'rgba(232,244,255,0.4)', letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {countryRows.length > 0 ? countryRows.map(([name, c]) => (
                <tr key={name} style={{ borderBottom: '1px solid rgba(0,200,255,0.05)' }}>
                  <td style={{ padding: '10px 16px', color: '#e8f4ff' }}>{name}</td>
                  <td style={{ padding: '10px 16px', color: '#00c8ff' }}>${(c.gdp || 0).toFixed(1)}T</td>
                  <td style={{ padding: '10px 16px', color: '#ffaa00' }}>{((c.unemployment || 0) * 100).toFixed(1)}%</td>
                  <td style={{ padding: '10px 16px', color: '#00ffc8' }}>{((c.renewable_share || 0) * 100).toFixed(0)}%</td>
                  <td style={{ padding: '10px 16px', color: (c.stability || 0) > 0.6 ? '#00ffc8' : '#ff4060' }}>{((c.stability || 0) * 100).toFixed(0)}/100</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: 'rgba(232,244,255,0.3)' }}>
                    Run a simulation to see live country data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}