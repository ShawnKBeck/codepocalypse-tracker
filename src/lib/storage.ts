// Simple storage utility for the Codepocalypse Tracker
// This handles local data persistence and trending calculations

interface DataPoint {
  timestamp: string
  bls: number
  fred: {
    techEmployment: number
    jobOpenings?: number
    healthScore: number
  }
  source: 'live' | 'fallback'
}

interface TrendingData {
  period: string
  blsChange: number
  fredChange: number
  overallTrend: 'up' | 'down' | 'stable'
}

// In-memory storage for current session
let dataHistory: DataPoint[] = []
let trendingAnalysis: TrendingData[] = []

export function addDataPoint(dataPoint: DataPoint) {
  try {
    // Add to in-memory storage
    dataHistory.push(dataPoint)

    // Keep only last 100 data points to prevent memory issues
    if (dataHistory.length > 100) {
      dataHistory = dataHistory.slice(-100)
    }

    // Update trending analysis
    updateTrendingAnalysis()

    return true
  } catch (error) {
    console.error('Error adding data point:', error)
    return false
  }
}

export function getTrendingData(): TrendingData[] {
  return trendingAnalysis
}

export function getDataHistory(): DataPoint[] {
  return dataHistory
}

export function getLatestDataPoint(): DataPoint | null {
  return dataHistory.length > 0 ? dataHistory[dataHistory.length - 1] : null
}

function updateTrendingAnalysis() {
  if (dataHistory.length < 2) return

  const recent = dataHistory.slice(-10) // Last 10 data points
  if (recent.length < 2) return

  const first = recent[0]
  const last = recent[recent.length - 1]

  const blsChange = ((last.bls - first.bls) / first.bls) * 100
  const fredChange =
    ((last.fred.techEmployment - first.fred.techEmployment) /
      first.fred.techEmployment) *
    100

  let overallTrend: 'up' | 'down' | 'stable' = 'stable'
  if (blsChange > 0.1) overallTrend = 'up'
  else if (blsChange < -0.1) overallTrend = 'down'

  const trendPoint: TrendingData = {
    period: last.timestamp,
    blsChange,
    fredChange,
    overallTrend,
  }

  trendingAnalysis.push(trendPoint)

  // Keep only last 50 trend points
  if (trendingAnalysis.length > 50) {
    trendingAnalysis = trendingAnalysis.slice(-50)
  }
}

// Calculate percentage change from baseline
export function calculateChange(
  current: number,
  baseline: number
): {
  absolute: number
  percentage: number
} {
  const absolute = current - baseline
  const percentage = (absolute / baseline) * 100

  return { absolute, percentage }
}

// Get summary statistics
export function getStatsSummary() {
  if (dataHistory.length === 0) {
    return {
      totalDataPoints: 0,
      averageBLS: 0,
      averageFRED: 0,
      trend: 'insufficient-data' as const,
    }
  }

  const avgBLS =
    dataHistory.reduce((sum, point) => sum + point.bls, 0) / dataHistory.length
  const avgFRED =
    dataHistory.reduce((sum, point) => sum + point.fred.techEmployment, 0) /
    dataHistory.length

  let trend: 'up' | 'down' | 'stable' = 'stable'
  if (dataHistory.length >= 2) {
    const first = dataHistory[0]
    const last = dataHistory[dataHistory.length - 1]
    const change = ((last.bls - first.bls) / first.bls) * 100

    if (change > 0.5) trend = 'up'
    else if (change < -0.5) trend = 'down'
  }

  return {
    totalDataPoints: dataHistory.length,
    averageBLS: Math.round(avgBLS),
    averageFRED: Math.round(avgFRED * 10) / 10,
    trend,
  }
}

// Clear all stored data (for testing/reset)
export function clearStorage() {
  dataHistory = []
  trendingAnalysis = []
}

// Export for debugging
export function debugStorage() {
  console.log('Storage Debug:', {
    dataHistory: dataHistory.length,
    trendingAnalysis: trendingAnalysis.length,
    latest: getLatestDataPoint(),
    stats: getStatsSummary(),
  })
}
