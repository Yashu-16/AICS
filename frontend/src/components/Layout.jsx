import React from 'react'
import { Outlet }    from 'react-router-dom'
import { useEffect } from 'react'
import Topbar        from './Topbar'
import Sidebar       from './sidebar/Sidebar'
import ScenarioModal from './modals/ScenarioModal'
import AGICinematic  from './AGICinematic'
import { useAppStore } from '../store/appStore'

export default function Layout() {
  const {
    modalOpen, snapshot, currentYear,
    agiTriggered, setAgiTriggered,
    activeScenario,
  } = useAppStore()

  const [showAGI, setShowAGI] = useEffect ? [false, ()=>{}] : [false, ()=>{}]

  // Detect AGI year crossing
  const [agiShown, setAgiShown] = React.useState(false)

  useEffect(() => {
    const agiYear = activeScenario?.params?.agi_introduction_year || 2055
    if (!agiShown && currentYear >= agiYear && currentYear > 2025) {
      setAgiShown(true)
      setAgiTriggered(true)
    }
  }, [currentYear])

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:'var(--bg-base)' }}>
      <Topbar />
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <Sidebar />
        <main style={{ flex:1, overflow:'hidden', position:'relative' }}>
          <Outlet />
        </main>
      </div>
      {modalOpen === 'scenario' && <ScenarioModal />}
      {agiTriggered && (
        <AGICinematic
          year={currentYear}
          onDismiss={() => setAgiTriggered(false)}
        />
      )}
    </div>
  )
}