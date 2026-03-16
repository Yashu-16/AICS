import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: `${BASE}/api/v1`,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.detail || err.message || 'Unknown error'
    console.error('[AICS API]', msg)
    return Promise.reject(new Error(msg))
  }
)

export const simulationAPI = {
  run:     (params) => api.post('/simulation/run', params),
  status:  (id)     => api.get(`/simulation/status/${id}`),
  results: (id)     => api.get(`/simulation/results/${id}`),
  cancel:  (id)     => api.delete(`/simulation/cancel/${id}`),
}

export const scenarioAPI = {
  list:   ()        => api.get('/scenarios/list'),
  get:    (id)      => api.get(`/scenarios/${id}`),
  create: (payload) => api.post('/scenarios/create', payload),
}

export const insightAPI = {
  ai: (payload) => api.post('/insights/ai', payload),
}