import { useAppStore } from '../store/appStore'
import { Play, Pause, ChevronRight, Plus, Menu, Zap } from 'lucide-react'

export default function Topbar() {
  const {
    currentYear, progress, isPlaying, simSpeed, simulationStatus,
    togglePlay, setSimSpeed, openModal, toggleSidebar, activeScenario,
  } = useAppStore()

  const statusConfig = {
    running:  { color: '#34d399', label: 'LIVE' },
    idle:     { color: '#fbbf24', label: 'IDLE' },
    complete: { color: '#a78bfa', label: 'DONE' },
    error:    { color: '#f87171', label: 'ERROR' },
  }[simulationStatus] || { color: '#fbbf24', label: 'IDLE' }

  return (
    <header style={{
      height: 58, display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: 14, flexShrink: 0, zIndex: 50,
      background: 'rgba(10,10,15,0.98)',
      borderBottom: '1px solid rgba(124,58,237,0.15)',
      backdropFilter: 'blur(12px)',
    }}>

      <button onClick={toggleSidebar} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-muted)', padding: 6, borderRadius: 6,
        display: 'flex', transition: 'color 0.15s',
      }}>
        <Menu size={17} />
      </button>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 4 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg, #5b21b6, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 16px rgba(124,58,237,0.4)',
        }}>
          <Zap size={14} color="#fff" />
        </div>
        <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>
          AI<span style={{ color: 'var(--violet-300)' }}>CS</span>
        </span>
      </div>

      {/* Scenario chip */}
      <div style={{
        padding: '4px 12px', borderRadius: 6,
        background: 'rgba(124,58,237,0.10)',
        border: '1px solid rgba(124,58,237,0.22)',
        fontSize: 11, fontFamily: 'JetBrains Mono,monospace',
        color: 'var(--violet-300)', letterSpacing: 1,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ color: 'var(--text-muted)' }}>SCN</span>
        {activeScenario.name.toUpperCase()}
      </div>

      {/* Progress track */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, maxWidth: 480, margin: '0 8px' }}>
        <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace', color: 'var(--text-dim)', minWidth: 32 }}>2025</span>
        <div style={{ flex: 1, position: 'relative', height: 4, background: 'rgba(124,58,237,0.10)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #5b21b6, #a78bfa)',
            borderRadius: 2, transition: 'width 0.5s ease',
          }} />
        </div>
        <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace', color: 'var(--text-dim)', minWidth: 32 }}>2125</span>
      </div>

      {/* Year display */}
      <div style={{
        padding: '5px 14px', borderRadius: 8,
        background: 'rgba(124,58,237,0.08)',
        border: '1px solid rgba(124,58,237,0.18)',
      }}>
        <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace', color: 'var(--text-muted)' }}>YEAR </span>
        <span style={{ fontSize: 18, fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, color: 'var(--violet-200)' }}>
          {currentYear}
        </span>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={togglePlay} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
          border: `1px solid ${isPlaying ? 'rgba(52,211,153,0.35)' : 'rgba(124,58,237,0.30)'}`,
          background: isPlaying ? 'rgba(52,211,153,0.08)' : 'rgba(124,58,237,0.10)',
          color: isPlaying ? 'var(--ok)' : 'var(--violet-300)',
          fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
        }}>
          {isPlaying ? <Pause size={13} /> : <Play size={13} />}
          {isPlaying ? 'PAUSE' : 'PLAY'}
        </button>

        <button onClick={() => setSimSpeed(simSpeed >= 8 ? 0.5 : simSpeed * 2)} style={{
          padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
          border: '1px solid rgba(124,58,237,0.20)',
          background: 'rgba(124,58,237,0.06)',
          color: 'var(--text-muted)',
          fontSize: 11, fontFamily: 'JetBrains Mono,monospace',
          transition: 'all 0.15s',
        }}>
          {simSpeed}×
        </button>
      </div>

      {/* Status */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 10, fontFamily: 'JetBrains Mono,monospace',
        padding: '5px 12px', borderRadius: 6,
        background: `${statusConfig.color}12`,
        border: `1px solid ${statusConfig.color}30`,
        color: statusConfig.color, letterSpacing: 1.5,
      }}>
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: statusConfig.color,
          boxShadow: simulationStatus === 'running' ? `0 0 6px ${statusConfig.color}` : 'none',
          display: 'inline-block',
        }} />
        {statusConfig.label}
      </div>

      <button className="btn-primary" onClick={() => openModal('scenario')}
        style={{ marginLeft: 4, padding: '7px 16px', fontSize: 12 }}>
        <Plus size={13} /> New Scenario
      </button>
    </header>
  )
}