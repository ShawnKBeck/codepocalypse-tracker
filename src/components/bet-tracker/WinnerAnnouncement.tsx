import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { MonthlyDataPoint } from './types'

export default function WinnerAnnouncement({ current }: { current: MonthlyDataPoint }) {
  const formatNumber = (num: number) => num.toLocaleString()
  const isShawnWinning = current.analysis.winner === 'Shawn'
  const isMarkWinning = current.analysis.winner === 'Mark'

  return (
    <Card
      className={`${
        isShawnWinning
          ? 'bg-green-50 border-green-200'
          : isMarkWinning
            ? 'bg-red-50 border-red-200'
            : 'bg-gray-50 border-gray-200'
      } shadow-lg`}
    >
      <CardHeader>
        <CardTitle
          className={`text-xl ${
            isShawnWinning ? 'text-green-700' : isMarkWinning ? 'text-red-700' : 'text-gray-700'
          }`}
        >
          Current Winner: {current.analysis.winner}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold text-gray-900">
              {formatNumber(current.bls.count)}
            </div>
            <div className="text-sm text-gray-600">
              <div>Software Developer Jobs</div>
              <div className="font-medium">
                {current.analysis.jobChange >= 0 ? '+' : ''}
                {formatNumber(current.analysis.jobChange)} from baseline
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            {current.analysis.winner === 'Shawn' ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : current.analysis.winner === 'Mark' ? (
              <TrendingDown className="w-4 h-4 text-red-600" />
            ) : (
              <div className="w-4 h-4 bg-gray-400 rounded-full" />
            )}
            <span className="text-gray-600">
              {current.analysis.winner === 'Shawn'
                ? 'Jobs are growing - AI is creating opportunities'
                : current.analysis.winner === 'Mark'
                  ? 'Jobs are declining - AI automation impact'
                  : 'Market is stable - too close to call'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
