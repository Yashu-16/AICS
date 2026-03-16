import Globe from '../components/globe/Globe'
import GlobeControls from '../components/globe/GlobeControls'
import MetricsPanel from '../components/dashboard/MetricsPanel'
import LiveDataBadge from '../components/dashboard/LiveDataBadge'

export default function Dashboard() {
  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Globe />
        <GlobeControls />
        <LiveDataBadge />
      </div>
      <MetricsPanel />
    </div>
  )
}