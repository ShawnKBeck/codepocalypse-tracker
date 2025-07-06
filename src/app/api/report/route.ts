import { NextRequest, NextResponse } from 'next/server'
import { getSoftwareDevJobCount } from '@/lib/blsScraper'
import { getIndeedSoftwareDevJobCount } from '@/lib/indeedScraper'
import { getBLSEmploymentData } from '@/lib/blsAPI'
import { getFREDEconomicData, type EconomicIndicators } from '@/lib/fredAPI'
import { getAlternativeJobsData } from '@/lib/alternativeSources'
import { addDataPoint, getTrendingData } from '@/lib/dataStorage'

interface BLSData {
  year: string
  count: number
  source?: string
  note?: string
}

interface IndeedData {
  count: number
  searchTerms: string
  location: string
  source: string
  url: string
  timestamp: string
}

// Get emails from env or hardcode for now (replace with env in prod)
const EMAILS = [
  process.env.REPORT_EMAIL_SHWN || 'shawn@example.com',
  process.env.REPORT_EMAIL_MARK || 'mark@example.com',
]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('POST /api/report called with body:', body)

    // Fetch data from multiple sources simultaneously
    const [blsDataResult, indeedData, fredData] = await Promise.allSettled([
      // Try web scraper first (most current data), then BLS API fallback
      getSoftwareDevJobCount({ live: true }).catch(async (scraperError) => {
        console.log('BLS scraper failed, trying API fallback...')
        try {
          const apiData = await getBLSEmploymentData()
          return {
            year: apiData.current.year,
            count: apiData.current.employment,
            source: apiData.metadata.source + ' (API Fallback)',
            note:
              apiData.metadata.apiStatus === 'FALLBACK_USED'
                ? 'BLS API fallback data used'
                : 'Data from official BLS API v2.0',
          }
        } catch (apiError) {
          throw new Error(`Scraper: ${scraperError} | API: ${apiError}`)
        }
      }),
      getIndeedSoftwareDevJobCount({ live: true }),
      getFREDEconomicData().catch((error) => {
        console.log('FRED API failed:', error)
        throw error
      }),
    ])

    // Process results
    const results = {
      bls: null as BLSData | null,
      indeed: null as IndeedData | null,
      fred: null as EconomicIndicators | null,
      errors: [] as string[],
    }

    // Process BLS data
    if (blsDataResult.status === 'fulfilled') {
      results.bls = blsDataResult.value
      // Save to storage
      addDataPoint('BLS', {
        date: new Date().toISOString(),
        count: blsDataResult.value.count,
        year: blsDataResult.value.year,
        metadata: {
          source: blsDataResult.value.source || 'BLS',
          note: blsDataResult.value.note,
        },
      })
    } else {
      results.errors.push(`BLS: ${blsDataResult.reason}`)
    }

    // Process Indeed data
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
        },
      })
    } else {
      results.errors.push(`Indeed: ${indeedData.reason}`)
    }

    // Process FRED data
    if (fredData.status === 'fulfilled') {
      results.fred = fredData.value
    } else {
      results.errors.push(`FRED: ${fredData.reason}`)
    }

    // Get trending data
    const trendData = getTrendingData()

    // Compose comprehensive email
    const subject = `Codepocalypse Tracker Update - ${new Date().toLocaleDateString()}`
    const html = `
      <h1>Codepocalypse Tracker Update</h1>
      <h2>Current Data</h2>
      ${
        results.bls
          ? `
        <p><strong>BLS Employment (${results.bls.year}):</strong> ${results.bls.count.toLocaleString()} jobs</p>
        ${results.bls.source ? `<p><em>Source: ${results.bls.source}</em></p>` : ''}
        ${results.bls.note ? `<p><em>Note: ${results.bls.note}</em></p>` : ''}
      `
          : '<p>BLS data unavailable</p>'
      }
      ${results.indeed ? `<p><strong>Indeed Job Postings:</strong> ${results.indeed.count.toLocaleString()} jobs</p>` : '<p>Indeed data unavailable</p>'}
      ${results.fred ? `<p><strong>FRED Economic Data:</strong> Tech Employment: ${results.fred.techEmployment.current.value.toLocaleString()}, Health Score: ${results.fred.healthScore.score}/100</p>` : '<p>FRED data unavailable</p>'}
      
      <h2>Trends</h2>
      <p><strong>BLS Trend:</strong> ${trendData.bls.trend}</p>
      <p><strong>Indeed Trend:</strong> ${trendData.indeed.trend}</p>
      
             ${results.errors.length > 0 ? `<h2>Errors</h2><ul>${results.errors.map((e: string) => `<li>${e}</li>`).join('')}</ul>` : ''}
      
      <p><em>Data collected on ${new Date().toLocaleDateString()}</em></p>
    `

    // Only require resend when actually sending email
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Send to both recipients
    const emailResults = await Promise.all(
      EMAILS.map((email) =>
        resend.emails.send({
          from: 'Codepocalypse Tracker <noreply@codepocalypse.dev>',
          to: email,
          subject,
          html,
        })
      )
    )

    return NextResponse.json({
      ok: true,
      data: results,
      trends: trendData,
      emailResults,
    })
  } catch (err: unknown) {
    let message = 'Unknown error'
    if (err instanceof Error) message = err.message
    else if (typeof err === 'string') message = err
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function GET() {
  // For quick testing: fetch and return the latest job count from all sources
  try {
    // Try BLS API first, then fallback to scraping
    let blsData: BLSData | null = null
    let blsError: string | null = null

    // Primary: Try web scraping (most current data)
    try {
      console.log('GET: Attempting to fetch from BLS web scraper...')
      const scraperData = await getSoftwareDevJobCount({ live: true })
      blsData = {
        year: scraperData.year,
        count: scraperData.count,
        source: scraperData.source + ' (Live Scraping)',
        note: scraperData.note + ' - Current data from BLS.gov',
      }
      console.log(
        `GET BLS Scraper Success: ${blsData.count.toLocaleString()} jobs`
      )
    } catch (scraperError) {
      console.log('GET: BLS scraper failed, trying API fallback...')
      blsError = `BLS Scraper: ${scraperError}`

      // Fallback: Try official BLS API
      try {
        console.log('GET: Attempting fallback to official BLS API...')
        const apiData = await getBLSEmploymentData()
        blsData = {
          year: apiData.current.year,
          count: apiData.current.employment,
          source: apiData.metadata.source + ' (API Fallback)',
          note:
            apiData.metadata.apiStatus === 'FALLBACK_USED'
              ? 'BLS API fallback data used'
              : 'Data from official BLS API v2.0',
        }
        console.log(
          `GET BLS API Success: ${blsData.count.toLocaleString()} jobs`
        )
      } catch (apiError) {
        blsError += ` | API: ${apiError}`
      }
    }

    const [indeedData, fredData] = await Promise.allSettled([
      getIndeedSoftwareDevJobCount({ live: true }),
      getFREDEconomicData().catch((error) => {
        console.log('GET: FRED API failed:', error)
        throw error
      }),
    ])

    const results = {
      bls: blsData,
      indeed: null as IndeedData | null,
      fred: null as EconomicIndicators | null,
      errors: [] as string[],
      fallbackUsed: false,
    }

    // Add BLS error if both API and scraper failed
    if (!blsData && blsError) {
      results.errors.push(blsError)
    }

    if (indeedData.status === 'fulfilled') {
      results.indeed = indeedData.value
    } else {
      results.errors.push(`Indeed: ${indeedData.reason}`)
    }

    if (fredData.status === 'fulfilled') {
      results.fred = fredData.value
    } else {
      results.errors.push(`FRED: ${fredData.reason}`)
    }

    // If both primary sources failed, use alternative sources
    if (!results.bls && !results.indeed) {
      console.log('Both primary sources failed, trying alternative sources...')
      try {
        const altData = await getAlternativeJobsData()

        // Use the total estimate as Indeed data (job postings)
        results.indeed = {
          count: altData.totalEstimate,
          searchTerms: 'software developer (multiple sources)',
          location: 'United States',
          source: 'Alternative Sources',
          url: '',
          timestamp: new Date().toISOString(),
        }

        results.fallbackUsed = true
        results.errors.push(
          `Using alternative sources: ${altData.sources.map((s) => s.name).join(', ')}`
        )
      } catch (altError) {
        results.errors.push(`Alternative sources also failed: ${altError}`)
      }
    }

    // Get trending data
    const trendData = getTrendingData()

    return NextResponse.json({
      ok: true,
      data: results,
      trends: trendData,
      meta: {
        blsApiUsed: blsData?.source?.includes('BLS API') || false,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (err: unknown) {
    let message = 'Unknown error'
    if (err instanceof Error) message = err.message
    else if (typeof err === 'string') message = err
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
