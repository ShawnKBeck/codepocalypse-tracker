import { NextResponse } from 'next/server'
import { getSoftwareDevJobCount } from '@/lib/blsScraper'
import { getFREDEconomicData } from '@/lib/fredAPI'
import {
  getCurrentMonthData,
  shouldUpdateData,
  addMonthlyDataPoint,
  getDataSummary,
  getChartData,
} from '@/lib/monthlyDataStorage'

export async function GET() {
  try {
    console.log('🔍 Checking monthly data storage...')

    // Check if we need to update data (only on 1st of the month)
    const needsUpdate = shouldUpdateData()

    if (needsUpdate) {
      console.log('📅 First of the month - fetching fresh data...')

      // Fetch fresh data from both sources
      const [blsResult, fredResult] = await Promise.allSettled([
        getSoftwareDevJobCount({ live: true }),
        getFREDEconomicData(),
      ])

      let blsData: { count: number; source: 'live' | 'fallback' } = {
        count: 1692100,
        source: 'fallback',
      } // Default fallback
      let fredData: {
        techEmployment: number
        jobOpenings?: number
        healthScore: number
      } = { techEmployment: 2400, healthScore: 50 } // Default fallback

      // Process BLS data
      if (blsResult.status === 'fulfilled') {
        blsData = {
          count: blsResult.value.count,
          source: 'live',
        }
        console.log(`✅ BLS data fetched: ${blsData.count} jobs`)
      } else {
        console.log('⚠️ BLS fetch failed, using fallback data')
      }

      // Process FRED data
      if (fredResult.status === 'fulfilled') {
        fredData = {
          techEmployment: fredResult.value.techEmployment.current.value,
          jobOpenings:
            fredResult.value.jobOpenings?.current?.value || undefined,
          healthScore: fredResult.value.healthScore.score,
        }
        console.log(
          `✅ FRED data fetched: ${fredData.techEmployment}K tech employment, ${fredData.healthScore}/100 health`
        )
      } else {
        console.log('⚠️ FRED fetch failed, using fallback data')
      }

      // Store the new monthly data
      const monthlyData = addMonthlyDataPoint(blsData, fredData)

      // Get summary and chart data
      const summary = getDataSummary()
      const chartData = getChartData()

      console.log('✅ Fresh monthly data stored successfully')

      return NextResponse.json({
        ok: true,
        current: monthlyData,
        summary,
        chartData,
        fromCache: false,
        lastUpdated: monthlyData.timestamp,
        nextUpdateDue: summary.nextUpdateDue,
        message: 'Fresh data fetched and stored for the month',
      })
    }

    // Serve data from storage
    console.log('📦 Serving data from monthly storage...')

    const currentData = getCurrentMonthData()
    const summary = getDataSummary()
    const chartData = getChartData()

    if (!currentData) {
      // No data available - this should only happen on first run
      console.log('⚠️ No stored data found - manual update needed')
      return NextResponse.json({
        ok: true,
        current: null,
        summary,
        chartData: [],
        fromCache: false,
        message: 'No data available - waiting for monthly update',
        nextUpdateDue: summary.nextUpdateDue,
      })
    }

    const now = new Date()
    const dataAge = Math.floor(
      (now.getTime() - new Date(currentData.timestamp).getTime()) /
        (1000 * 60 * 60 * 24)
    )

    console.log(`📊 Serving ${currentData.month} data (${dataAge} days old)`)

    return NextResponse.json({
      ok: true,
      current: currentData,
      summary,
      chartData,
      fromCache: true,
      lastUpdated: currentData.timestamp,
      nextUpdateDue: summary.nextUpdateDue,
      dataAge: dataAge,
      message: `Serving stored data from ${currentData.month} (${dataAge} days old)`,
    })
  } catch (error) {
    console.error('Monthly bet tracker API error:', error)

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        message: 'Error accessing monthly data storage',
      },
      { status: 500 }
    )
  }
}
