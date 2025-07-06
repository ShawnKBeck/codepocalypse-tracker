'use client'

import { useState, useEffect } from 'react'
import BetTracker from '@/components/BetTracker'

interface MonthlyDataPoint {
  month: string
  date: string
  bls: {
    count: number
    source: 'live' | 'fallback'
  }
  fred: {
    techEmployment: number
    jobOpenings?: number
    healthScore: number
  }
  analysis: {
    jobChange: number
    percentChange: number
    winner: 'Shawn' | 'Mark' | 'Tie'
    baseline: number
  }
  timestamp: string
}

interface ChartDataPoint {
  month: string
  date: string
  baseline: number
  actual: number
  jobChange: number
  percentChange: number
  winner: string
}

interface ApiResponse {
  ok: boolean
  current: MonthlyDataPoint | null
  summary: {
    totalMonths: number
    currentWinner: string
    avgMonthlyChange: number
    trendDirection: 'up' | 'down' | 'stable'
    nextUpdateDue: string
  }
  chartData: ChartDataPoint[]
  fromCache: boolean
  lastUpdated?: string
  nextUpdateDue?: string
  dataAge?: number
  message?: string
  error?: string
}

export default function Home() {
  const [apiData, setApiData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBetData() {
      try {
        const response = await fetch('/api/bet-tracker')
        const data = await response.json()

        if (data.ok) {
          setApiData(data)
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-blue-600 text-xl font-medium">
            Loading monthly data...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-red-500 text-3xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Connection Error
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!apiData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-yellow-500 text-3xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              No Data Available
            </h2>
            <p className="text-gray-600 mb-6">
              Waiting for the first monthly data collection.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            📊 Codepocalypse Tracker
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-6">
            Monitoring the Great Software Job Debate of 2025-2030
          </p>
          <div className="flex items-center justify-center gap-3 text-gray-500 text-sm flex-wrap">
            <span className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${apiData.fromCache ? 'bg-blue-500' : 'bg-green-500'}`}
              ></div>
              {apiData.fromCache ? 'Cached Data' : 'Fresh Data'}
            </span>
            <span>•</span>
            <span>
              {apiData.current
                ? `Data from ${apiData.current.month}`
                : 'No data yet'}
            </span>
            {apiData.dataAge !== undefined && (
              <>
                <span>•</span>
                <span>{apiData.dataAge} days old</span>
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          <BetTracker
            current={apiData.current}
            summary={apiData.summary}
            chartData={apiData.chartData}
            fromCache={apiData.fromCache}
            dataAge={apiData.dataAge}
            nextUpdateDue={apiData.nextUpdateDue}
            message={apiData.message}
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              🤖 AI vs 👨‍💻 Human: The Final Code
            </h3>
            <p className="text-sm text-gray-600">
              Monthly tracking of software developer employment using official
              government data sources (BLS & FRED)
            </p>
            {apiData.current && (
              <div className="mt-4 text-xs text-gray-500">
                <p>
                  Current Winner:{' '}
                  <span className="font-medium">
                    {apiData.current.analysis.winner}
                  </span>{' '}
                  • Next Update:{' '}
                  {apiData.nextUpdateDue
                    ? new Date(apiData.nextUpdateDue).toLocaleDateString()
                    : 'TBD'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
