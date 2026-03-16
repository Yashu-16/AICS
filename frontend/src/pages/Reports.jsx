import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { insightAPI } from '../utils/api'
import { Sparkles, FileText, Download, Sheet } from 'lucide-react'
import { exportCSV, exportPDF } from '../utils/export'

export default function Reports() {
  const { snapshot, snapshotHistory, activeScenario } = useAppStore()
  const [insights, setInsights] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function fetchInsights(focus) {
    setLoading(true); setError(''); setInsights('')
    try {
      const res = await insightAPI.ai({
        simulation_snapshot: snapshot,
        scenario_name:       activeScenario.name,
        focus,
      })
      setInsights(res.insights)
    } catch (e) {
      setError(e.message || 'Failed. Check ANTHROPIC_API_KEY in backend .env')
    } finally {
      setLoading(false)
    }
  }

  const FOCUS = [
    { label: 'Full Overview',      value: null },
    { label: 'Economic risks',     value: 'economic risks and GDP trajectory' },
    { label: 'Climate impact',     value: 'climate change consequences' },
    { label: 'AGI implications',   value: 'AGI and automation impact on society' },
    { label: 'Geopolitical risks', value: 'geopolitical stability and conflict risk' },
  ]

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:20 }}>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:28 }}>AI Insights & Reports</h1>
          <p style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'var(--violet-300)', marginTop:4 }}>CLAUDE-POWERED ANALYSIS + EXPORT</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn-ghost" style={{ fontSize:12 }}
            onClick={() => exportCSV(snapshotHistory, activeScenario.name)}>
            <Download size={13} /> Export CSV
          </button>
          <button className="btn-ghost" style={{ fontSize:12 }}
            onClick={() => exportPDF(snapshotHistory, activeScenario.name, snapshot)}>
            <FileText size={13} /> Export PDF
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><span className="panel-title">Current Simulation State</span></div>
        <div style={{ padding:'12px 16px', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {[
            { label:'Scenario',     value: activeScenario.name },
            { label:'Year',         value: Math.floor(snapshot.year||2025) },
            { label:'World GDP',    value: `$${(snapshot.world_gdp||108).toFixed(1)}T` },
            { label:'Temp Anomaly', value: `+${(snapshot.temp_anomaly||1.2).toFixed(2)}°C` },
          ].map((m) => (
            <div key={m.label}>
              <p style={{ fontSize:10, fontFamily:'JetBrains Mono,monospace', color:'var(--text-muted)', marginBottom:4 }}>{m.label}</p>
              <p style={{ fontSize:15, fontWeight:600, fontFamily:'JetBrains Mono,monospace', color:'var(--violet-300)' }}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:10 }}>Select analysis focus:</p>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {FOCUS.map((f) => (
            <button key={f.label} className="btn-ghost" style={{ fontSize:12 }}
              onClick={() => fetchInsights(f.value)} disabled={loading}>
              <Sparkles size={12} /> {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel" style={{ flex:1 }}>
        <div className="panel-head">
          <span className="panel-title">Claude Analysis</span>
          {loading && <span className="badge badge-live">GENERATING</span>}
        </div>
        <div style={{ padding:20, minHeight:300 }}>
          {error && <div style={{ padding:14, background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.25)', borderRadius:8, color:'var(--danger)', fontSize:13 }}>{error}</div>}

          {!insights && !loading && !error && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:260, gap:14 }}>
              <FileText size={38} style={{ color:'rgba(124,58,237,0.3)' }} />
              <p style={{ fontSize:12, color:'var(--text-dim)', fontFamily:'JetBrains Mono,monospace' }}>Click a focus option above to generate analysis</p>
            </div>
          )}

          {loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:260, gap:14 }}>
              <div style={{ width:36,height:36,border:'2px solid rgba(124,58,237,0.2)',borderTop:'2px solid var(--violet-400)',borderRadius:'50%' }} className="spin" />
              <p style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'JetBrains Mono,monospace' }}>Claude is analyzing your simulation...</p>
            </div>
          )}

          {insights && !loading && (
            <div style={{ whiteSpace:'pre-wrap', fontSize:13, lineHeight:1.85, color:'rgba(241,240,255,0.82)', fontFamily:'Space Grotesk,sans-serif' }}>
              {insights}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}