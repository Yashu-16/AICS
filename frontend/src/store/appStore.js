import { create } from 'zustand'

export const useAppStore = create((set) => ({
  // Boot
  initialized: false,
  setInitialized: (v) => set({ initialized: v }),

  // Simulation
  simulationId:     null,
  simulationStatus: 'idle',
  currentYear:      2025,
  progress:         0,
  isPlaying:        false,
  simSpeed:         1,
  setSimulationId:     (id) => set({ simulationId: id }),
  setSimulationStatus: (s)  => set({ simulationStatus: s }),
  setCurrentYear:      (y)  => set({ currentYear: y }),
  setProgress:         (p)  => set({ progress: p }),
  togglePlay:          ()   => set((s) => ({ isPlaying: !s.isPlaying })),
  setSimSpeed:         (v)  => set({ simSpeed: Math.max(0.5, Math.min(8, v)) }),

  // Latest snapshot
  snapshot: {
    year: 2025, world_gdp: 108.0, population: 8100,
    temp_anomaly: 1.2, automation_index: 0.18,
    geopolitical_stability: 0.65, tech_progress_index: 0.55,
    renewable_share: 0.30, unemployment_rate: 0.055,
    gini_coefficient: 0.42, co2_ppm: 422,
    sea_level_rise_cm: 22, events: [], country_data: {},
  },
  snapshotHistory: [],
  setSnapshot: (snap) =>
    set((s) => ({
      snapshot: snap,
      snapshotHistory: [...s.snapshotHistory.slice(-399), snap],
    })),

  // Active scenario
  activeScenario: {
    id: 'baseline', name: 'Baseline',
    params: {
      start_year: 2025, end_year: 2125,
      agi_introduction_year: 2055,
      global_automation_rate: 0.25,
      carbon_tax_per_tonne: 0,
      renewable_energy_target: 0.35,
      geopolitical_tension: 'medium',
      scenario_name: 'Baseline',
    },
  },
  setActiveScenario: (sc) => set({ activeScenario: sc }),

  // Globe
  globeMode: 'gdp',
  setGlobeMode: (m) => set({ globeMode: m }),

  // UI
  sidebarCollapsed: false,
  toggleSidebar:    ()     => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  activeModal:      null,
  openModal:        (name) => set({ activeModal: name }),
  closeModal:       ()     => set({ activeModal: null }),

  // Events feed
  events: [
    { id: 1, text: 'SE Asian coastal flooding displaces 12M people', year: '2031', severity: 'danger' },
    { id: 2, text: 'EU passes Universal Basic Income legislation',    year: '2031', severity: 'warn' },
    { id: 3, text: 'Renewables surpass fossil fuels globally',        year: '2030', severity: 'ok' },
  ],
  addEvent: (ev) => set((s) => ({ events: [ev, ...s.events].slice(0, 60) })),

  // Butterfly effect
injectedEvents:    [],
addInjectedEvent:  (ev) => set((s) => ({ injectedEvents: [...s.injectedEvents, ev] })),
clearRipples:      ()   => set({ injectedEvents: [] }),

// AGI cinematic flag
agiTriggered:      false,
setAgiTriggered:   (v)  => set({ agiTriggered: v }),

// Timeline scrubber
scrubYear:         null,
setScrubYear:      (y)  => set({ scrubYear: y }),

}))