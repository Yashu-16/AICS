import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { simulationAPI } from '../utils/api'
import { GitCompare, Play } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'

const PRESETS = [
  { id: 'baseline',              name: 'Baseline',             params: { start_year:2025,end_year:2075,agi_introduction_year:2055,global_automation_rate:0.25,carbon_tax_per_tonne:0,  renewable_energy_target:0.35,geopolitical_tension:'medium',scenario_name:'Baseline',random_seed:42 } },
  { id: 'high-automation',       name: 'High Automation',      params: { start_year:2025,end_year:2075,agi_introduction_year:2034,global_automation_rate:0.60,carbon_tax_per_tonne:80, renewable_energy_target:0.60,geopolitical_tension:'medium',scenario_name:'High Automation',random_seed:42 } },
  { id: 'green-transition',      name: 'Green Transition',     params: { start_year:2025,end_year:2075,agi_introduction_year:2050,global_automation_rate:0.30,carbon_tax_per_tonne:200,renewable_energy_target:0.90,geopolitical_tension:'low',   scenario_name:'Green Transition',random_seed:42 } },
  { id: 'geopolitical-fracture', name: 'Geopolitical Fracture',params: { start_year:2025,end_year:2075,agi_introduction_year:2065,global_automation_rate:0.20,carbon_tax_per_tonne:20, renewable_energy_target:0.25,geopolitical_tension:'critical',scenario_name:'Geopolitical Fracture',random_seed:42 } },
  { id: 'utopia',                name: 'Cooperative Utopia',   params: { start_year:2025,end_year:2075,agi_introduction_year:2040,global_automation_rate:0.70,carbon_tax_per_tonne:250,renewable_energy_target:1.00,geopolitical_tension:'low',   scenario_name:'Cooperative Utopia',random_seed:42 } },
]

const COLORS = ['#a78bfa', '#34d399', '#fbbf24', '#f87171', '#60a5fa']

const TT = {
  contentStyle: { background:'#13131e', border:'1px solid rgba(124,58,237,0.25)', borderRadius:8, fontSize:11, fontFamily:'JetBrains Mono,monospace' },
}

const METRICS = [
  { key:'world_gdp',              label:'World GDP ($T)',      fmt:(v)=>`$${v?.toFixed(1)}T` },
  { key:'temp_anomaly',           label:'Temp Anomaly (°C)',   fmt:(v)=>`+${v?.toFixed(2)}°C` },
  { key:'automation_index',       label:'Automation (%)',      fmt:(v)=>`${((v||0)*100).toFixed(0)}%` },
  { key:'geopolitical_stability', label:'Geo Stability (%)',   fmt:(v)=>`${((v||0)*100).toFixed(0)}%` },
  { key:'renewable_share',        label:'Renewables (%)',      fmt:(v)=>`${((v||0)*100).toFixed(0)}%` },
  { key:'unemployment_rate',      label:'Unemployment (%)',    fmt:(v)=>`${((v||0)*100).toFixed(1)}%` },
]

export default function Compare() {
  const [selectedA, setSelectedA] = useState('baseline')
  const [selectedB, setSelectedB] = useState('green-transition')
  const [results,   setResults]   = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [activeMetric, setActiveMetric] = useState('world_gdp')

  async function runComparison() {
    setLoading(true); setResults(null)
    try {
      const pA = PRESETS.find((p) => p.id === selectedA)
      const pB = PRESETS.find((p) => p.id === selectedB)

      const [rA, rB] = await Promise.all([
        simulationAPI.run(pA.params),
        simulationAPI.run(pB.params),
      ])

      await new Promise((res) => setTimeout(res, 6000))

      const [dA, dB] = await Promise.all([
        simulationAPI.results(rA.simulation_id),
        simulationAPI.results(rB.simulation_id),
      ])

      const sample = (data, n=40) => {
        if (!data?.data?.length) return []
        const step = Math.max(1, Math.floor(data.data.length / n))
        return data.data.filter((_, i) => i % step === 0)
      }

      setResults({ A: { name: pA.name, data: sample(dA) }, B: { name: pB.name, data: sample(dB) } })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const chartData = results ? results.A.data.map((rowA, i) => {
    const rowB = results.B.data[i] || {}
    return {
      year: Math.floor(rowA.year),
      [results.A.name]: parseFloat((rowA[activeMetric] || 0).toFixed(3)),
      [results.B.name]: parseFloat((rowB[activeMetric] || 0).toFixed(3)),
    }
  }) : []

  const finalA = results?.A.data.slice(-1)[0]
  const finalB = results?.B.data.slice(-1)[0]

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:20 }}>

      <div>
        <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:28 }}>Compare Scenarios</h1>
        <p style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'var(--violet-300)', marginTop:4 }}>SIDE-BY-SIDE SIMULATION ANALYSIS</p>
      </div>

      {/* Selector row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:16, alignItems:'end' }}>
        <div>
          <label style={{ fontSize:10, fontFamily:'JetBrains Mono,monospace', color:'var(--text-muted)', letterSpacing:2, display:'block', marginBottom:8 }}>SCENARIO A</label>
          <select className="select-field" value={selectedA} onChange={(e)=>setSelectedA(e.target.value)}>
            {PRESETS.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', paddingBottom:2 }}>
          <GitCompare size={20} style={{ color:'var(--violet-400)' }} />
        </div>
        <div>
          <label style={{ fontSize:10, fontFamily:'JetBrains Mono,monospace', color:'var(--text-muted)', letterSpacing:2, display:'block', marginBottom:8 }}>SCENARIO B</label>
          <select className="select-field" value={selectedB} onChange={(e)=>setSelectedB(e.target.value)}>
            {PRESETS.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <button className="btn-primary" onClick={runComparison} disabled={loading || selectedA === selectedB}
        style={{ alignSelf:'flex-start', padding:'10px 28px', fontSize:13 }}>
        {loading ? <><span className="spin" style={{ display:'inline-block',width:13,height:13,border:'2px solid rgba(255,255,255,0.3)',borderTop:'2px solid #fff',borderRadius:'50%' }} /> Running...</> : <><Play size={14} /> Run Comparison</>}
      </button>

      {loading && (
        <div className="panel" style={{ padding:32, textAlign:'center' }}>
          <p style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12, color:'var(--text-muted)' }}>Running both simulations in parallel... (~6 seconds)</p>
          <div style={{ marginTop:16, height:3, background:'rgba(124,58,237,0.10)', borderRadius:2, overflow:'hidden' }}>
            <div style={{ height:'100%', background:'linear-gradient(90deg,#5b21b6,#a78bfa)', borderRadius:2, animation:'progress 6s linear forwards' }} />
          </div>
          <style>{`@keyframes progress { from{width:0%} to{width:100%} }`}</style>
        </div>
      )}

      {results && (
        <>
          {/* Metric tabs */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {METRICS.map((m) => (
              <button key={m.key} onClick={()=>setActiveMetric(m.key)} style={{
                padding:'6px 14px', borderRadius:6, cursor:'pointer', fontSize:11,
                fontFamily:'JetBrains Mono,monospace', border:'1px solid',
                borderColor: activeMetric===m.key ? 'var(--border-bright)' : 'var(--border-dim)',
                background:  activeMetric===m.key ? 'rgba(124,58,237,0.15)' : 'transparent',
                color:       activeMetric===m.key ? 'var(--violet-300)' : 'var(--text-muted)',
                transition:'all 0.15s',
              }}>
                {m.label}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">{METRICS.find(m=>m.key===activeMetric)?.label}</span>
            </div>
            <div style={{ padding:20, height:320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.06)" />
                  <XAxis dataKey="year" tick={{ fill:'var(--text-muted)', fontSize:10, fontFamily:'JetBrains Mono,monospace' }} />
                  <YAxis tick={{ fill:'var(--text-muted)', fontSize:10, fontFamily:'JetBrains Mono,monospace' }} />
                  <Tooltip {...TT} />
                  <Legend wrapperStyle={{ fontSize:11, fontFamily:'JetBrains Mono,monospace' }} />
                  <Line type="monotone" dataKey={results.A.name} stroke={COLORS[0]} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey={results.B.name} stroke={COLORS[1]} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Final outcome cards */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {[
              { label: results.A.name, data: finalA, color: COLORS[0] },
              { label: results.B.name, data: finalB, color: COLORS[1] },
            ].map(({ label, data, color }) => (
              <div key={label} className="panel" style={{ borderColor: color + '40' }}>
                <div className="panel-head">
                  <span style={{ fontSize:11, fontFamily:'JetBrains Mono,monospace', fontWeight:600, color }}>{label} — Year 2075</span>
                </div>
                <div style={{ padding:'14px 18px' }}>
                  {METRICS.map((m) => (
                    <div key={m.key} className="metric-row">
                      <span className="metric-label">{m.label}</span>
                      <span className="metric-value" style={{ color }}>{m.fmt(data?.[m.key])}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}