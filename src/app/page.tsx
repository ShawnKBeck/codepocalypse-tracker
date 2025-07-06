'use client'

import { useState, useEffect } from 'react'
import BetTracker from '@/components/BetTracker'

interface BetData {
  bls: number | null
  fred: {
    techEmployment: number
    healthScore: number
  } | null
  winner: string | null
  jobChange: number
  percentChange: number
}

export default function Home() {
  const [betData, setBetData] = useState<BetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBetData() {
      try {
        const response = await fetch('/api/bet-tracker')
        const data = await response.json()

        if (data.ok) {
          setBetData(data.betData)
        } else {
          setError(data.error || 'Failed to fetch bet data')
        }
      } catch (err) {
        setError('Failed to connect to API')
        console.error('Error fetching bet data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBetData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading bet data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">🤖 Codepocalypse Tracker</h1>
        <p className="text-xl text-gray-600 mb-2">
          5-Year Software Developer Employment Bet
        </p>
        <p className="text-lg text-gray-500">
          Shawn vs Mark • Started June 6th, 2025
        </p>
        <div className="mt-4 p-4 bg-gray-100 rounded-lg inline-block">
          <p className="font-medium">
            <span className="text-blue-600">Shawn predicts:</span> Jobs will
            grow (AI creates more opportunities)
          </p>
          <p className="font-medium">
            <span className="text-red-600">Mark predicts:</span> Jobs will
            decline (AI replaces developers)
          </p>
        </div>
      </div>

      <BetTracker
        currentData={
          betData
            ? {
                bls: betData.bls || 1656880,
                fred: betData.fred || {
                  techEmployment: 2431.2,
                  healthScore: 15,
                },
              }
            : undefined
        }
      />

      <div className="mt-8 text-center text-gray-500">
        <p>
          Data sources: BLS.gov (Live Scraping) • FRED API (Federal Reserve) •
          Updated automatically
        </p>
        <p className="text-sm mt-2">
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>
    </main>
  )
}
