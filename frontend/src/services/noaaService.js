/**
 * NOAA (National Oceanic and Atmospheric Administration) Data
 *
 * 1. Mauna Loa CO₂ — most trusted atmospheric CO₂ record
 *    URL: https://gml.noaa.gov/ccgg/trends/
 *
 * 2. Sea Level data
 *    URL: https://tidesandcurrents.noaa.gov/
 *
 * NOTE: NOAA CSVs may need CORS proxy in browser.
 * The backend proxy (backend/services/noaa.py) handles this server-side.
 */

const NOAA_GML = 'https://gml.noaa.gov/webdata/ccgg/trends/co2'

/**
 * Latest weekly CO₂ reading from Mauna Loa Observatory
 * Returns { ppm, year, month, day, source }
 */
export async function fetchLatestCO2() {
  try {
    const res  = await fetch(`${NOAA_GML}/co2_weekly_mlo.csv`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()

    const lines = text.split('\n')
      .filter(l => !l.startsWith('#') && l.trim())

    // Find last valid reading (some end readings are -999.99)
    let latest = null
    for (let i = lines.length - 1; i >= 0; i--) {
      const parts = lines[i].trim().split(',')
      const ppm   = parseFloat(parts[4])
      if (ppm > 0) {
        latest = {
          year:  parseInt(parts[0]),
          month: parseInt(parts[1]),
          day:   parseInt(parts[2]),
          ppm:   parseFloat(ppm.toFixed(2)),
          source: 'NOAA GML Mauna Loa Observatory',
        }
        break
      }
    }
    return latest ?? { ppm: 422.1, year: 2024, source: 'fallback' }

  } catch (e) {
    console.warn('NOAA CO₂ fetch failed:', e.message)
    return { ppm: 422.1, year: 2024, source: 'fallback' }
  }
}

/**
 * Annual mean CO₂ series from Mauna Loa (1959 → present)
 * Returns [{year, ppm}, ...]
 */
export async function fetchCO2AnnualSeries() {
  try {
    const res  = await fetch(`${NOAA_GML}/co2_annmean_mlo.csv`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()

    return text.split('\n')
      .filter(l => !l.startsWith('#') && l.trim())
      .map(l => {
        const p = l.trim().split(',')
        return { year: parseInt(p[0]), ppm: parseFloat(p[1]) }
      })
      .filter(d => !isNaN(d.year) && !isNaN(d.ppm) && d.ppm > 0)

  } catch (e) {
    console.warn('NOAA annual CO₂ series failed:', e.message)
    // Realistic fallback
    return [
      {year:1960,ppm:316.9},{year:1970,ppm:325.7},{year:1980,ppm:338.7},
      {year:1990,ppm:354.4},{year:2000,ppm:369.5},{year:2005,ppm:379.8},
      {year:2010,ppm:389.9},{year:2015,ppm:400.8},{year:2016,ppm:404.2},
      {year:2018,ppm:408.5},{year:2020,ppm:412.5},{year:2021,ppm:414.7},
      {year:2022,ppm:418.6},{year:2023,ppm:421.1},{year:2024,ppm:422.8},
    ]
  }
}

/**
 * Monthly CO₂ series (more granular — last 5 years)
 * Returns [{year, month, ppm}, ...]
 */
export async function fetchCO2MonthlySeries(yearsBack = 5) {
  try {
    const res  = await fetch(`${NOAA_GML}/co2_mm_mlo.csv`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()

    const currentYear = new Date().getFullYear()
    const cutoff      = currentYear - yearsBack

    return text.split('\n')
      .filter(l => !l.startsWith('#') && l.trim())
      .map(l => {
        const p = l.trim().split(/\s+/)
        return {
          year:  parseInt(p[0]),
          month: parseInt(p[1]),
          ppm:   parseFloat(p[3]),  // interpolated value
        }
      })
      .filter(d => !isNaN(d.ppm) && d.ppm > 0 && d.year >= cutoff)

  } catch (e) {
    console.warn('NOAA monthly CO₂ failed:', e.message)
    return []
  }
}