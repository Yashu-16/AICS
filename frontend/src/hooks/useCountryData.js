/**
 * Hook to fetch real World Bank data for a specific country
 * Caches results in component state — won't re-fetch on re-renders
 */
import { useState, useEffect, useRef } from 'react'
import { fetchCountryData } from '../services/realDataService'

// Module-level cache so re-opening same country is instant
const _moduleCache = new Map()

export function useCountryData(countryName) {
  const [data,    setData]    = useState(() => _moduleCache.get(countryName) ?? null)
  const [loading, setLoading] = useState(!_moduleCache.has(countryName))
  const [error,   setError]   = useState(null)
  const activeRef = useRef(null)

  useEffect(() => {
    if (!countryName) return
    // Already cached
    if (_moduleCache.has(countryName)) {
      setData(_moduleCache.get(countryName))
      setLoading(false)
      return
    }

    const token = Symbol()
    activeRef.current = token
    setLoading(true)
    setData(null)
    setError(null)

    fetchCountryData(countryName)
      .then(d => {
        if (activeRef.current !== token) return  // stale
        if (d) _moduleCache.set(countryName, d)
        setData(d)
        setLoading(false)
      })
      .catch(e => {
        if (activeRef.current !== token) return
        setError(e.message)
        setLoading(false)
      })

    return () => { activeRef.current = null }
  }, [countryName])

  return { data, loading, error }
}