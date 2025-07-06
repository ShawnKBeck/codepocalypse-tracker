import { NextRequest, NextResponse } from 'next/server'
import { getSoftwareDevJobCount } from '@/lib/blsScraper'
import { getIndeedSoftwareDevJobCount } from '@/lib/indeedScraper'
import { addDataPoint, getTrendingData } from '@/lib/dataStorage'
import { getAlternativeJobsData } from '@/lib/alternativeSources'

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
    // Accept { live?: boolean, mockHtml?: string } in body
    const body = await req.json()
    const { live = true, mockHtml } = body

    // Fetch from both sources
    const [blsData, indeedData] = await Promise.allSettled([
      getSoftwareDevJobCount({ live, mockHtml }),
      getIndeedSoftwareDevJobCount({ live, mockHtml }),
    ])

    // Process results
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
        metadata: { source: 'BLS' },
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
        },
      })
    } else {
      results.errors.push(`Indeed: ${indeedData.reason}`)
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
  // For quick testing: fetch and return the latest job count from both sources
  try {
    const [blsData, indeedData] = await Promise.allSettled([
      getSoftwareDevJobCount({ live: true }),
      getIndeedSoftwareDevJobCount({ live: true }),
    ])

    const results = {
      bls: null as BLSData | null,
      indeed: null as IndeedData | null,
      errors: [] as string[],
      fallbackUsed: false,
    }

    if (blsData.status === 'fulfilled') {
      results.bls = blsData.value
    } else {
      results.errors.push(`BLS: ${blsData.reason}`)
    }

    if (indeedData.status === 'fulfilled') {
      results.indeed = indeedData.value
    } else {
      results.errors.push(`Indeed: ${indeedData.reason}`)
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

    return NextResponse.json({ ok: true, data: results, trends: trendData })
  } catch (err: unknown) {
    let message = 'Unknown error'
    if (err instanceof Error) message = err.message
    else if (typeof err === 'string') message = err
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
