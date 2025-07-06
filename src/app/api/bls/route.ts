import { NextResponse } from 'next/server'
import { getBLSEmploymentData, getBLSTrendAnalysis } from '@/lib/blsAPI'

/**
 * Official BLS API Endpoint
 *
 * This endpoint provides access to official Bureau of Labor Statistics
 * employment data for software developers through the BLS API v2.0
 *
 * Usage:
 * GET /api/bls - Get current employment data
 * GET /api/bls?analysis=true - Get employment data with trend analysis
 * GET /api/bls?startYear=2020&endYear=2024 - Get historical data range
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const includeAnalysis = searchParams.get('analysis') === 'true'
    const startYear = searchParams.get('startYear')
      ? parseInt(searchParams.get('startYear')!)
      : undefined
    const endYear = searchParams.get('endYear')
      ? parseInt(searchParams.get('endYear')!)
      : undefined

    console.log('BLS API Endpoint called with params:', {
      includeAnalysis,
      startYear,
      endYear,
    })

    // Fetch data from BLS API
    let data
    if (includeAnalysis) {
      data = await getBLSTrendAnalysis({ startYear, endYear })
    } else {
      data = await getBLSEmploymentData({ startYear, endYear })
    }

    // Format response for consistency with existing system
    const response = {
      ok: true,
      data: {
        bls: {
          year: data.current.year,
          count: data.current.employment,
          source: data.metadata.source,
          note: `Official BLS employment statistics via API v2.0`,
          period: data.current.period,
          apiStatus: data.metadata.apiStatus,
          seriesId: data.metadata.seriesId,
        },
        historical: data.historical,
        trend: data.trend,
        ...(data.analysis && { analysis: data.analysis }),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'BLS API v2.0',
        seriesId: data.metadata.seriesId,
        dataPoints: data.historical.length,
        apiStatus: data.metadata.apiStatus,
      },
    }

    // Add debug information in development
    if (process.env.NODE_ENV === 'development') {
      ;(response as Record<string, unknown>).debug = {
        apiKey: process.env.BLS_API_KEY ? 'SET' : 'MISSING',
        requestParams: { includeAnalysis, startYear, endYear },
        rawMetadata: data.metadata,
      }
    }

    console.log(
      `BLS API Success: ${data.current.employment.toLocaleString()} software developers (${data.current.year})`
    )

    return NextResponse.json(response)
  } catch (error) {
    console.error('BLS API Endpoint Error:', error)

    // Return error response with fallback data
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {
          bls: {
            year: '2023',
            count: 1692100,
            source: 'BLS Fallback Data',
            note: 'Using baseline employment statistics due to API error',
            apiStatus: 'ERROR',
          },
        },
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'Fallback Data',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { startYear, endYear, includeAnalysis = false } = body

    console.log('BLS API POST request:', {
      startYear,
      endYear,
      includeAnalysis,
    })

    // Fetch data with custom parameters
    let data
    if (includeAnalysis) {
      data = await getBLSTrendAnalysis({ startYear, endYear })
    } else {
      data = await getBLSEmploymentData({ startYear, endYear })
    }

    return NextResponse.json({
      ok: true,
      data: {
        bls: {
          year: data.current.year,
          count: data.current.employment,
          source: data.metadata.source,
          note: `Official BLS employment statistics via API v2.0 (POST request)`,
          period: data.current.period,
          apiStatus: data.metadata.apiStatus,
        },
        historical: data.historical,
        trend: data.trend,
        ...(data.analysis && { analysis: data.analysis }),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'BLS API v2.0',
        method: 'POST',
        dataPoints: data.historical.length,
      },
    })
  } catch (error) {
    console.error('BLS API POST Error:', error)

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date().toISOString(),
          method: 'POST',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    )
  }
}
