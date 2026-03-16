import { NavLink } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'
import {
  Globe, BarChart3, Thermometer, Cpu, Shield,
  Users, FlaskConical, FileText, GitCompare, Search
} from 'lucide-react'

const NAV = [
  { section: 'SIMULATION', items: [
    { to: '/dashboard',   icon: Globe,       label: 'Globe Overview' },
    { to: '/compare',     icon: GitCompare,  label: 'Compare Scenarios' },
    { to: '/scenarios',   icon: FlaskConical,label: 'Scenario Library' },
  ]},
  { section: 'DOMAINS', items: [
    { to: '/economy',     icon: BarChart3,   label: 'Economy' },
    { to: '/climate',     icon: Thermometer, label: 'Climate' },
    { to: '/technology',  icon: Cpu,         label: 'Technology' },
    { to: '/geopolitics', icon: Shield,      label: 'Geopolitics' },
    { to: '/population',  icon: Users,       label: 'Population' },
  ]},
  { section: 'INTELLIGENCE', items: [
    { to: '/country',     icon: Search,      label: 'Country Profile' },
    { to: '/reports',     icon: FileText,    label: 'AI Insights' },
  ]},
]

export default function Sidebar() {
  const { sidebarCollapsed, snapshot } = useAppStore()
  if (sidebarCollapsed) return null

  const temp   = snapshot?.temp_anomaly || 1.2
  const health = temp < 1.5 ? 'ok' : temp < 2.5 ? 'warn' : 'danger'
  const healthColor = { ok: 'var(--ok)', warn: 'var(--warn)', danger: 'var(--danger)' }[health]

  return (
    <aside style={{
      width: 224, flexShrink: 0, height: '100%',
      overflowY: 'auto', display: 'flex', flexDirection: 'column',
      background: 'var(--bg-surface)',
      borderRight: '1px solid rgba(124,58,237,0.12)',
    }}>
      <div style={{ flex: 1, padding: '12px 0' }}>
        {NAV.map((group) => (
          <div key={group.section} style={{ padding: '0 10px', marginBottom: 22 }}>
            <p style={{
              fontSize: 9, fontFamily: 'JetBrains Mono,monospace',
              letterSpacing: 3, color: 'var(--text-dim)',
              marginBottom: 6, padding: '0 6px', textTransform: 'uppercase',
            }}>
              {group.section}
            </p>
            {group.items.map((item) => (
              <NavLink
                key={item.to} to={item.to}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <item.icon size={14} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13 }}>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* Earth health indicator */}
      <div style={{
        margin: '0 10px 16px', padding: '14px',
        borderRadius: 10, border: `1px solid ${healthColor}28`,
        background: `${healthColor}08`,
      }}>
        <p style={{ fontSize: 9, fontFamily: 'JetBrains Mono,monospace', letterSpacing: 2, color: 'var(--text-dim)', marginBottom: 8 }}>
          EARTH HEALTH
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: healthColor, fontWeight: 600 }}>
            +{temp.toFixed(2)}°C anomaly
          </span>
          <span className={`badge badge-${health}`}>{health.toUpperCase()}</span>
        </div>
        <div className="prog-bar" style={{ marginTop: 8 }}>
          <div className="prog-fill" style={{
            width: `${Math.min(100, (temp / 4) * 100)}%`,
            background: healthColor,
          }} />
        </div>
      </div>
    </aside>
  )
}