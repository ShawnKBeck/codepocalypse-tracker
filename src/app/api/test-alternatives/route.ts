import { NextResponse } from 'next/server'
import { getAlternativeJobsData } from '@/lib/alternativeSources'
import { addDataPoint, getTrendingData } from '@/lib/dataStorage'

export async function GET() {
  try {
    console.log('Testing alternative data sources...')

    // Get alternative job data
    const altData = await getAlternativeJobsData()

    // Save each source to storage
    for (const source of altData.sources) {
      // Save as Indeed data for now (since these are job postings)
      addDataPoint('Indeed', {
        date: new Date().toISOString(),
        count: source.count,
        metadata: {
          source: source.name,
          type: 'alternative',
          timestamp: source.timestamp,
        },
      })
    }

    // Get trending data
    const trendData = getTrendingData()

    return NextResponse.json({
      ok: true,
      message: 'Alternative data sources tested successfully',
      data: {
        totalEstimate: altData.totalEstimate,
        sources: altData.sources,
        averagePerSource: Math.round(
          altData.totalEstimate / altData.sources.length
        ),
      },
      trends: trendData,
    })
  } catch (err: unknown) {
    let message = 'Unknown error'
    if (err instanceof Error) message = err.message
    else if (typeof err === 'string') message = err

    console.error('Alternative sources error:', err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
