/**
 * NASA Data Services
 *
 * 1. NASA GISS GISTEMP — Global Surface Temperature Analysis
 *    URL: https://data.giss.nasa.gov/gistemp/
 *    Data: Annual global temperature anomaly since 1880
 *
 * 2. NASA POWER API — Meteorology per location
 *    URL: https://power.larc.nasa.gov/
 *    Data: Temperature, solar, wind per lat/lon
 *
 * NOTE: GISS CSV may fail CORS in browser — backend proxy recommended
 * for production. Direct fetch works in development with a CORS proxy.
 */

const CORS_PROXY = ''  // Set to 'https://corsproxy.io/?' if CORS fails

/**
 * Global temperature anomaly series from NASA GISS GISTEMP v4
 * Returns [{year, anomaly}, ...] from 1880 to present
 */
export async function fetchTempAnomalySeries() {
  const url = `${CORS_PROXY}https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv`
  try {
    const res  = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()

    return text.split('\n')
      .filter(l => /^\d{4}/.test(l.trim()))
      .map(line => {
        const parts   = line.trim().split(',')
        const year    = parseInt(parts[0])
        const annMean = parseFloat(parts[13])  // J-D column = annual mean
        return { year, anomaly: isNaN(annMean) ? null : annMean }
      })
      .filter(d => d.anomaly !== null)

  } catch (e) {
    console.warn('NASA GISS fetch failed:', e.message)
    // Return realistic fallback data 1980-2024
    return [
      {year:1980,anomaly:0.26},{year:1985,anomaly:0.12},{year:1990,anomaly:0.44},
      {year:1995,anomaly:0.38},{year:2000,anomaly:0.42},{year:2005,anomaly:0.68},
      {year:2010,anomaly:0.72},{year:2015,anomaly:0.87},{year:2016,anomaly:1.01},
      {year:2017,anomaly:0.92},{year:2018,anomaly:0.83},{year:2019,anomaly:0.98},
      {year:2020,anomaly:1.02},{year:2021,anomaly:0.85},{year:2022,anomaly:0.89},
      {year:2023,anomaly:1.17},{year:2024,anomaly:1.29},
    ]
  }
}

/**
 * Latest global temperature anomaly (most recent year)
 */
export async function fetchLatestTempAnomaly() {
  const series = await fetchTempAnomalySeries()
  return series.at(-1) ?? { year: 2024, anomaly: 1.29, source: 'fallback' }
}

/**
 * NASA POWER API — climate data for a specific location
 * Used for country-level temperature/solar data
 *
 * @param {number} lat  - latitude
 * @param {number} lon  - longitude
 * @param {number} year - year (2000-present)
 */
export async function fetchLocationClimate(lat, lon, year = 2023) {
  const url = [
    'https://power.larc.nasa.gov/api/temporal/climatology/point',
    `?parameters=T2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN`,
    `&community=RE`,
    `&longitude=${lon}`,
    `&latitude=${lat}`,
    `&format=JSON`,
    `&start=${year}`,
    `&end=${year}`,
  ].join('')

  try {
    const res  = await fetch(url, { signal: AbortSignal.timeout(12000) })
    const json = await res.json()
    const params = json?.properties?.parameter

    if (!params) return null

    const T2M    = params.T2M    // Temperature 2m above surface
    const PREC   = params.PRECTOTCORR  // Precipitation
    const SOLAR  = params.ALLSKY_SFC_SW_DWN  // Solar radiation

    // Annual mean from monthly values
    const annualMean = (obj) => {
      const vals = Object.values(obj || {}).slice(0, 12).filter(v => v > -900)
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
    }

    return {
      temp_celsius:    T2M    ? parseFloat(annualMean(T2M)?.toFixed(1))   : null,
      precip_mm_day:   PREC   ? parseFloat(annualMean(PREC)?.toFixed(2))  : null,
      solar_kwh_m2:    SOLAR  ? parseFloat(annualMean(SOLAR)?.toFixed(2)) : null,
      year,
      source: 'NASA POWER API',
    }
  } catch (e) {
    console.warn('NASA POWER fetch failed:', e.message)
    return null
  }
}

/**
 * Country capital coordinates for NASA POWER lookups
 */
export const CAPITAL_COORDS = {
  'United States': { lat: 38.9,  lon: -77.0  },
  'China':         { lat: 39.9,  lon: 116.4  },
  'India':         { lat: 28.6,  lon: 77.2   },
  'Germany':       { lat: 52.5,  lon: 13.4   },
  'Japan':         { lat: 35.7,  lon: 139.7  },
  'Brazil':        { lat: -15.8, lon: -47.9  },
  'Russia':        { lat: 55.8,  lon: 37.6   },
  'United Kingdom':{ lat: 51.5,  lon: -0.1   },
  'France':        { lat: 48.9,  lon: 2.3    },
  'Australia':     { lat: -35.3, lon: 149.1  },
  'Canada':        { lat: 45.4,  lon: -75.7  },
  'South Korea':   { lat: 37.6,  lon: 127.0  },
  'Indonesia':     { lat: -6.2,  lon: 106.8  },
  'Saudi Arabia':  { lat: 24.7,  lon: 46.7   },
  'South Africa':  { lat: -25.7, lon: 28.2   },
  'Nigeria':       { lat: 9.1,   lon: 7.5    },
  'Kenya':         { lat: -1.3,  lon: 36.8   },
  'Egypt':         { lat: 30.1,  lon: 31.2   },
  'Turkey':        { lat: 39.9,  lon: 32.9   },
  'Argentina':     { lat: -34.6, lon: -58.4  },
}