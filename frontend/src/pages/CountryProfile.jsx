import { useState, useMemo } from 'react'
import { useAppStore } from '../store/appStore'
import { Search, TrendingUp, TrendingDown, Globe, Shield, Cpu, Users } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

const COUNTRY_META = {
  USA:          { flag: '🇺🇸', region: 'North America', capital: 'Washington D.C.' },
  China:        { flag: '🇨🇳', region: 'Asia',          capital: 'Beijing' },
  EU:           { flag: '🇪🇺', region: 'Europe',        capital: 'Brussels' },
  India:        { flag: '🇮🇳', region: 'Asia',          capital: 'New Delhi' },
  Japan:        { flag: '🇯🇵', region: 'Asia',          capital: 'Tokyo' },
  UK:           { flag: '🇬🇧', region: 'Europe',        capital: 'London' },
  Brazil:       { flag: '🇧🇷', region: 'South America', capital: 'Brasília' },
  Russia:       { flag: '🇷🇺', region: 'Europe/Asia',   capital: 'Moscow' },
  Canada:       { flag: '🇨🇦', region: 'North America', capital: 'Ottawa' },
  Australia:    { flag: '🇦🇺', region: 'Oceania',       capital: 'Canberra' },
  'South Korea':{ flag: '🇰🇷', region: 'Asia',          capital: 'Seoul' },
  Mexico:       { flag: '🇲🇽', region: 'North America', capital: 'Mexico City' },
  Indonesia:    { flag: '🇮🇩', region: 'Asia',          capital: 'Jakarta' },
  Nigeria:      { flag: '🇳🇬', region: 'Africa',        capital: 'Abuja' },
  'South Africa':{ flag: '🇿🇦', region: 'Africa',       capital: 'Pretoria' },
  Bangladesh:   { flag: '🇧🇩', region: 'Asia',          capital: 'Dhaka' },
  Ethiopia:     { flag: '🇪🇹', region: 'Africa',        capital: 'Addis Ababa' },
  Other:        { flag: '🌍', region: 'Global',          capital: '—' },
}

const TT = {
  contentStyle: { background: '#13131e', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 8, fontSize: 11, fontFamily: 'JetBrains Mono,monospace' },
}

export default function CountryProfile() {
  const { snapshot, snapshotHistory } = useAppStore()
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState('USA')

  const countries = Object.entries(snapshot.country_data || {})
  const FALLBACK = {
    USA: { gdp: 28, population: 340, tech_index: 0.92, stability: 0.72, unemployment: 0.038, renewable_share: 0.24 },
    China: { gdp: 18.5, population: 1410, tech_index: 0.85, stability: 0.68, unemployment: 0.045, renewable_share: 0.31 },
    EU: { gdp: 18, population: 450, tech_index: 0.88, stability: 0.75, unemployment: 0.062, renewable_share: 0.44 },
    India: { gdp: 3.7, population: 1440, tech_index: 0.62, stability: 0.63, unemployment: 0.072, renewable_share: 0.21 },
    Japan: { gdp: 4.2, population: 124, tech_index: 0.89, stability: 0.80, unemployment: 0.026, renewable_share: 0.22 },
    UK: { gdp: 3.1, population: 67, tech_index: 0.87, stability: 0.73, unemployment: 0.042, renewable_share: 0.38 },
    Brazil: { gdp: 2.1, population: 215, tech_index: 0.58, stability: 0.55, unemployment: 0.082, renewable_share: 0.48 },
    Russia: { gdp: 2.2, population: 145, tech_index: 0.70, stability: 0.45, unemployment: 0.038, renewable_share: 0.18 },
    Canada: { gdp: 2.1, population: 40, tech_index: 0.86, stability: 0.82, unemployment: 0.052, renewable_share: 0.67 },
    Australia: { gdp: 1.7, population: 27, tech_index: 0.84, stability: 0.83, unemployment: 0.036, renewable_share: 0.35 },
    'South Korea': { gdp: 1.7, population: 52, tech_index: 0.90, stability: 0.76, unemployment: 0.028, renewable_share: 0.09 },
    Mexico: { gdp: 1.4, population: 130, tech_index: 0.54, stability: 0.50, unemployment: 0.031, renewable_share: 0.26 },
    Indonesia: { gdp: 1.3, population: 275, tech_index: 0.50, stability: 0.58, unemployment: 0.055, renewable_share: 0.14 },
    Nigeria: { gdp: 0.5, population: 225, tech_index: 0.32, stability: 0.38, unemployment: 0.042, renewable_share: 0.21 },
    'South Africa': { gdp: 0.4, population: 60, tech_index: 0.48, stability: 0.45, unemployment: 0.32, renewable_share: 0.10 },
    Bangladesh: { gdp: 0.4, population: 170, tech_index: 0.38, stability: 0.42, unemployment: 0.044, renewable_share: 0.04 },
    Ethiopia: { gdp: 0.15, population: 125, tech_index: 0.20, stability: 0.30, unemployment: 0.019, renewable_share: 0.92 },
    Other: { gdp: 15, population: 2000, tech_index: 0.45, stability: 0.52, unemployment: 0.058, renewable_share: 0.22 },
  }

  const allCountryNames = countries.length > 0
    ? countries.map(([name]) => name)
    : Object.keys(FALLBACK)

  const filtered = useMemo(() =>
    allCountryNames.filter((n) => n.toLowerCase().includes(search.toLowerCase())),
    [search, allCountryNames]
  )

  const rawData = countries.length > 0
    ? Object.fromEntries(countries)
    : FALLBACK

  const c    = rawData[selected] || FALLBACK[selected] || {}
  const meta = COUNTRY_META[selected] || { flag: '🌍', region: 'Unknown', capital: '—' }

  const stability   = c.stability   || 0.5
  const tech        = c.tech_index  || 0.5
  const renewable   = c.renewable_share || 0.2
  const unemployment= c.unemployment || 0.05

  const stabColor = stability > 0.7 ? 'var(--ok)' : stability > 0.45 ? 'var(--warn)' : 'var(--danger)'

  const radarData = [
    { domain: 'Economy',    value: Math.round(Math.min(1, (c.gdp || 1) / 30) * 100) },
    { domain: 'Tech',       value: Math.round(tech * 100) },
    { domain: 'Stability',  value: Math.round(stability * 100) },
    { domain: 'Renewables', value: Math.round(renewable * 100) },
    { domain: 'Population', value: Math.round(Math.min(1, (c.population || 100) / 1500) * 100) },
    { domain: 'Employment', value: Math.round((1 - unemployment) * 100) },
  ]

  const histData = snapshotHistory.slice(-30).map((s) => {
    const cd = s.country_data?.[selected] || {}
    return {
      year: Math.floor(s.year),
      gdp:  parseFloat((cd.gdp || c.gdp || 0).toFixed(2)),
    }
  })
  if (histData.length < 2) histData.push({ year: 2025, gdp: c.gdp || 1 }, { year: 2030, gdp: (c.gdp || 1) * 1.05 })

  return (
    <div style={{ height: '100%', display: 'flex', overflow: 'hidden' }}>

      {/* Country list sidebar */}
      <div style={{
        width: 220, flexShrink: 0, height: '100%', overflowY: 'auto',
        borderRight: '1px solid rgba(124,58,237,0.12)',
        background: 'var(--bg-surface)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: 14, borderBottom: '1px solid rgba(124,58,237,0.10)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              className="input-field"
              placeholder="Filter countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 30, fontSize: 12 }}
            />
          </div>
        </div>
        <div style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
          {filtered.map((name) => {
            const d    = rawData[name] || {}
            const m    = COUNTRY_META[name] || { flag: '🌍' }
            const s    = d.stability || 0.5
            const sc   = s > 0.7 ? 'var(--ok)' : s > 0.45 ? 'var(--warn)' : 'var(--danger)'
            return (
              <button key={name} onClick={() => setSelected(name)} style={{
                width: '100%', textAlign: 'left', padding: '10px 10px',
                borderRadius: 8, cursor: 'pointer', marginBottom: 2,
                background: selected === name ? 'rgba(124,58,237,0.14)' : 'transparent',
                border: `1px solid ${selected === name ? 'rgba(124,58,237,0.30)' : 'transparent'}`,
                transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 18 }}>{m.flag}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: selected === name ? 'var(--violet-300)' : 'var(--text-secondary)', truncate: true }}>{name}</p>
                  <p style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace', color: sc }}>{(s * 100).toFixed(0)}/100</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Country profile */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontSize: 52 }}>{meta.flag}</span>
          <div>
            <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 32 }}>{selected}</h1>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <span className="badge badge-violet">{meta.region}</span>
              <span className="badge badge-violet">Capital: {meta.capital}</span>
              <span className={`badge badge-${stability > 0.7 ? 'ok' : stability > 0.45 ? 'warn' : 'danger'}`}>
                {stability > 0.7 ? 'STABLE' : stability > 0.45 ? 'TENSE' : 'UNSTABLE'}
              </span>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[
            { label: 'GDP', value: `$${(c.gdp || 0).toFixed(2)}T`, icon: TrendingUp, color: 'var(--violet-300)' },
            { label: 'Population', value: `${((c.population || 0) / 1000 > 1 ? ((c.population || 0) / 1000).toFixed(2) + 'B' : (c.population || 0) + 'M')}`, icon: Users, color: 'var(--ok)' },
            { label: 'Tech Index', value: `${(tech * 100).toFixed(0)}%`, icon: Cpu, color: 'var(--violet-400)' },
            { label: 'Stability', value: `${(stability * 100).toFixed(0)}/100`, icon: Shield, color: stabColor },
          ].map((k) => (
            <div key={k.label} className="kpi-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace', color: 'var(--text-muted)', letterSpacing: 1.5 }}>{k.label.toUpperCase()}</span>
                <k.icon size={14} style={{ color: k.color, opacity: 0.7 }} />
              </div>
              <p style={{ fontSize: 24, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace', color: k.color }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          {/* Radar */}
          <div className="panel">
            <div className="panel-head"><span className="panel-title">Country Profile Radar</span></div>
            <div style={{ padding: 16, height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(124,58,237,0.15)" />
                  <PolarAngleAxis dataKey="domain" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'JetBrains Mono,monospace' }} />
                  <Radar dataKey="value" stroke="var(--violet-400)" fill="var(--violet-500)" fillOpacity={0.20} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GDP history */}
          <div className="panel">
            <div className="panel-head"><span className="panel-title">GDP Trajectory (Trillion USD)</span></div>
            <div style={{ padding: 16, height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={histData}>
                  <defs>
                    <linearGradient id="countryGdp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.06)" />
                  <XAxis dataKey="year" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }} />
                  <Tooltip {...TT} formatter={(v) => [`$${v}T`, 'GDP']} />
                  <Area type="monotone" dataKey="gdp" stroke="var(--violet-400)" strokeWidth={2} fill="url(#countryGdp)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed stats */}
          <div className="panel" style={{ gridColumn: '1 / -1' }}>
            <div className="panel-head"><span className="panel-title">Detailed Indicators</span></div>
            <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
              {[
                { label: 'Unemployment Rate',  value: `${(unemployment * 100).toFixed(1)}%`,   bar: unemployment,     color: unemployment > 0.15 ? 'var(--danger)' : 'var(--ok)' },
                { label: 'Renewable Share',    value: `${(renewable * 100).toFixed(0)}%`,       bar: renewable,        color: 'var(--ok)' },
                { label: 'Tech Index',         value: `${(tech * 100).toFixed(0)}/100`,         bar: tech,             color: 'var(--violet-300)' },
                { label: 'Political Stability',value: `${(stability * 100).toFixed(0)}/100`,    bar: stability,        color: stabColor },
                { label: 'Carbon Emissions',   value: `${((c.carbon_emissions || c.gdp * 0.4 || 0)).toFixed(1)} GT`,   bar: Math.min(1, (c.carbon_emissions || 5) / 12), color: 'var(--warn)' },
                { label: 'Education Index',    value: `${Math.round(tech * 82 + 18)}/100`,      bar: tech * 0.82 + 0.18, color: 'var(--violet-300)' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{stat.label}</span>
                    <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono,monospace', fontWeight: 600, color: stat.color }}>{stat.value}</span>
                  </div>
                  <div className="prog-bar">
                    <div className="prog-fill" style={{ width: `${Math.min(100, stat.bar * 100)}%`, background: stat.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}