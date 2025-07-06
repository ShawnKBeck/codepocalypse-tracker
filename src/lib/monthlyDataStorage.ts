import fs from 'fs'
import path from 'path'

export interface MonthlyDataPoint {
  month: string // YYYY-MM format
  date: string // Full ISO date
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

interface MonthlyDataStorage {
  data: MonthlyDataPoint[]
  lastUpdated: string
  nextUpdateDue: string
}

const DATA_DIR = path.join(process.cwd(), 'data')
const MONTHLY_FILE = path.join(DATA_DIR, 'monthly-bet-data.json')

// Check if we're in a serverless environment (like Vercel)
const IS_SERVERLESS =
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.FUNCTION_NAME

/**
 * Ensures the data directory exists (only works in non-serverless environments)
 */
function ensureDataDir() {
  if (IS_SERVERLESS) {
    return // Skip directory creation in serverless environments
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
  } catch (error) {
    console.warn(
      'Could not create data directory (serverless environment):',
      error
    )
  }
}

/**
 * Get default historical data for fallback
 */
function getDefaultHistoricalData(): MonthlyDataStorage {
  const baseline = 1692100
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  // Default historical data for June and July 2025
  const juneData: MonthlyDataPoint = {
    month: '2025-06',
    date: '2025-06-06T00:00:00.000Z',
    bls: {
      count: baseline,
      source: 'fallback',
    },
    fred: {
      techEmployment: 2431.2,
      jobOpenings: 1358,
      healthScore: 15,
    },
    analysis: {
      jobChange: 0,
      percentChange: 0,
      winner: 'Tie',
      baseline: baseline,
    },
    timestamp: '2025-06-06T00:00:00.000Z',
  }

  const julyBLS = 1656880
  const julyJobChange = julyBLS - baseline
  const julyPercentChange = (julyJobChange / baseline) * 100

  const julyData: MonthlyDataPoint = {
    month: '2025-07',
    date: '2025-07-15T00:00:00.000Z',
    bls: {
      count: julyBLS,
      source: 'live',
    },
    fred: {
      techEmployment: 2431.2,
      jobOpenings: 1358,
      healthScore: 15,
    },
    analysis: {
      jobChange: julyJobChange,
      percentChange: julyPercentChange,
      winner: julyJobChange < 0 ? 'Mark' : julyJobChange > 0 ? 'Shawn' : 'Tie',
      baseline: baseline,
    },
    timestamp: '2025-07-15T00:00:00.000Z',
  }

  return {
    data: [juneData, julyData],
    lastUpdated: new Date().toISOString(),
    nextUpdateDue: nextMonth.toISOString(),
  }
}

/**
 * Migrate historical data for June and July 2025
 */
function migrateHistoricalData(): void {
  if (IS_SERVERLESS) {
    return // Skip migration in serverless environments
  }

  const storage = loadMonthlyData()

  // Check if we already have historical data
  const hasJune = storage.data.some((d) => d.month === '2025-06')
  const hasJuly = storage.data.some((d) => d.month === '2025-07')

  if (hasJune && hasJuly) {
    return // Already migrated
  }

  console.log('📅 Migrating historical data for June and July 2025...')

  const baseline = 1692100

  // June 2025 - Starting baseline
  if (!hasJune) {
    const juneData: MonthlyDataPoint = {
      month: '2025-06',
      date: '2025-06-06T00:00:00.000Z',
      bls: {
        count: baseline,
        source: 'fallback',
      },
      fred: {
        techEmployment: 2431.2,
        jobOpenings: 1358,
        healthScore: 15,
      },
      analysis: {
        jobChange: 0,
        percentChange: 0,
        winner: 'Tie',
        baseline: baseline,
      },
      timestamp: '2025-06-06T00:00:00.000Z',
    }
    storage.data.push(juneData)
  }

  // July 2025 - Current actual data
  if (!hasJuly) {
    const julyBLS = 1656880
    const julyJobChange = julyBLS - baseline
    const julyPercentChange = (julyJobChange / baseline) * 100

    const julyData: MonthlyDataPoint = {
      month: '2025-07',
      date: '2025-07-15T00:00:00.000Z',
      bls: {
        count: julyBLS,
        source: 'live',
      },
      fred: {
        techEmployment: 2431.2,
        jobOpenings: 1358,
        healthScore: 15,
      },
      analysis: {
        jobChange: julyJobChange,
        percentChange: julyPercentChange,
        winner:
          julyJobChange < 0 ? 'Mark' : julyJobChange > 0 ? 'Shawn' : 'Tie',
        baseline: baseline,
      },
      timestamp: '2025-07-15T00:00:00.000Z',
    }
    storage.data.push(julyData)
  }

  // Sort by date
  storage.data.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Save the migrated data
  saveMonthlyData(storage)

  console.log('✅ Historical data migration complete')
}

/**
 * Loads monthly data from storage
 */
export function loadMonthlyData(): MonthlyDataStorage {
  // In serverless environments, always return default data
  if (IS_SERVERLESS) {
    console.log(
      '🔄 Serverless environment detected - using default historical data'
    )
    return getDefaultHistoricalData()
  }

  ensureDataDir()

  if (!fs.existsSync(MONTHLY_FILE)) {
    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    return {
      data: [],
      lastUpdated: new Date().toISOString(),
      nextUpdateDue: nextMonth.toISOString(),
    }
  }

  try {
    const data = fs.readFileSync(MONTHLY_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading monthly data:', error)
    // Return default data as fallback
    return getDefaultHistoricalData()
  }
}

/**
 * Saves monthly data to storage
 */
export function saveMonthlyData(storage: MonthlyDataStorage): void {
  // In serverless environments, we can't save to file system
  if (IS_SERVERLESS) {
    console.log('🔄 Serverless environment - skipping file save')
    return
  }

  ensureDataDir()

  try {
    storage.lastUpdated = new Date().toISOString()
    fs.writeFileSync(MONTHLY_FILE, JSON.stringify(storage, null, 2))
  } catch (error) {
    console.error('Error saving monthly data:', error)
    // Don't throw error in serverless environments
    if (!IS_SERVERLESS) {
      throw error
    }
  }
}

/**
 * Checks if we need to update data (only on 1st of the month)
 */
export function shouldUpdateData(): boolean {
  const now = new Date()
  const today = now.getDate()

  // Only update on the 1st of the month
  if (today !== 1) {
    return false
  }

  // In serverless environments, we can't persist data between calls
  // So we always return false to prevent unnecessary data fetching
  if (IS_SERVERLESS) {
    console.log('🔄 Serverless environment - using cached data')
    return false
  }

  const storage = loadMonthlyData()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Check if we already have data for this month
  const existingData = storage.data.find((d) => d.month === currentMonth)

  return !existingData
}

/**
 * Gets the current month's data or the most recent available
 */
export function getCurrentMonthData(): MonthlyDataPoint | null {
  // Run migration on first access (skip in serverless)
  if (!IS_SERVERLESS) {
    migrateHistoricalData()
  }

  const storage = loadMonthlyData()

  if (storage.data.length === 0) {
    return null
  }

  // Sort by date descending and return the most recent
  const sortedData = storage.data.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return sortedData[0]
}

/**
 * Adds a new monthly data point
 */
export function addMonthlyDataPoint(
  blsData: { count: number; source: 'live' | 'fallback' },
  fredData: {
    techEmployment: number
    jobOpenings?: number
    healthScore: number
  }
): MonthlyDataPoint {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const baseline = 1692100 // 2023 baseline

  const jobChange = blsData.count - baseline
  const percentChange = (jobChange / baseline) * 100

  let winner: 'Shawn' | 'Mark' | 'Tie' = 'Tie'
  if (jobChange > 0) {
    winner = 'Shawn'
  } else if (jobChange < 0) {
    winner = 'Mark'
  }

  const dataPoint: MonthlyDataPoint = {
    month: currentMonth,
    date: now.toISOString(),
    bls: blsData,
    fred: fredData,
    analysis: {
      jobChange,
      percentChange,
      winner,
      baseline,
    },
    timestamp: now.toISOString(),
  }

  // In serverless environments, we can't persist data
  // So we just return the data point without saving
  if (IS_SERVERLESS) {
    console.log(
      '🔄 Serverless environment - returning data point without saving'
    )
    return dataPoint
  }

  const storage = loadMonthlyData()

  // Remove existing data for this month if it exists
  storage.data = storage.data.filter((d) => d.month !== currentMonth)

  // Add new data point
  storage.data.push(dataPoint)

  // Sort by date
  storage.data.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Calculate next update due date (1st of next month)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  storage.nextUpdateDue = nextMonth.toISOString()

  // Save to storage
  saveMonthlyData(storage)

  console.log(`📅 Monthly data saved for ${currentMonth}`)
  return dataPoint
}

/**
 * Gets all historical monthly data
 */
export function getAllMonthlyData(): MonthlyDataPoint[] {
  // Run migration on first access (skip in serverless)
  if (!IS_SERVERLESS) {
    migrateHistoricalData()
  }

  const storage = loadMonthlyData()
  return storage.data.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}

/**
 * Gets data for chart display
 */
export function getChartData(): Array<{
  month: string
  date: string
  baseline: number
  actual: number
  jobChange: number
  percentChange: number
  winner: string
}> {
  const monthlyData = getAllMonthlyData()

  return monthlyData.map((point) => ({
    month: point.month,
    date: point.date,
    baseline: point.analysis.baseline,
    actual: point.bls.count,
    jobChange: point.analysis.jobChange,
    percentChange: point.analysis.percentChange,
    winner: point.analysis.winner,
  }))
}

/**
 * Gets summary statistics
 */
export function getDataSummary(): {
  totalMonths: number
  currentWinner: string
  avgMonthlyChange: number
  trendDirection: 'up' | 'down' | 'stable'
  nextUpdateDue: string
} {
  // Run migration on first access (skip in serverless)
  if (!IS_SERVERLESS) {
    migrateHistoricalData()
  }

  const storage = loadMonthlyData()
  const current = getCurrentMonthData()

  if (!current || storage.data.length === 0) {
    return {
      totalMonths: 0,
      currentWinner: 'No data',
      avgMonthlyChange: 0,
      trendDirection: 'stable',
      nextUpdateDue: storage.nextUpdateDue,
    }
  }

  const avgChange =
    storage.data.reduce((sum, point) => sum + point.analysis.jobChange, 0) /
    storage.data.length

  let trendDirection: 'up' | 'down' | 'stable' = 'stable'
  if (storage.data.length >= 2) {
    const recent = storage.data.slice(-3) // Last 3 months
    const firstRecent = recent[0]
    const lastRecent = recent[recent.length - 1]
    const trendChange =
      lastRecent.analysis.jobChange - firstRecent.analysis.jobChange

    if (trendChange > 5000) trendDirection = 'up'
    else if (trendChange < -5000) trendDirection = 'down'
  }

  return {
    totalMonths: storage.data.length,
    currentWinner: current.analysis.winner,
    avgMonthlyChange: Math.round(avgChange),
    trendDirection,
    nextUpdateDue: storage.nextUpdateDue,
  }
}

/**
 * Debug information
 */
export function debugMonthlyStorage() {
  const storage = loadMonthlyData()
  const current = getCurrentMonthData()
  const summary = getDataSummary()

  console.log('Monthly Storage Debug:', {
    environment: IS_SERVERLESS ? 'Serverless' : 'Local',
    fileExists: IS_SERVERLESS
      ? 'N/A (serverless)'
      : fs.existsSync(MONTHLY_FILE),
    dataPoints: storage.data.length,
    shouldUpdate: shouldUpdateData(),
    current: current
      ? `${current.month} - ${current.analysis.winner}`
      : 'No data',
    summary,
  })
}
