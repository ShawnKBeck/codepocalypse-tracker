import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MonthlyDataPoint, BetSummary } from './types'

function formatNumber(num: number) {
  return num.toLocaleString()
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

interface Props {
  summary: BetSummary
  current: MonthlyDataPoint
  nextUpdateDue?: string
}

export default function MonthlySummary({ summary, current, nextUpdateDue }: Props) {
  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-gray-700">Monthly Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.totalMonths}</div>
            <p className="text-sm text-gray-500">Months of Data</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">{formatNumber(summary.avgMonthlyChange)}</div>
            <p className="text-sm text-gray-500">Avg Monthly Change</p>
          </div>
          <div className="text-center">
            <div
              className={`text-2xl font-bold ${
                summary.trendDirection === 'up'
                  ? 'text-green-600'
                  : summary.trendDirection === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`}
            >
              {summary.trendDirection === 'up' ? '↗' : summary.trendDirection === 'down' ? '↘' : '→'}
            </div>
            <p className="text-sm text-gray-500">Trend Direction</p>
          </div>
        </div>
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Data Collection Schedule</h4>
          <p className="text-sm text-gray-600">
            Data is automatically collected on the 1st of each month from BLS and FRED sources. Between updates, the app serves cached data for instant loading.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {formatDate(current.timestamp)} • Next update: {nextUpdateDue ? new Date(nextUpdateDue).toLocaleDateString() : 'TBD'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
