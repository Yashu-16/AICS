/**
 * AICS Real Data Service
 * Aggregates World Bank + NASA + NOAA into unified data objects
 * Used by hooks and components
 */

import {
  getLatest,
  getCountryProfile,
  getWorldLatest,
  WB_CODES,
  IND,
} from './worldBankService'

import { fetchLatestTempAnomaly }  from './nasaService'
import { fetchLatestCO2 }          from './noaaService'

/**
 * Fetch complete real-world data for one country by name
 * Falls back gracefully if any source is unavailable
 *
 * @param {string} countryName - e.g. "Germany", "United States of America"
 * @returns {object|null} normalized country data or null
 */
export async function fetchCountryData(countryName) {
  const code = WB_CODES[countryName]
  if (!code) {
    console.warn(`No WB code for country: ${countryName}`)
    return null
  }

  const profile = await getCountryProfile(code)
  if (!Object.keys(profile).length) return null

  const gdpRaw    = profile.gdp?.value
  const popRaw    = profile.population?.value
  const co2Raw    = profile.co2_kt?.value
  const gdpPercap = profile.gdp_percap?.value

  return {
    // Economy
    gdp:              gdpRaw     ? parseFloat((gdpRaw / 1e12).toFixed(3))    : null,  // $T
    gdp_percap:       gdpPercap  ? Math.round(gdpPercap)                      : null,
    gdp_growth:       profile.gdp_growth?.value   ?? null,
    inflation:        profile.inflation?.value    != null
                        ? profile.inflation.value / 100 : null,

    // Population
    population:       popRaw     ? parseFloat((popRaw / 1e6).toFixed(1))     : null,  // millions

    // Environment
    co2_kt:           co2Raw     ?? null,
    carbon_emissions: co2Raw     ? parseFloat((co2Raw / 1e6).toFixed(3))     : null,  // GT
    renewable_share:  profile.renewable?.value != null
                        ? profile.renewable.value / 100 : null,

    // Society
    unemployment:     profile.unemployment?.value != null
                        ? profile.unemployment.value / 100 : null,
    life_expectancy:  profile.life_exp?.value     ?? null,
    internet:         profile.internet?.value     ?? null,
    gini:             profile.gini?.value         ?? null,
    urban_pop:        profile.urban_pop?.value    ?? null,
    electricity:      profile.electricity?.value  ?? null,

    // Derived indices (calculated from real data)
    tech_index: gdpPercap
      ? parseFloat(Math.min(0.98, gdpPercap / 85000).toFixed(3))
      : null,
    stability: profile.unemployment?.value != null
      ? parseFloat(Math.max(0.1, Math.min(0.95,
          1 - (profile.unemployment.value / 100) * 2
        )).toFixed(3))
      : null,

    // Metadata
    _live:    true,
    _year:    profile.gdp?.year ?? new Date().getFullYear() - 1,
    _source:  'World Bank Open Data',
    _code:    code,
  }
}

/**
 * Fetch all world-level vitals in parallel
 * NASA GISS temperature + NOAA CO₂ + World Bank GDP/population
 */
export async function fetchWorldVitals() {
  const [tempData, co2Data, gdpData, popData, renewData] = await Promise.allSettled([
    fetchLatestTempAnomaly(),                    // NASA GISS
    fetchLatestCO2(),                            // NOAA Mauna Loa
    getWorldLatest(IND.GDP),                     // World Bank
    getWorldLatest(IND.POPULATION),              // World Bank
    getWorldLatest(IND.RENEWABLE),               // World Bank
  ])

  const safe = (r, key) =>
    r.status === 'fulfilled' && r.value ? r.value[key] ?? null : null

  return {
    temp_anomaly:  tempData.status === 'fulfilled' ? tempData.value?.anomaly ?? 1.29 : 1.29,
    co2_ppm:       co2Data.status  === 'fulfilled' ? co2Data.value?.ppm     ?? 422  : 422,
    world_gdp_t:   safe(gdpData,  'value') ? safe(gdpData,  'value') / 1e12 : 105,
    world_pop_b:   safe(popData,  'value') ? safe(popData,  'value') / 1e9  : 8.1,
    renewable_pct: safe(renewData,'value') ?? 29,

    sources: {
      temperature: tempData.status === 'fulfilled' ? 'NASA GISS GISTEMP v4'       : 'fallback',
      co2:         co2Data.status  === 'fulfilled' ? 'NOAA GML Mauna Loa'         : 'fallback',
      economy:     gdpData.status  === 'fulfilled' ? 'World Bank Open Data'        : 'fallback',
    },
    _fetched_at: new Date().toISOString(),
  }
}