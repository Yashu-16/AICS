import { useState, useRef, useCallback } from 'react'
import { useAppStore } from '../store/appStore'
import { Clock, Play } from 'lucide-react'

export default function TimelineScrubber() {
  const { snapshotHistory, currentYear, setScrubYear, scrubYear, setSnapshot } = useAppStore()
  const [dragging,  setDragging]  = useState(false)
  const [hoverYear, setHoverYear] = useState(null)
  const trackRef = useRef()

  if (!snapshotHistory || snapshotHistory.length < 2) return null

  const startYear = Math.floor(snapshotHistory[0]?.year || 2025)
  const endYear   = Math.floor(snapshotHistory[snapshotHistory.length - 1]?.year || 2125)
  const range     = endYear - startYear || 1

  const yearToPercent = (y) => ((y - startYear) / range) * 100
  const percentToYear = (p) => Math.round(startYear + (p / 100) * range)

  const getYearFromEvent = useCallback((e) => {
    if (!trackRef.current) return startYear
    const rect = trackRef.current.getBoundingClientRect()
    const pct  = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    return percentToYear(pct)
  }, [startYear, range])

  function scrubTo(year) {
    const snap = snapshotHistory.find((s) => Math.floor(s.year) >= year)
    if (snap) {
      setScrubYear(year)
      setSnapshot(snap)
    }
  }

  // Key events on the timeline
  const events = snapshotHistory
    .filter((s) => s.events?.length > 0)
    .slice(0, 12)
    .map((s) => ({
      year:  Math.floor(s.year),
      label: s.events[0],
      type:  s.events[0]?.toLowerCase().includes('agi') ? 'agi'
           : s.events[0]?.toLowerCase().includes('war') ? 'danger' : 'info',
    }))

  const dotColor = { agi:'#a78bfa', danger:'#f87171', info:'#34d399' }

  const activeYear = scrubYear || Math.floor(currentYear)

  return (
    <div style={{
      position:'absolute', bottom:0, left:0, right:0, zIndex:30,
      padding:'10px 24px 14px',
      background:'linear-gradient(0deg,rgba(6,4,16,0.95) 0%,rgba(6,4,16,0.0) 100%)',
    }}>
      {/* Year label row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <Clock size={11} style={{ color:'rgba(167,139,250,0.6)' }} />
          <span style={{ fontSize:10, fontFamily:'JetBrains Mono,monospace', color:'rgba(167,139,250,0.6)', letterSpacing:2 }}>
            TIMELINE
          </span>
        </div>
        <div style={{
          padding:'3px 10px', borderRadius:5,
          background:'rgba(124,58,237,0.12)',
          border:'1px solid rgba(124,58,237,0.25)',
          fontSize:12, fontFamily:'JetBrains Mono,monospace',
          color:'#a78bfa',
        }}>
          {hoverYear || activeYear}
          {scrubYear && (
            <button onClick={() => { setScrubYear(null) }} style={{
              marginLeft:8, background:'none', border:'none', cursor:'pointer',
              color:'rgba(241,240,255,0.4)', fontSize:11, padding:0,
            }}>↺ live</button>
          )}
        </div>
        <div style={{ fontSize:10, fontFamily:'JetBrains Mono,monospace', color:'rgba(241,240,255,0.25)' }}>
          {startYear} — {endYear}
        </div>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        style={{
          position:'relative', height:28, cursor:'crosshair',
          userSelect:'none',
        }}
        onMouseMove={(e) => setHoverYear(getYearFromEvent(e))}
        onMouseLeave={() => setHoverYear(null)}
        onMouseDown={(e) => {
          setDragging(true)
          scrubTo(getYearFromEvent(e))
        }}
        onMouseUp={() => setDragging(false)}
        onMouseMoveCapture={(e) => { if (dragging) scrubTo(getYearFromEvent(e)) }}
      >
        {/* Background track */}
        <div style={{
          position:'absolute', top:11, left:0, right:0, height:3,
          background:'rgba(124,58,237,0.15)', borderRadius:2,
        }} />

        {/* Progress fill */}
        <div style={{
          position:'absolute', top:11, left:0, height:3,
          width:`${yearToPercent(activeYear)}%`,
          background:'linear-gradient(90deg,#5b21b6,#a78bfa)',
          borderRadius:2, transition: dragging ? 'none' : 'width 0.5s ease',
        }} />

        {/* Event dots */}
        {events.map((ev) => (
          <div key={ev.year} title={`${ev.year}: ${ev.label}`} style={{
            position:'absolute', top:7, left:`calc(${yearToPercent(ev.year)}% - 5px)`,
            width:10, height:10, borderRadius:'50%',
            background:dotColor[ev.type] || '#a78bfa',
            border:'2px solid rgba(6,4,16,0.8)',
            boxShadow:`0 0 6px ${dotColor[ev.type] || '#a78bfa'}`,
            cursor:'pointer', zIndex:2,
          }} onClick={() => scrubTo(ev.year)} />
        ))}

        {/* Hover ghost line */}
        {hoverYear && (
          <div style={{
            position:'absolute', top:0, bottom:0,
            left:`${yearToPercent(hoverYear)}%`,
            width:1, background:'rgba(167,139,250,0.3)',
            pointerEvents:'none',
          }} />
        )}

        {/* Playhead */}
        <div style={{
          position:'absolute', top:4,
          left:`calc(${yearToPercent(activeYear)}% - 8px)`,
          width:16, height:16, borderRadius:'50%',
          background:'#a78bfa',
          border:'3px solid rgba(6,4,16,0.9)',
          boxShadow:'0 0 16px rgba(167,139,250,0.6)',
          cursor:'grab', zIndex:3,
          transition: dragging ? 'none' : 'left 0.5s ease',
        }} />

        {/* Year labels */}
        {[0, 25, 50, 75, 100].map((pct) => (
          <span key={pct} style={{
            position:'absolute', bottom:0, left:`${pct}%`,
            transform:'translateX(-50%)',
            fontSize:9, fontFamily:'JetBrains Mono,monospace',
            color:'rgba(241,240,255,0.2)',
          }}>
            {percentToYear(pct)}
          </span>
        ))}
      </div>
    </div>
  )
}