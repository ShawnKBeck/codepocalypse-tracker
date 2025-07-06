import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MonthlyDataPoint } from './types'

export default function StatsGrid({ current }: { current: MonthlyDataPoint }) {
  const formatNumber = (num: number) => num.toLocaleString()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="bg-white shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-gray-700">Current Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatNumber(current.bls.count)}
          </div>
          <p className="text-sm text-gray-500 mt-1">Software Developers (BLS)</p>
          <p className="text-xs text-gray-400 mt-1">
            Source: {current.bls.source === 'live' ? 'Live Data' : 'Fallback'}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-gray-700">Job Change</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              current.analysis.jobChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {current.analysis.jobChange >= 0 ? '+' : ''}
            {formatNumber(current.analysis.jobChange)}
          </div>
          <p className="text-sm text-gray-500 mt-1">vs 2023 Baseline</p>
          <p className="text-xs text-gray-400 mt-1">
            {current.analysis.percentChange >= 0 ? '+' : ''}
            {current.analysis.percentChange.toFixed(2)}%
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-gray-700">FRED Tech Employment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">
            {current.fred.techEmployment.toLocaleString()}K
          </div>
          <p className="text-sm text-gray-500 mt-1">Total Tech Workers</p>
          {current.fred.jobOpenings && (
            <p className="text-xs text-gray-400 mt-1">
              {current.fred.jobOpenings}K job openings
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-gray-700">Economic Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              current.fred.healthScore >= 70
                ? 'text-green-600'
                : current.fred.healthScore >= 40
                  ? 'text-yellow-600'
                  : 'text-red-600'
            }`}
          >
            {current.fred.healthScore}/100
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {current.fred.healthScore >= 70
              ? 'Healthy'
              : current.fred.healthScore >= 40
                ? 'Moderate'
                : 'Critical'}
          </p>
          <p className="text-xs text-gray-400 mt-1">FRED Composite Score</p>
        </CardContent>
      </Card>
    </div>
  )
}
