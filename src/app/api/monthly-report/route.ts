import { NextResponse } from 'next/server'
import { getSoftwareDevJobCount } from '@/lib/blsScraper'
import { getFREDEconomicData } from '@/lib/fredAPI'
import { getBLSEmploymentData } from '@/lib/blsAPI'
import { getAlternativeJobsData } from '@/lib/alternativeSources'
import { addDataPoint } from '@/lib/dataStorage'
import { Resend } from 'resend'

interface MonthlyReportData {
  bls: {
    current: number
    change: number
    percentChange: number
    trend: 'up' | 'down' | 'stable'
  }
  fred: {
    techEmployment: number
    jobOpenings: number
    healthScore: number
    trend: 'up' | 'down' | 'stable'
  }
  alternative: {
    totalJobs: number
    sources: string[]
  }
  betStatus: {
    winner: 'Shawn' | 'Mark' | 'Tied'
    confidence: string
  }
}

const BASELINE_EMPLOYMENT = 1692100 // June 2025 baseline

export async function GET() {
  try {
    console.log('Monthly report generation started...')

    // Check if it's the 6th of the month (optional - can be called anytime)
    const today = new Date()
    const isScheduledDay = today.getDate() === 6

    console.log(
      `Today is ${today.toLocaleDateString()}, Scheduled day: ${isScheduledDay}`
    )

    // Fetch all data sources in parallel
    const [blsResult, fredResult, alternativeResult] = await Promise.allSettled(
      [
        // Try BLS scraper first, fallback to API
        getSoftwareDevJobCount({ live: true }).catch(async (scraperError) => {
          console.log('BLS scraper failed, trying API fallback...')
          try {
            const apiData = await getBLSEmploymentData()
            return {
              year: apiData.current.year,
              count: apiData.current.employment,
              source: 'BLS API (Fallback)',
            }
          } catch (apiError) {
            throw new Error(`Scraper: ${scraperError} | API: ${apiError}`)
          }
        }),
        getFREDEconomicData(),
        getAlternativeJobsData(),
      ]
    )

    // Process results
    const reportData: MonthlyReportData = {
      bls: {
        current: 0,
        change: 0,
        percentChange: 0,
        trend: 'stable',
      },
      fred: {
        techEmployment: 0,
        jobOpenings: 0,
        healthScore: 0,
        trend: 'stable',
      },
      alternative: {
        totalJobs: 0,
        sources: [],
      },
      betStatus: {
        winner: 'Tied',
        confidence: 'Insufficient data',
      },
    }

    const errors: string[] = []

    // Process BLS data
    if (blsResult.status === 'fulfilled') {
      const current = blsResult.value.count
      const change = current - BASELINE_EMPLOYMENT
      const percentChange = (change / BASELINE_EMPLOYMENT) * 100

      reportData.bls = {
        current,
        change,
        percentChange,
        trend:
          percentChange > 1 ? 'up' : percentChange < -1 ? 'down' : 'stable',
      }

      // Save to storage
      addDataPoint('BLS', {
        date: new Date().toISOString(),
        count: current,
        year: blsResult.value.year,
        metadata: {
          source: blsResult.value.source || 'BLS',
          monthlyReport: true,
        },
      })
    } else {
      errors.push(`BLS: ${blsResult.reason}`)
    }

    // Process FRED data
    if (fredResult.status === 'fulfilled') {
      const fred = fredResult.value
      reportData.fred = {
        techEmployment: fred.techEmployment.current.value,
        jobOpenings: fred.jobOpenings.current.value,
        healthScore: fred.healthScore.score,
        trend: fred.techEmployment.trend.direction,
      }
    } else {
      errors.push(`FRED: ${fredResult.reason}`)
    }

    // Process alternative data
    if (alternativeResult.status === 'fulfilled') {
      const alt = alternativeResult.value
      reportData.alternative = {
        totalJobs: alt.totalEstimate,
        sources: alt.sources.map((s) => s.name),
      }
    } else {
      errors.push(`Alternative: ${alternativeResult.reason}`)
    }

    // Determine bet status
    if (reportData.bls.percentChange > 0) {
      reportData.betStatus = {
        winner: 'Shawn',
        confidence: Math.abs(reportData.bls.percentChange) > 2 ? 'High' : 'Low',
      }
    } else if (reportData.bls.percentChange < 0) {
      reportData.betStatus = {
        winner: 'Mark',
        confidence: Math.abs(reportData.bls.percentChange) > 2 ? 'High' : 'Low',
      }
    }

    // Send email
    const emailResult = await sendMonthlyEmail(reportData, errors)

    return NextResponse.json({
      success: true,
      data: reportData,
      errors,
      emailSent: emailResult.success,
      emailId: emailResult.id,
      scheduledDay: isScheduledDay,
    })
  } catch (error) {
    console.error('Monthly report error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

async function sendMonthlyEmail(data: MonthlyReportData, errors: string[]) {
  const resend = new Resend(process.env.RESEND_API_KEY)

  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }

  const currentDate = new Date()
  const monthYear = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const subject = `🤖 Codepocalypse Tracker Monthly Report - ${monthYear}`

  const html = generateEmailTemplate(data, errors, monthYear)

  try {
    const result = await resend.emails.send({
      from: 'Codepocalypse Tracker <shawn@clairecalls.com>',
      to: ['moosefarnham@gmail.com', 'shawnkbeck@gmail.com'],
      subject,
      html,
    })

    console.log('Email sent successfully:', result)
    return { success: true, id: result.data?.id }
  } catch (error) {
    console.error('Email sending failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

function generateEmailTemplate(
  data: MonthlyReportData,
  errors: string[],
  monthYear: string
): string {
  const { bls, fred, alternative, betStatus } = data

  // Determine status colors
  const statusColor =
    betStatus.winner === 'Shawn'
      ? '#10B981'
      : betStatus.winner === 'Mark'
        ? '#EF4444'
        : '#6B7280'
  const trendIcon =
    bls.trend === 'up' ? '📈' : bls.trend === 'down' ? '📉' : '➡️'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Codepocalypse Tracker Monthly Report</title>
      <style>
        body {
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          background-color: #f9fafb;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 680px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #1e40af, #3b82f6);
          color: white;
          padding: 32px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .header p {
          margin: 8px 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 32px;
        }
        .status-banner {
          background: ${statusColor}15;
          border: 2px solid ${statusColor};
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 32px;
          text-align: center;
        }
        .status-banner h2 {
          color: ${statusColor};
          margin: 0 0 8px;
          font-size: 24px;
        }
        .status-banner p {
          margin: 0;
          font-size: 16px;
          color: #6b7280;
        }
        .metric-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }
        .metric-card {
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
        }
        .metric-card h3 {
          margin: 0 0 16px;
          color: #374151;
          font-size: 18px;
          font-weight: 600;
        }
        .metric-value {
          font-size: 32px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 8px;
        }
        .metric-change {
          font-size: 14px;
          font-weight: 500;
        }
        .metric-change.positive { color: #10b981; }
        .metric-change.negative { color: #ef4444; }
        .metric-change.neutral { color: #6b7280; }
        .trend-section {
          background: #f3f4f6;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 32px;
        }
        .trend-section h3 {
          margin: 0 0 16px;
          color: #374151;
          font-size: 20px;
          font-weight: 600;
        }
        .trend-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .trend-item:last-child {
          border-bottom: none;
        }
        .footer {
          background: #f9fafb;
          padding: 24px 32px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
        }
        .error-section {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .error-section h4 {
          color: #dc2626;
          margin: 0 0 12px;
          font-size: 16px;
        }
        .error-list {
          color: #7f1d1d;
          font-size: 14px;
          margin: 0;
          padding-left: 20px;
        }
        @media (max-width: 640px) {
          .metric-grid {
            grid-template-columns: 1fr;
          }
          .header {
            padding: 24px;
          }
          .header h1 {
            font-size: 24px;
          }
          .content {
            padding: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🤖 Codepocalypse Tracker</h1>
          <p>Monthly Report - ${monthYear}</p>
        </div>
        
        <div class="content">
          <div class="status-banner">
            <h2>${trendIcon} ${betStatus.winner === 'Tied' ? 'Status: Tied' : `${betStatus.winner} is Leading`}</h2>
            <p>Confidence: ${betStatus.confidence} • BLS Employment Change: ${bls.percentChange >= 0 ? '+' : ''}${bls.percentChange.toFixed(2)}%</p>
          </div>
          
          <div class="metric-grid">
            <div class="metric-card">
              <h3>📊 BLS Employment Data</h3>
              <div class="metric-value">${bls.current.toLocaleString()}</div>
              <div class="metric-change ${bls.change >= 0 ? 'positive' : 'negative'}">
                ${bls.change >= 0 ? '+' : ''}${bls.change.toLocaleString()} jobs (${bls.percentChange >= 0 ? '+' : ''}${bls.percentChange.toFixed(2)}%)
              </div>
            </div>
            
            <div class="metric-card">
              <h3>🏭 FRED Tech Employment</h3>
              <div class="metric-value">${fred.techEmployment.toLocaleString()}K</div>
              <div class="metric-change ${fred.trend === 'up' ? 'positive' : fred.trend === 'down' ? 'negative' : 'neutral'}">
                Trend: ${fred.trend.toUpperCase()}
              </div>
            </div>
            
            <div class="metric-card">
              <h3>💼 Job Openings</h3>
              <div class="metric-value">${fred.jobOpenings.toLocaleString()}</div>
              <div class="metric-change neutral">
                FRED Professional Services
              </div>
            </div>
            
            <div class="metric-card">
              <h3>🌐 Alternative Sources</h3>
              <div class="metric-value">${alternative.totalJobs.toLocaleString()}</div>
              <div class="metric-change neutral">
                ${alternative.sources.length} sources active
              </div>
            </div>
          </div>
          
          <div class="trend-section">
            <h3>📈 Trend Analysis</h3>
            <div class="trend-item">
              <span><strong>Economic Health Score:</strong></span>
              <span style="color: ${fred.healthScore < 30 ? '#ef4444' : fred.healthScore < 70 ? '#f59e0b' : '#10b981'}">${fred.healthScore}/100</span>
            </div>
            <div class="trend-item">
              <span><strong>Market Sentiment:</strong></span>
              <span>${fred.healthScore < 30 ? 'Critical' : fred.healthScore < 70 ? 'Cautious' : 'Optimistic'}</span>
            </div>
            <div class="trend-item">
              <span><strong>Data Quality:</strong></span>
              <span style="color: ${errors.length === 0 ? '#10b981' : '#f59e0b'}">${errors.length === 0 ? 'Excellent' : 'Partial'}</span>
            </div>
          </div>
          
          ${
            errors.length > 0
              ? `
            <div class="error-section">
              <h4>⚠️ Data Collection Issues</h4>
              <ul class="error-list">
                ${errors.map((error) => `<li>${error}</li>`).join('')}
              </ul>
            </div>
          `
              : ''
          }
          
          <div style="background: #f0f9ff; border-radius: 8px; padding: 20px; margin-top: 24px;">
            <h4 style="color: #0369a1; margin: 0 0 12px; font-size: 16px;">🎯 The Bet Status</h4>
            <p style="margin: 0; font-size: 14px; color: #374151;">
              <strong>Shawn's Position:</strong> Software developer jobs will increase over 5 years<br>
              <strong>Mark's Position:</strong> Software developer jobs will decline due to AI automation<br>
              <strong>Baseline:</strong> ${BASELINE_EMPLOYMENT.toLocaleString()} jobs (June 2025)<br>
              <strong>Current Winner:</strong> ${betStatus.winner === 'Tied' ? 'Too close to call' : `${betStatus.winner} (${betStatus.confidence.toLowerCase()} confidence)`}
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p>
            Generated on ${new Date().toLocaleDateString()} • 
            <a href="https://codepocalypse-tracker.vercel.app" style="color: #3b82f6;">View Dashboard</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Also support POST for manual triggers
export async function POST() {
  return GET()
}
