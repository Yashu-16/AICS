import { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { X } from 'lucide-react'

export default function ScenarioModal() {
  const { closeModal, setActiveScenario } = useAppStore()
  const [form, setForm] = useState({
    scenario_name:           'My Scenario',
    agi_introduction_year:   2045,
    global_automation_rate:  0.30,
    carbon_tax_per_tonne:    80,
    renewable_energy_target: 0.60,
    geopolitical_tension:    'medium',
    start_year:              2025,
    end_year:                2125,
  })

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  function handleRun() {
    setActiveScenario({ id: 'custom', name: form.scenario_name, params: form })
    closeModal()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(2,4,8,0.92)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#0a1520', border: '1px solid rgba(0,200,255,0.25)',
        borderRadius: 16, width: 520, maxHeight: '88vh', overflowY: 'auto', padding: 32,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 22 }}>Configure Scenario</h2>
            <p style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#00c8ff', marginTop: 4 }}>
              SIMULATION PARAMETERS
            </p>
          </div>
          <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(232,244,255,0.5)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ fontSize: 11, fontFamily: 'JetBrains Mono,monospace', color: 'rgba(232,244,255,0.5)', display: 'block', marginBottom: 8 }}>
              Scenario Name
            </label>
            <input className="input-field" value={form.scenario_name} onChange={(e) => set('scenario_name', e.target.value)} />
          </div>

          {[
            { key: 'agi_introduction_year',   label: 'AGI Introduction Year',  min: 2025, max: 2080, step: 1,    fmt: (v) => v },
            { key: 'global_automation_rate',  label: 'Global Automation Rate', min: 0.05, max: 0.95, step: 0.05, fmt: (v) => `${Math.round(v * 100)}%` },
            { key: 'carbon_tax_per_tonne',    label: 'Carbon Tax ($/tonne)',   min: 0,    max: 300,  step: 10,   fmt: (v) => `$${v}` },
            { key: 'renewable_energy_target', label: 'Renewable Target',       min: 0.10, max: 1.0,  step: 0.05, fmt: (v) => `${Math.round(v * 100)}%` },
          ].map(({ key, label, min, max, step, fmt }) => (
            <div key={key}>
              <label style={{ fontSize: 11, fontFamily: 'JetBrains Mono,monospace', color: 'rgba(232,244,255,0.5)', display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>{label}</span>
                <span style={{ color: '#00c8ff' }}>{fmt(form[key])}</span>
              </label>
              <input type="range" min={min} max={max} step={step} value={form[key]}
                onChange={(e) => set(key, parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#00c8ff' }}
              />
            </div>
          ))}

          <div>
            <label style={{ fontSize: 11, fontFamily: 'JetBrains Mono,monospace', color: 'rgba(232,244,255,0.5)', display: 'block', marginBottom: 8 }}>
              Geopolitical Tension
            </label>
            <select className="select-field" value={form.geopolitical_tension} onChange={(e) => set('geopolitical_tension', e.target.value)}>
              <option value="low">Low — Cooperative</option>
              <option value="medium">Medium — Current tensions</option>
              <option value="high">High — Great power competition</option>
              <option value="critical">Critical — Conflict escalation</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
          <button className="btn-ghost" style={{ padding: '11px 20px' }} onClick={closeModal}>Cancel</button>
          <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: 12, fontSize: 14 }} onClick={handleRun}>
            ▶  RUN SIMULATION
          </button>
        </div>
      </div>
    </div>
  )
}