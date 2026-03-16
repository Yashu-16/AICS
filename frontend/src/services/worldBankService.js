/**
 * World Bank Open Data API
 * No API key required
 * Docs: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
 */

const BASE = 'https://api.worldbank.org/v2'
const CACHE = new Map()
const TTL   = 15 * 60 * 1000  // 15 min

async function get(path) {
  if (CACHE.has(path)) {
    const { data, ts } = CACHE.get(path)
    if (Date.now() - ts < TTL) return data
  }
  try {
    const res  = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(8000) })
    const json = await res.json()
    CACHE.set(path, { data: json, ts: Date.now() })
    return json
  } catch (e) {
    console.warn('WorldBank fetch failed:', path, e.message)
    return null
  }
}

// All indicator codes
export const IND = {
  GDP:          'NY.GDP.MKTP.CD',
  GDP_PERCAP:   'NY.GDP.PCAP.CD',
  GDP_GROWTH:   'NY.GDP.MKTP.KD.ZG',
  POPULATION:   'SP.POP.TOTL',
  UNEMPLOYMENT: 'SL.UEM.TOTL.ZS',
  CO2:          'EN.ATM.CO2E.KT',
  RENEWABLE:    'EG.FEC.RNEW.ZS',
  LIFE_EXP:     'SP.DYN.LE00.IN',
  INFLATION:    'FP.CPI.TOTL.ZG',
  INTERNET:     'IT.NET.USER.ZS',
  MILITARY:     'MS.MIL.XPND.GD.ZS',
  GINI:         'SI.POV.GINI',
  URBAN_POP:    'SP.URB.TOTL.IN.ZS',
  FOREST:       'AG.LND.FRST.ZS',
  ELECTRICITY:  'EG.ELC.ACCS.ZS',
}

// Country name → World Bank ISO2 code
export const WB_CODES = {
  'United States of America': 'US',
  'United States':  'US', 'China':        'CN', 'India':      'IN',
  'Japan':          'JP', 'United Kingdom':'GB', 'Brazil':     'BR',
  'Russia':         'RU', 'Canada':        'CA', 'Australia':  'AU',
  'South Korea':    'KR', 'Mexico':        'MX', 'Indonesia':  'ID',
  'Nigeria':        'NG', 'South Africa':  'ZA', 'Germany':    'DE',
  'France':         'FR', 'Italy':         'IT', 'Saudi Arabia':'SA',
  'Argentina':      'AR', 'Pakistan':      'PK', 'Bangladesh': 'BD',
  'Ethiopia':       'ET', 'Egypt':         'EG', 'Turkey':     'TR',
  'Iran':           'IR', 'Thailand':      'TH', 'Spain':      'ES',
  'Poland':         'PL', 'Ukraine':       'UA', 'Colombia':   'CO',
  'Kenya':          'KE', 'Vietnam':       'VN', 'Malaysia':   'MY',
  'Philippines':    'PH', 'Myanmar':       'MM', 'Peru':       'PE',
  'Venezuela':      'VE', 'Chile':         'CL', 'Romania':    'RO',
  'Netherlands':    'NL', 'Belgium':       'BE', 'Sweden':     'SE',
  'Norway':         'NO', 'Finland':       'FI', 'Denmark':    'DK',
  'Switzerland':    'CH', 'Austria':       'AT', 'Greece':     'GR',
  'Portugal':       'PT', 'Israel':        'IL', 'United Arab Emirates': 'AE',
  'Iraq':           'IQ', 'Morocco':       'MA', 'Algeria':    'DZ',
  'Tanzania':       'TZ', 'Ghana':         'GH', 'Angola':     'AO',
  'New Zealand':    'NZ', 'Singapore':     'SG', 'Kazakhstan': 'KZ',
}

/**
 * Get latest value for one indicator + one country
 * Returns { value, year } or null
 */
export async function getLatest(countryCode, indicator) {
  const data = await get(
    `/country/${countryCode}/indicator/${indicator}?format=json&mrv=5&per_page=10`
  )
  if (!data?.[1]) return null
  const row = data[1].find(d => d.value !== null)
  return row ? { value: row.value, year: parseInt(row.date) } : null
}

/**
 * Get time series for one indicator + one country
 * Returns [{year, value}, ...]
 */
export async function getSeries(countryCode, indicator, years = 30) {
  const data = await get(
    `/country/${countryCode}/indicator/${indicator}?format=json&mrv=${years}&per_page=${years}`
  )
  if (!data?.[1]) return []
  return data[1]
    .filter(d => d.value !== null)
    .map(d => ({ year: parseInt(d.date), value: d.value }))
    .sort((a, b) => a.year - b.year)
}

/**
 * Get ALL key indicators for one country in parallel
 * Returns { gdp: {value,year}, population: {value,year}, ... }
 */
export async function getCountryProfile(countryCode) {
  const indicatorMap = {
    gdp:          IND.GDP,
    gdp_percap:   IND.GDP_PERCAP,
    gdp_growth:   IND.GDP_GROWTH,
    population:   IND.POPULATION,
    unemployment: IND.UNEMPLOYMENT,
    co2_kt:       IND.CO2,
    renewable:    IND.RENEWABLE,
    life_exp:     IND.LIFE_EXP,
    inflation:    IND.INFLATION,
    internet:     IND.INTERNET,
    gini:         IND.GINI,
    urban_pop:    IND.URBAN_POP,
    electricity:  IND.ELECTRICITY,
  }

  const entries  = Object.entries(indicatorMap)
  const results  = await Promise.allSettled(
    entries.map(([, ind]) => getLatest(countryCode, ind))
  )

  const profile = {}
  entries.forEach(([key], i) => {
    const r = results[i]
    if (r.status === 'fulfilled' && r.value) {
      profile[key] = r.value
    }
  })
  return profile
}

/**
 * World aggregate series (use country code 'WLD')
 */
export async function getWorldSeries(indicator, years = 40) {
  return getSeries('WLD', indicator, years)
}

/**
 * World latest value
 */
export async function getWorldLatest(indicator) {
  return getLatest('WLD', indicator)
}