import fs from 'fs'
import path from 'path'

export interface JobDataPoint {
  date: string
  count: number
  year?: string
  source: 'BLS' | 'Indeed'
  metadata?: Record<string, unknown>
}

export interface HistoricalData {
  bls: JobDataPoint[]
  indeed: JobDataPoint[]
  lastUpdated: string
}

const DATA_DIR = path.join(process.cwd(), 'data')
const DATA_FILE = path.join(DATA_DIR, 'job-counts.json')

/**
 * Ensures the data directory exists
 */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

/**
 * Loads historical data from the JSON file
 */
export function loadHistoricalData(): HistoricalData {
  ensureDataDir()

  if (!fs.existsSync(DATA_FILE)) {
    return {
      bls: [],
      indeed: [],
      lastUpdated: new Date().toISOString(),
    }
  }

  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading historical data:', error)
    return {
      bls: [],
      indeed: [],
      lastUpdated: new Date().toISOString(),
    }
  }
}

/**
 * Saves historical data to the JSON file
 */
export function saveHistoricalData(data: HistoricalData): void {
  ensureDataDir()

  try {
    data.lastUpdated = new Date().toISOString()
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error saving historical data:', error)
    throw error
  }
}

/**
 * Adds a new data point to the historical data
 */
export function addDataPoint(
  source: 'BLS' | 'Indeed',
  dataPoint: Omit<JobDataPoint, 'source'>
): void {
  const historicalData = loadHistoricalData()

  const newDataPoint: JobDataPoint = {
    ...dataPoint,
    source,
  }

  if (source === 'BLS') {
    historicalData.bls.push(newDataPoint)
    // Keep only the last 100 BLS entries (since it's annual data)
    historicalData.bls = historicalData.bls.slice(-100)
  } else {
    historicalData.indeed.push(newDataPoint)
    // Keep only the last 1000 Indeed entries (since it's more frequent)
    historicalData.indeed = historicalData.indeed.slice(-1000)
  }

  saveHistoricalData(historicalData)
}

/**
 * Gets the latest data point for a source
 */
export function getLatestDataPoint(
  source: 'BLS' | 'Indeed'
): JobDataPoint | null {
  const historicalData = loadHistoricalData()

  if (source === 'BLS') {
    return historicalData.bls.length > 0
      ? historicalData.bls[historicalData.bls.length - 1]
      : null
  } else {
    return historicalData.indeed.length > 0
      ? historicalData.indeed[historicalData.indeed.length - 1]
      : null
  }
}

/**
 * Gets data points for a specific date range
 */
export function getDataPointsInRange(
  source: 'BLS' | 'Indeed',
  startDate: string,
  endDate: string
): JobDataPoint[] {
  const historicalData = loadHistoricalData()
  const data = source === 'BLS' ? historicalData.bls : historicalData.indeed

  return data.filter((point) => {
    const pointDate = new Date(point.date)
    const start = new Date(startDate)
    const end = new Date(endDate)
    return pointDate >= start && pointDate <= end
  })
}

/**
 * Gets trending data for analysis
 */
export function getTrendingData(): {
  bls: {
    current: JobDataPoint | null
    previous: JobDataPoint | null
    trend: 'up' | 'down' | 'stable' | 'no-data'
  }
  indeed: {
    current: JobDataPoint | null
    previous: JobDataPoint | null
    trend: 'up' | 'down' | 'stable' | 'no-data'
  }
} {
  const historicalData = loadHistoricalData()

  const blsCurrent =
    historicalData.bls.length > 0
      ? historicalData.bls[historicalData.bls.length - 1]
      : null
  const blsPrevious =
    historicalData.bls.length > 1
      ? historicalData.bls[historicalData.bls.length - 2]
      : null

  const indeedCurrent =
    historicalData.indeed.length > 0
      ? historicalData.indeed[historicalData.indeed.length - 1]
      : null
  const indeedPrevious =
    historicalData.indeed.length > 1
      ? historicalData.indeed[historicalData.indeed.length - 2]
      : null

  const calculateTrend = (
    current: JobDataPoint | null,
    previous: JobDataPoint | null
  ) => {
    if (!current || !previous) return 'no-data'
    const diff = current.count - previous.count
    if (diff > 0) return 'up'
    if (diff < 0) return 'down'
    return 'stable'
  }

  return {
    bls: {
      current: blsCurrent,
      previous: blsPrevious,
      trend: calculateTrend(blsCurrent, blsPrevious),
    },
    indeed: {
      current: indeedCurrent,
      previous: indeedPrevious,
      trend: calculateTrend(indeedCurrent, indeedPrevious),
    },
  }
}

/**
 * Exports all data for backup or analysis
 */
export function exportAllData(): HistoricalData {
  return loadHistoricalData()
}
