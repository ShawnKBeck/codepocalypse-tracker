import fetch from 'node-fetch'

interface FREDSeries {
  id: string
  title: string
  frequency: string
  units: string
  seasonal_adjustment: string
  last_updated: string
}

interface FREDObservation {
  date: string
  value: string
}

interface FREDResponse {
  realtime_start: string
  realtime_end: string
  seriess?: FREDSeries[]
  observations?: FREDObservation[]
  count: number
  offset: number
  limit: number
}

interface TechEmploymentData {
  current: {
    value: number
    date: string
    period: string
  }
  historical: Array<{
    date: string
    value: number
    formattedValue: string
  }>
  trend: {
    direction: 'up' | 'down' | 'stable'
    monthlyChange?: number
    percentChange?: number
  }
  metadata: {
    seriesId: string
    title: string
    source: string
    lastUpdated: string
    frequency: string
    units: string
  }
}

interface EconomicIndicators {
  techEmployment: TechEmploymentData
  jobOpenings: TechEmploymentData
  totalEmployment: TechEmploymentData
  healthScore: {
    score: number // 0-100
    description: string
    factors: string[]
  }
}

/**
 * Get FRED API data for a specific series
 */
async function getFREDSeries(
  seriesId: string,
  limit: number = 12,
  targetDate?: string // Optional date in YYYY-MM-DD format
): Promise<{ series: FREDSeries; observations: FREDObservation[] }> {
  const apiKey = process.env.FRED_API_KEY
  if (!apiKey) {
    throw new Error('FRED_API_KEY is not configured')
  }

  // Get series metadata
  const seriesUrl = `https://api.stlouisfed.org/fred/series?series_id=${seriesId}&api_key=${apiKey}&file_type=json`
  const seriesResponse = await fetch(seriesUrl)

  if (!seriesResponse.ok) {
    throw new Error(
      `FRED API error: ${seriesResponse.status} ${seriesResponse.statusText}`
    )
  }

  const seriesData = (await seriesResponse.json()) as FREDResponse

  if (!seriesData.seriess || seriesData.seriess.length === 0) {
    throw new Error(`No series found for ID: ${seriesId}`)
  }

  // Build observations URL with optional date parameters
  let obsUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&limit=${limit}`

  if (targetDate) {
    // Get data for specific month - set both start and end to the same month
    const date = new Date(targetDate)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const startDate = `${year}-${month}-01`
    const endDate = `${year}-${month}-31`

    obsUrl += `&observation_start=${startDate}&observation_end=${endDate}&sort_order=desc`
    console.log(`📅 Fetching FRED data for ${year}-${month}`)
  } else {
    // Get most recent data
    obsUrl += `&sort_order=desc`
    console.log(`📅 Fetching most recent FRED data`)
  }

  const obsResponse = await fetch(obsUrl)

  if (!obsResponse.ok) {
    throw new Error(
      `FRED observations error: ${obsResponse.status} ${obsResponse.statusText}`
    )
  }

  const obsData = (await obsResponse.json()) as FREDResponse

  if (!obsData.observations) {
    throw new Error(`No observations found for series: ${seriesId}`)
  }

  return {
    series: seriesData.seriess[0],
    observations: obsData.observations.filter((obs) => obs.value !== '.'),
  }
}

/**
 * Process FRED data into our format
 */
function processFREDData(
  series: FREDSeries,
  observations: FREDObservation[]
): TechEmploymentData {
  // Sort observations by date (most recent first)
  const sortedObs = observations
    .filter((obs) => obs.value !== '.')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (sortedObs.length === 0) {
    throw new Error('No valid observations found')
  }

  const current = sortedObs[0]
  const previous = sortedObs[1]

  const currentValue = parseFloat(current.value)
  const previousValue = previous ? parseFloat(previous.value) : currentValue

  // Calculate trend
  const monthlyChange = currentValue - previousValue
  const percentChange =
    previousValue > 0 ? (monthlyChange / previousValue) * 100 : 0

  let direction: 'up' | 'down' | 'stable' = 'stable'
  if (Math.abs(percentChange) > 0.1) {
    // 0.1% threshold
    direction = monthlyChange > 0 ? 'up' : 'down'
  }

  return {
    current: {
      value: currentValue,
      date: current.date,
      period: 'Monthly',
    },
    historical: sortedObs.slice(0, 12).map((obs) => ({
      date: obs.date,
      value: parseFloat(obs.value),
      formattedValue: parseFloat(obs.value).toLocaleString(),
    })),
    trend: {
      direction,
      monthlyChange,
      percentChange,
    },
    metadata: {
      seriesId: series.id,
      title: series.title,
      source: 'Federal Reserve Economic Data (FRED)',
      lastUpdated: series.last_updated,
      frequency: series.frequency,
      units: series.units,
    },
  }
}

/**
 * Calculate economic health score
 */
function calculateHealthScore(
  techEmployment: TechEmploymentData,
  jobOpenings: TechEmploymentData,
  totalEmployment: TechEmploymentData
): { score: number; description: string; factors: string[] } {
  let score = 50 // Base score
  const factors: string[] = []

  // Tech employment trend (40% weight)
  if (techEmployment.trend.direction === 'up') {
    score += 20
    factors.push(
      `✅ Tech employment rising (+${techEmployment.trend.percentChange?.toFixed(1)}%)`
    )
  } else if (techEmployment.trend.direction === 'down') {
    score -= 20
    factors.push(
      `⚠️ Tech employment declining (${techEmployment.trend.percentChange?.toFixed(1)}%)`
    )
  } else {
    factors.push(`📊 Tech employment stable`)
  }

  // Job openings trend (30% weight)
  if (jobOpenings.trend.direction === 'up') {
    score += 15
    factors.push(
      `✅ Job openings increasing (+${jobOpenings.trend.percentChange?.toFixed(1)}%)`
    )
  } else if (jobOpenings.trend.direction === 'down') {
    score -= 15
    factors.push(
      `⚠️ Job openings decreasing (${jobOpenings.trend.percentChange?.toFixed(1)}%)`
    )
  } else {
    factors.push(`📊 Job openings stable`)
  }

  // Total employment trend (30% weight)
  if (totalEmployment.trend.direction === 'up') {
    score += 15
    factors.push(
      `✅ Overall economy growing (+${totalEmployment.trend.percentChange?.toFixed(1)}%)`
    )
  } else if (totalEmployment.trend.direction === 'down') {
    score -= 15
    factors.push(
      `⚠️ Overall economy contracting (${totalEmployment.trend.percentChange?.toFixed(1)}%)`
    )
  } else {
    factors.push(`📊 Overall economy stable`)
  }

  // Clamp score between 0-100
  score = Math.max(0, Math.min(100, score))

  let description = 'Fair'
  if (score >= 80) description = 'Excellent'
  else if (score >= 70) description = 'Good'
  else if (score >= 50) description = 'Fair'
  else if (score >= 30) description = 'Poor'
  else description = 'Critical'

  return { score, description, factors }
}

/**
 * Get comprehensive economic indicators from FRED API
 */
export async function getFREDEconomicData(
  targetDate?: string
): Promise<EconomicIndicators> {
  console.log('Fetching FRED economic indicators...')

  try {
    // Fetch data for all three series in parallel
    const [techEmpData, jobOpeningsData, totalEmpData] = await Promise.all([
      getFREDSeries('CES6054150001', 12, targetDate), // Computer Systems Design Employment (Monthly)
      getFREDSeries('JTS540099JOL', 12, targetDate), // Job Openings in Professional Services (Monthly)
      getFREDSeries('PAYEMS', 12, targetDate), // Total Nonfarm Employment (Monthly)
    ])

    // Process each dataset
    const techEmployment = processFREDData(
      techEmpData.series,
      techEmpData.observations
    )
    const jobOpenings = processFREDData(
      jobOpeningsData.series,
      jobOpeningsData.observations
    )
    const totalEmployment = processFREDData(
      totalEmpData.series,
      totalEmpData.observations
    )

    // Calculate health score
    const healthScore = calculateHealthScore(
      techEmployment,
      jobOpenings,
      totalEmployment
    )

    console.log(`FRED Data Success:`)
    console.log(
      `- Tech Employment: ${techEmployment.current.value.toLocaleString()} (${techEmployment.trend.direction})`
    )
    console.log(
      `- Job Openings: ${jobOpenings.current.value.toLocaleString()} (${jobOpenings.trend.direction})`
    )
    console.log(
      `- Economic Health: ${healthScore.score}/100 (${healthScore.description})`
    )

    return {
      techEmployment,
      jobOpenings,
      totalEmployment,
      healthScore,
    }
  } catch (error) {
    console.error('FRED API Error:', error)
    throw new Error(`Failed to fetch FRED economic data: ${error}`)
  }
}

/**
 * Get tech employment trend analysis
 */
export async function getFREDTechTrends(): Promise<TechEmploymentData> {
  const data = await getFREDEconomicData()
  return data.techEmployment
}

export type { EconomicIndicators, TechEmploymentData }
