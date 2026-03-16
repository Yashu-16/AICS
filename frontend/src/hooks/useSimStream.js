import { useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '../store/appStore'

export function useSimStream() {
  const ws = useRef(null)
  const {
    isPlaying, activeScenario,
    setSnapshot, setCurrentYear, setProgress,
    setSimulationStatus, addEvent,
  } = useAppStore()

  const disconnect = useCallback(() => {
    if (ws.current) { ws.current.close(); ws.current = null }
  }, [])

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return
    disconnect()

    const WS_URL = `ws://localhost:8000/api/v1/simulation/stream`
    ws.current = new WebSocket(WS_URL)

    ws.current.onopen = () => {
      setSimulationStatus('running')
      ws.current.send(JSON.stringify(activeScenario.params))
    }

    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.status === 'complete') {
        setSimulationStatus('complete')
        return
      }
      setSnapshot(data)
      setCurrentYear(Math.floor(data.year))
      const { start_year = 2025, end_year = 2125 } = activeScenario.params
      setProgress(
        Math.min(100, ((data.year - start_year) / (end_year - start_year)) * 100)
      )
      data.events?.forEach((text) =>
        addEvent({
          id: Date.now() + Math.random(),
          text,
          year: `${Math.floor(data.year)}`,
          severity: 'info',
        })
      )
    }

    ws.current.onerror  = () => setSimulationStatus('error')
    ws.current.onclose  = () => setSimulationStatus('idle')
  }, [activeScenario, setSnapshot, setCurrentYear, setProgress,
      setSimulationStatus, addEvent, disconnect])

  useEffect(() => {
    if (isPlaying) connect()
    else disconnect()
    return disconnect
  }, [isPlaying, connect, disconnect])
}