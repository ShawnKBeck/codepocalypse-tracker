export interface ChartDataPoint {
  month: string
  date: string
  baseline: number
  actual: number
  jobChange: number
  percentChange: number
  winner: string
}

export interface MonthlyDataPoint {
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

export interface BetSummary {
  totalMonths: number
  currentWinner: string
  avgMonthlyChange: number
  trendDirection: 'up' | 'down' | 'stable'
  nextUpdateDue: string
}
