/**
 * Hook to fetch live global vitals:
 * - NASA GISS: global temperature anomaly
 * - NOAA Mauna Loa: atmospheric CO₂ ppm
 * - World Bank: world GDP, population, renewable %
 *
 * Fetches once on mount, cached for session
 */
import { useState, useEffect } from 'react'
import { fetchWorldVitals } from '../services/realDataService'

let _cached = null  // session-level cache

export function useWorldVitals() {
  const [vitals,  setVitals]  = useState(_cached)
  const [loading, setLoading] = useState(!_cached)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (_cached) return  // Already loaded this session

    fetchWorldVitals()
      .then(v => {
        _cached = v
        setVitals(v)
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  return { vitals, loading, error }
}