import { NextResponse } from 'next/server'
import { getSoftwareDevJobCount } from '@/lib/blsScraper'
import { getIndeedSoftwareDevJobCount } from '@/lib/indeedScraper'
import { addDataPoint, getTrendingData } from '@/lib/dataStorage'
import { mockBLSHTML, mockIndeedHTML } from '@/lib/testData'

interface BLSData {
  year: string
  count: number
}

interface IndeedData {
  count: number
  searchTerms: string
  location: string
  source: string
  url: string
  timestamp: string
}

export async function GET() {
  try {
    // Use mock data to test the system
    const [blsData, indeedData] = await Promise.allSettled([
      getSoftwareDevJobCount({ live: false, mockHtml: mockBLSHTML }),
      getIndeedSoftwareDevJobCount({ live: false, mockHtml: mockIndeedHTML }),
    ])

    const results = {
      bls: null as BLSData | null,
      indeed: null as IndeedData | null,
      errors: [] as string[],
    }

    if (blsData.status === 'fulfilled') {
      results.bls = blsData.value
      // Save to storage
      addDataPoint('BLS', {
        date: new Date().toISOString(),
        count: blsData.value.count,
        year: blsData.value.year,
        metadata: { source: 'BLS', test: true },
      })
    } else {
      results.errors.push(`BLS: ${blsData.reason}`)
    }

    if (indeedData.status === 'fulfilled') {
      results.indeed = indeedData.value
      // Save to storage
      addDataPoint('Indeed', {
        date: new Date().toISOString(),
        count: indeedData.value.count,
        metadata: {
          searchTerms: indeedData.value.searchTerms,
          location: indeedData.value.location,
          url: indeedData.value.url,
          test: true,
        },
      })
    } else {
      results.errors.push(`Indeed: ${indeedData.reason}`)
    }

    // Get trending data
    const trendData = getTrendingData()

    return NextResponse.json({
      ok: true,
      data: results,
      trends: trendData,
      message: 'Test data - scrapers working with mock HTML',
    })
  } catch (err: unknown) {
    let message = 'Unknown error'
    if (err instanceof Error) message = err.message
    else if (typeof err === 'string') message = err
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
