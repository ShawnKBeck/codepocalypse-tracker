/**
 * Official BLS API v2.0 Integration
 *
 * This module provides access to the Bureau of Labor Statistics API
 * for retrieving official employment statistics for software developers.
 *
 * API Documentation: https://www.bls.gov/developers/api_signature_v2.htm
 */

interface BLSOptions {
  apiKey?: string
  startYear?: number
  endYear?: number
}

interface BLSDataPoint {
  year: string
  period: string
  periodName: string
  value: string
  footnotes?: string[]
  calculations?: unknown
}

interface BLSCurrentData {
  year: string
  period: string
  employment: number
  value: string
  footnotes?: string[]
}

interface BLSHistoricalData {
  year: string
  period: string
  employment: number
  value: string
  calculations?: unknown
}

interface BLSTrend {
  direction: 'up' | 'down' | 'stable'
  latestChange: number | null
}

interface BLSMetadata {
  seriesId: string
  seriesTitle?: string
  source: string
  catalog?: unknown
  lastUpdated: string
  apiStatus: string
  error?: string
}

interface BLSAnalysis {
  trend: string
  avgYearlyChange: number
  volatility: number
  prediction: string
  confidence: 'high' | 'medium' | 'low'
}

export interface BLSEmploymentData {
  current: BLSCurrentData
  historical: BLSHistoricalData[]
  trend: BLSTrend
  metadata: BLSMetadata
  analysis?: BLSAnalysis
}

/**
 * Fetches software developer employment data from the official BLS API
 * @param options - Configuration options
 * @returns Employment data with statistics and trends
 */
export async function getBLSEmploymentData({
  apiKey = process.env.BLS_API_KEY,
  startYear = new Date().getFullYear() - 3,
  endYear = new Date().getFullYear(),
}: BLSOptions = {}): Promise<BLSEmploymentData> {
  if (!apiKey) {
    throw new Error(
      'BLS API key is required. Please set BLS_API_KEY environment variable.'
    )
  }

  // BLS Series ID for Software Developers (SOC 15-1252)
  // This is the official occupation code for Software Developers
  const seriesId = 'OEUS000000015125200000003' // National employment estimate

  const requestData = {
    seriesid: [seriesId],
    startyear: startYear.toString(),
    endyear: endYear.toString(),
    catalog: false,
    calculations: true,
    annualaverage: true,
    registrationkey: apiKey,
  }

  try {
    console.log('Fetching BLS data for Software Developers...')
    console.log(`API Request: ${startYear}-${endYear}, Series: ${seriesId}`)

    const response = await fetch(
      'https://api.bls.gov/publicAPI/v2/timeseries/data/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Codepocalypse-Tracker/1.0',
        },
        body: JSON.stringify(requestData),
      }
    )

    if (!response.ok) {
      throw new Error(
        `BLS API request failed: ${response.status} ${response.statusText}`
      )
    }

    const data = await response.json()

    console.log('BLS API Response Status:', data.status)
    console.log('Full BLS API Response:', JSON.stringify(data, null, 2))

    if (data.status !== 'REQUEST_SUCCEEDED') {
      console.error('BLS API Error:', data.message)
      throw new Error(`BLS API error: ${data.message || 'Unknown error'}`)
    }

    // Process the response data
    const series = data.Results.series[0]
    console.log('Series data:', JSON.stringify(series, null, 2))

    if (!series || !series.data || series.data.length === 0) {
      console.error('No series data found:', {
        hasResults: !!data.Results,
        hasSeries: !!data.Results?.series,
        seriesLength: data.Results?.series?.length,
        hasSeriesData: !!series?.data,
        dataLength: series?.data?.length,
      })
      throw new Error('No employment data found in BLS response')
    }

    // Extract current and historical data
    const latestData: BLSDataPoint = series.data[0] // Most recent data point
    const historicalData: BLSDataPoint[] = series.data

    // Calculate trend
    let trend: 'up' | 'down' | 'stable' = 'stable'
    let latestChange: number | null = null

    if (historicalData.length >= 2) {
      const current = parseFloat(latestData.value)
      const previous = parseFloat(historicalData[1].value)
      const change = ((current - previous) / previous) * 100
      latestChange = change

      if (change > 1) trend = 'up'
      else if (change < -1) trend = 'down'
    }

    // Format the response
    const result: BLSEmploymentData = {
      current: {
        year: latestData.year,
        period: latestData.periodName,
        employment: parseInt(latestData.value) * 1000, // BLS data is in thousands
        value: latestData.value,
        footnotes: latestData.footnotes,
      },
      historical: historicalData.map((item) => ({
        year: item.year,
        period: item.periodName,
        employment: parseInt(item.value) * 1000,
        value: item.value,
        calculations: item.calculations,
      })),
      trend: {
        direction: trend,
        latestChange: latestChange,
      },
      metadata: {
        seriesId: seriesId,
        seriesTitle: series.seriesID,
        source: 'Bureau of Labor Statistics (BLS) API v2.0',
        catalog: series.catalog,
        lastUpdated: new Date().toISOString(),
        apiStatus: data.status,
      },
    }

    console.log('BLS Data processed successfully:')
    console.log(
      `Current Employment: ${result.current.employment.toLocaleString()} (${result.current.year})`
    )
    console.log(`Trend: ${result.trend.direction}`)

    return result
  } catch (error) {
    console.error('BLS API Error:', error)

    // Return fallback data if API fails
    console.log('Falling back to baseline data...')
    return {
      current: {
        year: '2023',
        period: 'Annual',
        employment: 1692100,
        value: '1692.1',
        footnotes: [],
      },
      historical: [
        {
          year: '2023',
          period: 'Annual',
          employment: 1692100,
          value: '1692.1',
        },
      ],
      trend: {
        direction: 'stable',
        latestChange: null,
      },
      metadata: {
        seriesId: seriesId,
        source: 'BLS Fallback Data (2023 Official Statistics)',
        lastUpdated: new Date().toISOString(),
        apiStatus: 'FALLBACK_USED',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}

/**
 * Get software developer employment trend analysis
 * @param options - Configuration options
 * @returns Trend analysis data
 */
export async function getBLSTrendAnalysis(
  options: BLSOptions = {}
): Promise<BLSEmploymentData> {
  const data = await getBLSEmploymentData(options)

  // Calculate detailed trend metrics
  const historical = data.historical
  if (historical.length < 2) {
    return {
      ...data,
      analysis: {
        trend: 'insufficient_data',
        avgYearlyChange: 0,
        volatility: 0,
        prediction: 'Cannot predict with limited data',
        confidence: 'low',
      },
    }
  }

  // Calculate year-over-year changes
  const changes: number[] = []
  for (let i = 0; i < historical.length - 1; i++) {
    const current = historical[i].employment
    const previous = historical[i + 1].employment
    const change = ((current - previous) / previous) * 100
    changes.push(change)
  }

  const avgChange =
    changes.reduce((sum, change) => sum + change, 0) / changes.length
  const volatility = Math.sqrt(
    changes.reduce((sum, change) => sum + Math.pow(change - avgChange, 2), 0) /
      changes.length
  )

  let prediction = 'stable'
  if (avgChange > 2) prediction = 'growing'
  else if (avgChange < -2) prediction = 'declining'

  return {
    ...data,
    analysis: {
      trend: prediction,
      avgYearlyChange: avgChange,
      volatility: volatility,
      prediction: `Based on ${historical.length} years of data, software developer employment is ${prediction}`,
      confidence: volatility < 5 ? 'high' : volatility < 10 ? 'medium' : 'low',
    },
  }
}
