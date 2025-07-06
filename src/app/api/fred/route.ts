import { NextRequest, NextResponse } from 'next/server'
import { getFREDEconomicData, getFREDTechTrends } from '@/lib/fredAPI'

/**
 * GET /api/fred
 * Fetch economic indicators from FRED API
 *
 * Query Parameters:
 * - analysis: boolean - Include detailed economic analysis (default: false)
 * - series: string - Specific series to fetch (tech|jobs|total|all, default: all)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const includeAnalysis = searchParams.get('analysis') === 'true'
  const seriesType = searchParams.get('series') || 'all'

  console.log('FRED API Endpoint called with params:', {
    includeAnalysis,
    seriesType,
  })

  try {
    if (seriesType === 'tech') {
      // Just tech employment data
      const techData = await getFREDTechTrends()

      return NextResponse.json({
        ok: true,
        data: {
          techEmployment: techData,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'FRED API',
          seriesRequested: 'tech',
        },
      })
    }

    // Get all economic indicators
    const economicData = await getFREDEconomicData()

    const response = {
      ok: true,
      data: {
        fred: {
          techEmployment: {
            current: economicData.techEmployment.current.value,
            date: economicData.techEmployment.current.date,
            trend: economicData.techEmployment.trend.direction,
            change: economicData.techEmployment.trend.percentChange,
            title: economicData.techEmployment.metadata.title,
          },
          jobOpenings: {
            current: economicData.jobOpenings.current.value,
            date: economicData.jobOpenings.current.date,
            trend: economicData.jobOpenings.trend.direction,
            change: economicData.jobOpenings.trend.percentChange,
            title: economicData.jobOpenings.metadata.title,
          },
          totalEmployment: {
            current: economicData.totalEmployment.current.value,
            date: economicData.totalEmployment.current.date,
            trend: economicData.totalEmployment.trend.direction,
            change: economicData.totalEmployment.trend.percentChange,
            title: economicData.totalEmployment.metadata.title,
          },
          healthScore: economicData.healthScore,
        },
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'Federal Reserve Economic Data (FRED)',
        series: [
          'CES6054150001', // Computer Systems Design Employment
          'JTS540099JOL', // Job Openings in Professional Services
          'PAYEMS', // Total Nonfarm Employment
        ],
      },
    }

    // Add detailed analysis if requested
    if (includeAnalysis) {
      return NextResponse.json({
        ...response,
        analysis: {
          techEmployment: economicData.techEmployment,
          jobOpenings: economicData.jobOpenings,
          totalEmployment: economicData.totalEmployment,
          insights: {
            techTrend: `Tech employment is ${economicData.techEmployment.trend.direction} by ${economicData.techEmployment.trend.percentChange?.toFixed(2)}%`,
            jobsTrend: `Job openings are ${economicData.jobOpenings.trend.direction} by ${economicData.jobOpenings.trend.percentChange?.toFixed(2)}%`,
            economicHealth: `Economic health score: ${economicData.healthScore.score}/100 (${economicData.healthScore.description})`,
            factors: economicData.healthScore.factors,
          },
        },
      })
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('FRED API Error:', error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : 'Unknown FRED API error',
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'FRED API',
          apiKey: process.env.FRED_API_KEY ? 'SET' : 'NOT_SET',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/fred
 * Get economic data with custom parameters
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('POST /api/fred called with body:', body)

    const { includeAnalysis = false, seriesIds = [] } = body

    // For now, just return all economic data
    // Future: Could support custom series IDs
    const economicData = await getFREDEconomicData()

    return NextResponse.json({
      ok: true,
      data: {
        fred: economicData,
        requestedSeries: seriesIds,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'FRED API',
        includeAnalysis,
      },
    })
  } catch (error) {
    console.error('FRED POST Error:', error)

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'FRED API',
        },
      },
      { status: 500 }
    )
  }
}
