import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Layout        from './components/Layout'
import Dashboard     from './pages/Dashboard'
import Economy       from './pages/Economy'
import Climate       from './pages/Climate'
import Technology    from './pages/Technology'
import Geopolitics   from './pages/Geopolitics'
import Population    from './pages/Population'
import Scenarios     from './pages/Scenarios'
import Reports       from './pages/Reports'
import CountryProfile from './pages/CountryProfile'
import Compare       from './pages/Compare'
import Loader        from './components/ui/Loader'
import { useAppStore } from './store/appStore'

export default function App() {
  const { initialized, setInitialized } = useAppStore()

  useEffect(() => {
    const t = setTimeout(() => setInitialized(true), 2600)
    return () => clearTimeout(t)
  }, [setInitialized])

  if (!initialized) return <Loader />

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"   element={<Dashboard />} />
        <Route path="economy"     element={<Economy />} />
        <Route path="climate"     element={<Climate />} />
        <Route path="technology"  element={<Technology />} />
        <Route path="geopolitics" element={<Geopolitics />} />
        <Route path="population"  element={<Population />} />
        <Route path="scenarios"   element={<Scenarios />} />
        <Route path="reports"     element={<Reports />} />
        <Route path="country"     element={<CountryProfile />} />
        <Route path="compare"     element={<Compare />} />
      </Route>
    </Routes>
  )
}