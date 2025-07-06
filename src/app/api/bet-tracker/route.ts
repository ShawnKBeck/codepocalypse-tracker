import { NextResponse } from 'next/server'
import { getSoftwareDevJobCount } from '@/lib/blsScraper'
import { getFREDEconomicData } from '@/lib/fredAPI'

interface FredData {
  techEmployment: number
  healthScore: number
}

export async function GET() {
  try {
    // Fetch current data from both sources
    const [blsResult, fredResult] = await Promise.allSettled([
      getSoftwareDevJobCount({ live: true }),
      getFREDEconomicData(),
    ])

    const response = {
      ok: true,
      betData: {
        bls: null as number | null,
        fred: null as FredData | null,
        winner: null as string | null,
        jobChange: 0,
        percentChange: 0,
        monthsIn: 1,
      },
      timestamp: new Date().toISOString(),
    }

    // Process BLS data
    if (blsResult.status === 'fulfilled') {
      response.betData.bls = blsResult.value.count
    }

    // Process FRED data
    if (fredResult.status === 'fulfilled') {
      response.betData.fred = {
        techEmployment: fredResult.value.techEmployment.current.value,
        healthScore: fredResult.value.healthScore.score,
      }
    }

    // Calculate bet status
    const baseline = 1692100 // 2023 baseline
    if (response.betData.bls) {
      response.betData.jobChange = response.betData.bls - baseline
      response.betData.percentChange =
        (response.betData.jobChange / baseline) * 100

      if (response.betData.jobChange < 0) {
        response.betData.winner = 'Mark'
      } else if (response.betData.jobChange > 0) {
        response.betData.winner = 'Shawn'
      } else {
        response.betData.winner = 'Tie'
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Bet tracker API error:', error)

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
