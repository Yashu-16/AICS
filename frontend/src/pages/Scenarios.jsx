import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { useQuery } from '@tanstack/react-query'
import { scenarioAPI } from '../utils/api'
import { FlaskConical, Play } from 'lucide-react'

export default function Scenarios() {
  const { setActiveScenario, openModal, activeScenario } = useAppStore()
  const [selected, setSelected] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['scenarios'],
    queryFn:  () => scenarioAPI.list(),
  })

  const scenarios = data?.scenarios || []

  function applyScenario(sc) {
    setActiveScenario({
      id:     sc.id,
      name:   sc.name,
      params: { ...sc.params, scenario_name: sc.name, start_year: 2025, end_year: 2125 },
    })
    setSelected(sc.id)
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 28 }}>Scenarios</h1>
          <p style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#00c8ff', marginTop: 4 }}>SIMULATION SCENARIO LIBRARY</p>
        </div>
        <button className="btn-primary" onClick={() => openModal('scenario')}>
          <FlaskConical size={14} /> Custom Scenario
        </button>
      </div>

      {isLoading ? (
        <p style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: 'rgba(232,244,255,0.4)' }}>Loading scenarios...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {scenarios.map((sc) => {
            const isActive = activeScenario.id === sc.id
            const isSelected = selected === sc.id
            return (
              <div key={sc.id} className="panel" style={{
                padding: 22, cursor: 'pointer',
                border: `1px solid ${isActive ? 'rgba(0,200,255,0.4)' : 'rgba(0,200,255,0.10)'}`,
                background: isActive ? 'rgba(0,200,255,0.06)' : 'var(--bg-card)',
                transition: 'all 0.2s',
              }}
                onClick={() => applyScenario(sc)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 16, color: isActive ? '#00c8ff' : '#e8f4ff' }}>{sc.name}</h3>
                  {isActive && <span className="badge badge-cyan">ACTIVE</span>}
                </div>
                <p style={{ fontSize: 13, color: 'rgba(232,244,255,0.55)', marginBottom: 16, lineHeight: 1.5 }}>{sc.description}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                  {[
                    { label: 'AGI Year',    value: sc.params?.agi_introduction_year },
                    { label: 'Automation',  value: `${Math.round((sc.params?.global_automation_rate || 0) * 100)}%` },
                    { label: 'Carbon Tax',  value: `$${sc.params?.carbon_tax_per_tonne || 0}/t` },
                    { label: 'Tension',     value: sc.params?.geopolitical_tension },
                  ].map((p) => (
                    <div key={p.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'rgba(232,244,255,0.4)', fontFamily: 'JetBrains Mono,monospace' }}>{p.label}</span>
                      <span style={{ fontSize: 11, color: '#00c8ff', fontFamily: 'JetBrains Mono,monospace' }}>{p.value}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                  {(sc.tags || []).map((tag) => (
                    <span key={tag} className="badge badge-cyan">{tag}</span>
                  ))}
                </div>

                <button
                  className={isActive ? 'btn-primary' : 'btn-ghost'}
                  style={{ width: '100%', justifyContent: 'center', padding: '9px 0', fontSize: 12 }}
                  onClick={(e) => { e.stopPropagation(); applyScenario(sc) }}
                >
                  <Play size={12} /> {isActive ? 'Active' : 'Select & Run'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}