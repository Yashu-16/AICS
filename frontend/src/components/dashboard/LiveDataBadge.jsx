import { useQuery } from '@tanstack/react-query'
import { api } from '../../utils/api'

export default function LiveDataBadge() {
  const { data } = useQuery({
    queryKey:  ['livedata-status'],
    queryFn:   () => api.get('/livedata/status'),
    refetchInterval: 60_000,
  })

  if (!data?.loaded) return null

  const fetched = data.fetched_at
    ? new Date(data.fetched_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
    : null

  return (
    <div style={{
      position: 'absolute', top: 24, right: 24,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6,
      zIndex: 10, pointerEvents: 'none',
    }}>
      {/* Live badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 12px', borderRadius: 6,
        background: 'rgba(52,211,153,0.10)',
        border: '1px solid rgba(52,211,153,0.25)',
        backdropFilter: 'blur(8px)',
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#34d399',
          boxShadow: '0 0 6px #34d399',
          display: 'inline-block',
          animation: 'pulseLive 2s infinite',
        }} />
        <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace', color: '#34d399', letterSpacing: 1.5 }}>
          LIVE DATA
        </span>
      </div>

      {/* Source pills */}
      <div style={{ display: 'flex', gap: 4 }}>
        {[
          { label: 'World Bank', ok: data.country_count > 0 },
          { label: 'NOAA CO₂',  ok: data.world?.co2_source === 'NOAA' },
          { label: 'NASA Temp', ok: data.world?.temp_source === 'NASA' },
        ].map((s) => (
          <div key={s.label} style={{
            padding: '3px 8px', borderRadius: 4,
            background: s.ok ? 'rgba(52,211,153,0.08)' : 'rgba(251,191,36,0.08)',
            border: `1px solid ${s.ok ? 'rgba(52,211,153,0.20)' : 'rgba(251,191,36,0.20)'}`,
            backdropFilter: 'blur(8px)',
          }}>
            <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono,monospace', color: s.ok ? '#34d399' : '#fbbf24', letterSpacing: 1 }}>
              {s.ok ? '✓' : '~'} {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Last updated */}
      {fetched && (
        <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono,monospace', color: 'rgba(241,240,255,0.25)' }}>
          Updated {fetched}
        </span>
      )}
    </div>
  )
}