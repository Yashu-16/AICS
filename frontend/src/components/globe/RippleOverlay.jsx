import { useEffect, useRef } from 'react'

export default function RippleOverlay({ events }) {
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:10 }}>
      {events.map((ev) => (
        <RippleRing key={ev.id} event={ev} />
      ))}
    </div>
  )
}

function RippleRing({ event }) {
  const color = {
    CRISIS:       '#f87171',
    BREAKTHROUGH: '#34d399',
    GEOPOLITICAL: '#fbbf24',
  }[event.category] || '#a78bfa'

  const rings = [0, 400, 800]

  return (
    <>
      {rings.map((delay, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: event.x - 6, top: event.y - 6,
          width: 12, height: 12,
          borderRadius: '50%',
          border: `2px solid ${color}`,
          animation: `rippleOut 2.4s ease-out ${delay}ms forwards`,
          pointerEvents: 'none',
        }} />
      ))}
      {/* Center dot */}
      <div style={{
        position: 'absolute',
        left: event.x - 5, top: event.y - 5,
        width: 10, height: 10,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 12px ${color}`,
        animation: 'dotFade 2s ease-out 0.8s forwards',
      }} />
      {/* Label */}
      <div style={{
        position: 'absolute',
        left: event.x + 14, top: event.y - 10,
        padding: '3px 8px', borderRadius: 5,
        background: 'rgba(10,10,18,0.90)',
        border: `1px solid ${color}40`,
        fontSize: 10, fontFamily: 'JetBrains Mono,monospace',
        color: color, letterSpacing: 0.5,
        whiteSpace: 'nowrap',
        animation: 'labelFade 3s ease-out 0.3s forwards',
        opacity: 0,
      }}>
        {event.icon} {event.label}
      </div>
      <style>{`
        @keyframes rippleOut {
          0%   { transform:scale(1);  opacity:0.9; }
          100% { transform:scale(18); opacity:0;   }
        }
        @keyframes dotFade {
          0%   { opacity:1; }
          100% { opacity:0; }
        }
        @keyframes labelFade {
          0%   { opacity:0; transform:translateX(-4px); }
          15%  { opacity:1; transform:translateX(0); }
          80%  { opacity:1; }
          100% { opacity:0; }
        }
      `}</style>
    </>
  )
}