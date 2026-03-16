import { useAppStore } from '../store/appStore'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const TT = {
  contentStyle: { background: '#0a1520', border: '1px solid rgba(0,200,255,0.2)', borderRadius: 6, fontSize: 11, fontFamily: 'JetBrains Mono,monospace' },
}

export default function Population() {
  const { snapshot, snapshotHistory } = useAppStore()

  const hist = snapshotHistory.length > 2 ? snapshotHistory : [
    { year: 2025, population: 8100 },
    { year: 2035, population: 8600 },
    { year: 2050, population: 9200 },
    { year: 2075, population: 9800 },
  ]

  const chartData = hist.slice(-40).map((s) => ({
    year: Math.floor(s.year),
    pop:  parseFloat(((s.population || 8100) / 1000).toFixed(3)),
  }))

  const pop        = (snapshot.population || 8100) / 1000
  const urbanRate  = 57
  const migrants   = Math.max(0, ((snapshot.temp_anomaly || 1.2) - 1.5) * 20).toFixed(1)
  const growthRate = 0.8

  const REGIONS = [
    { name: 'Asia Pacific',     pop: 4.7, growth: '+0.6%', color: '#00c8ff' },
    { name: 'Africa',           pop: 1.5, growth: '+2.4%', color: '#00ffc8' },
    { name: 'Europe',           pop: 0.74,growth: '-0.1%', color: '#ffaa00' },
    { name: 'Americas',         pop: 1.05,growth: '+0.5%', color: '#00c8ff' },
    { name: 'Middle East',      pop: 0.43,growth: '+1.8%', color: '#ff4060' },
  ]

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 28 }}>Population</h1>
        <p style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#00c8ff', marginTop: 4 }}>GLOBAL DEMOGRAPHIC INDICATORS</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { label: 'World Population', value: `${pop.toFixed(2)}B`, sub: 'Total',                   color: '#e8f4ff' },
          { label: 'Growth Rate',      value: `${growthRate}%/yr`,  sub: 'Annual rate',              color: '#00c8ff' },
          { label: 'Urbanization',     value: `${urbanRate}%`,      sub: 'Urban population',         color: '#00ffc8' },
          { label: 'Climate Migrants', value: `${migrants}M`,       sub: 'Displaced persons',        color: parseFloat(migrants) > 5 ? '#ff4060' : '#ffaa00' },
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
          <div className="panel-head"><span className="panel-title">World Population (Billion)</span></div>
          <div style={{ padding: 16, height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="popG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00ffc8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00ffc8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,200,255,0.06)" />
                <XAxis dataKey="year" tick={{ fill: 'rgba(232,244,255,0.35)', fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }} />
                <YAxis tick={{ fill: 'rgba(232,244,255,0.35)', fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }} />
                <Tooltip {...TT} formatter={(v) => [`${v}B`, 'Population']} />
                <Area type="monotone" dataKey="pop" stroke="#00ffc8" strokeWidth={2} fill="url(#popG)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional breakdown */}
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Regional Population (Billion)</span></div>
          <div style={{ padding: '14px 16px' }}>
            {REGIONS.map((r) => (
              <div key={r.name} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: '#e8f4ff' }}>{r.name}</span>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono,monospace', color: r.color }}>{r.pop}B</span>
                    <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono,monospace', color: r.growth.startsWith('+') ? '#00ffc8' : '#ff4060' }}>{r.growth}</span>
                  </div>
                </div>
                <div className="prog-bar">
                  <div className="prog-fill" style={{ width: `${(r.pop / 5) * 100}%`, background: r.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}