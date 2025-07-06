import React from 'react'
import type { ChartDataPoint, MonthlyDataPoint, BetSummary } from './bet-tracker/types'
import DataStatusBanner from './bet-tracker/DataStatusBanner'
import PredictionCards from './bet-tracker/PredictionCards'
import StatsGrid from './bet-tracker/StatsGrid'
import WinnerAnnouncement from './bet-tracker/WinnerAnnouncement'
import JobMarketChart from './bet-tracker/JobMarketChart'
import MonthlySummary from './bet-tracker/MonthlySummary'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'

export interface BetTrackerProps {
  current: MonthlyDataPoint | null
  summary: BetSummary
  chartData: ChartDataPoint[]
  fromCache: boolean
  dataAge?: number
  nextUpdateDue?: string
  message?: string
}

export default function BetTracker({
  current,
  summary,
  chartData,
  fromCache,
  dataAge,
  nextUpdateDue,
  message,
}: BetTrackerProps) {
  if (!current) {
    return (
      <div className="w-full space-y-8">
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">No Data Available</CardTitle>
            <CardDescription className="text-yellow-600">
              {message || 'Waiting for the first monthly data collection on the 1st of the month.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-yellow-700">
              <Clock className="w-4 h-4" />
              {nextUpdateDue && <span>Next update: {new Date(nextUpdateDue).toLocaleDateString()}</span>}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isShawnWinning = current.analysis.winner === 'Shawn'
  const isMarkWinning = current.analysis.winner === 'Mark'

  const displayChartData = chartData.map((p) => ({
    ...p,
    actual: p.actual / 1000,
    baseline: p.baseline / 1000,
    jobChange: p.jobChange / 1000,
  }))

  return (
    <div className="w-full space-y-8">
      <DataStatusBanner
        fromCache={fromCache}
        message={message}
        dataAge={dataAge}
        nextUpdateDue={nextUpdateDue}
        currentMonth={current.month}
      />

      <PredictionCards isShawnWinning={isShawnWinning} isMarkWinning={isMarkWinning} />

      <StatsGrid current={current} />

      <WinnerAnnouncement current={current} />

      <JobMarketChart chartData={displayChartData} />

      <MonthlySummary summary={summary} current={current} nextUpdateDue={nextUpdateDue} />
    </div>
  )
}
