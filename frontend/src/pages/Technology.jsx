import { useAppStore } from '../store/appStore'
import {
  LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

const TT = {
  contentStyle: { background: '#0a1520', border: '1px solid rgba(0,200,255,0.2)', borderRadius: 6, fontSize: 11, fontFamily: 'JetBrains Mono,monospace' },
}

export default function Technology() {
  const { snapshot, snapshotHistory, currentYear } = useAppStore()

  const hist = snapshotHistory.length > 2 ? snapshotHistory : [
    { year: 2025, tech_progress_index: 0.55, automation_index: 0.18 },
    { year: 2030, tech_progress_index: 0.62, automation_index: 0.25 },
    { year: 2040, tech_progress_index: 0.74, automation_index: 0.38 },
    { year: 2050, tech_progress_index: 0.88, automation_index: 0.55 },
  ]

  const chartData = hist.slice(-40).map((s) => ({
    year:       Math.floor(s.year),
    progress:   parseFloat(((s.tech_progress_index || 0) * 100).toFixed(1)),
    automation: parseFloat(((s.automation_index    || 0) * 100).toFixed(1)),
  }))

  const progress   = snapshot.tech_progress_index || 0.55
  const automation = snapshot.automation_index    || 0.18
  const agiYear    = 2055

  const radarData = [
    { domain: 'AI',          value: Math.round(progress * 95) },
    { domain: 'Energy',      value: Math.round(progress * 72) },
    { domain: 'Biotech',     value: Math.round(progress * 68) },
    { domain: 'Space',       value: Math.round(progress * 45) },
    { domain: 'Quantum',     value: Math.round(progress * 58) },
    { domain: 'Nanotech',    value: Math.round(progress * 40) },
  ]

  const milestones = [
    { year: 2028, label: 'AGI Research Breakthrough',     done: currentYear >= 2028 },
    { year: 2034, label: 'Level 4 Autonomous Vehicles',   done: currentYear >= 2034 },
    { year: 2040, label: 'Commercial Fusion Energy',      done: currentYear >= 2040 },
    { year: agiYear, label: 'Artificial General Intelligence', done: currentYear >= agiYear, highlight: true },
    { year: 2070, label: 'Brain-Computer Integration',    done: currentYear >= 2070 },
    { year: 2090, label: 'Molecular Nanotechnology',      done: currentYear >= 2090 },
  ]

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 28 }}>Technology</h1>
        <p style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#00c8ff', marginTop: 4 }}>TECHNOLOGICAL PROGRESS INDICATORS</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { label: 'Tech Progress',  value: `${(progress * 100).toFixed(1)}%`,    sub: 'Global index',      color: '#00c8ff' },
          { label: 'Automation',     value: `${(automation * 100).toFixed(1)}%`,  sub: 'Workforce share',   color: '#ffaa00' },
          { label: 'AGI ETA',        value: currentYear >= agiYear ? 'ACTIVE' : `${agiYear - currentYear}yr`, sub: 'To AGI threshold', color: currentYear >= agiYear ? '#00ffc8' : '#e8f4ff' },
          { label: 'R&D Investment', value: `$${(progress * 5.2).toFixed(1)}T`,   sub: 'Annual global',     color: '#00c8ff' },
        ].map((k) => (
          <div key={k.label} className="panel" style={{ padding: 18 }}>
            <p style={{ fontSize: 11, fontFamily: 'JetBrains Mono,monospace', color: 'rgba(232,244,255,0.4)', marginBottom: 8 }}>{k.label}</p>
            <p style={{ fontSize: 26, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace', color: k.color }}>{k.value}</p>
            <p style={{ fontSize: 11, color: 'rgba(232,244,255,0.35)', marginTop: 4 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* Progress chart */}
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Tech Progress Index</span></div>
          <div style={{ padding: 16, height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="techG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00c8ff" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00c8ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,200,255,0.06)" />
                <XAxis dataKey="year" tick={{ fill: 'rgba(232,244,255,0.35)', fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }} />
                <YAxis tick={{ fill: 'rgba(232,244,255,0.35)', fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }} />
                <Tooltip {...TT} formatter={(v) => [`${v}%`, 'Progress']} />
                <Area type="monotone" dataKey="progress" stroke="#00c8ff" strokeWidth={2} fill="url(#techG)" dot={false} />
                <Area type="monotone" dataKey="automation" stroke="#ffaa00" strokeWidth={2} fill="none" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar chart */}
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Technology Domain Radar</span></div>
          <div style={{ padding: 16, height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(0,200,255,0.15)" />
                <PolarAngleAxis dataKey="domain" tick={{ fill: 'rgba(232,244,255,0.5)', fontSize: 11, fontFamily: 'JetBrains Mono,monospace' }} />
                <Radar dataKey="value" stroke="#00c8ff" fill="#00c8ff" fillOpacity={0.18} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Milestones */}
        <div className="panel" style={{ gridColumn: '1 / -1' }}>
          <div className="panel-head"><span className="panel-title">Technology Milestones</span></div>
          <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {milestones.map((m) => (
              <div key={m.year} style={{
                padding: 14, borderRadius: 8,
                background: m.done ? 'rgba(0,200,255,0.08)' : 'rgba(0,200,255,0.03)',
                border: `1px solid ${m.highlight ? 'rgba(0,255,200,0.35)' : m.done ? 'rgba(0,200,255,0.20)' : 'rgba(0,200,255,0.08)'}`,
              }}>
                <p style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace', color: m.done ? '#00c8ff' : 'rgba(232,244,255,0.35)', marginBottom: 6 }}>
                  {m.done ? '✓' : '○'} {m.year}
                </p>
                <p style={{ fontSize: 13, color: m.done ? '#e8f4ff' : 'rgba(232,244,255,0.45)', fontWeight: m.highlight ? 600 : 400 }}>
                  {m.label}
                </p>
                {m.highlight && <span className="badge badge-ok" style={{ marginTop: 8, display: 'inline-block' }}>KEY EVENT</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}