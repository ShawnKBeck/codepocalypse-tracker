import React from 'react'
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Bar,
  ComposedChart,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { TrendingUp, TrendingDown, Users, Database, Clock } from 'lucide-react'

interface ChartDataPoint {
  month: string
  date: string
  baseline: number
  actual: number
  jobChange: number
  percentChange: number
  winner: string
}

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

interface BetTrackerProps {
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
  dataAge?: number
  nextUpdateDue?: string
  message?: string
}

const chartConfig = {
  baseline: {
    label: 'Baseline (2023)',
    color: '#6b7280', // gray-500
  },
  actual: {
    label: 'Actual BLS Data',
    color: '#2563eb', // blue-600
  },
  jobChange: {
    label: 'Job Change',
    color: '#059669', // emerald-600 for positive, red-600 for negative
  },
}

function BetTracker({
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
              {message ||
                'Waiting for the first monthly data collection on the 1st of the month.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-yellow-700">
              <Clock className="w-4 h-4" />
              {nextUpdateDue && (
                <span>
                  Next update: {new Date(nextUpdateDue).toLocaleDateString()}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Determine winner styling
  const isShawnWinning = current.analysis.winner === 'Shawn'
  const isMarkWinning = current.analysis.winner === 'Mark'

  // Format numbers for display
  const formatNumber = (num: number) => num.toLocaleString()
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Prepare chart data for display (convert to thousands)
  const displayChartData = chartData.map((point) => ({
    ...point,
    actual: point.actual / 1000,
    baseline: point.baseline / 1000,
    jobChange: point.jobChange / 1000,
  }))

  return (
    <div className="w-full space-y-8">
      {/* Data Status Banner */}
      <Card
        className={`${fromCache ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'} shadow-lg`}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">
                  {fromCache ? 'Cached Data' : 'Fresh Data'}
                </p>
                <p className="text-sm text-blue-600">
                  {message || `Data from ${current.month}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-600">
                {dataAge !== undefined ? `${dataAge} days old` : 'Current'}
              </p>
              <p className="text-xs text-blue-500">
                Next update:{' '}
                {nextUpdateDue
                  ? new Date(nextUpdateDue).toLocaleDateString()
                  : 'TBD'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* The Bet Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          className={`${
            isShawnWinning
              ? 'border-green-200 bg-green-50 shadow-green-100'
              : 'border-gray-200 bg-white shadow-gray-100'
          } shadow-lg`}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              <CardTitle className="text-xl text-green-600">
                Shawn&apos;s Prediction
              </CardTitle>
              {isShawnWinning && (
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">
                  WINNING
                </span>
              )}
            </div>
            <CardDescription className="text-gray-600">
              AI will create more software developer jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              &quot;AI will create more software jobs than it eliminates. The
              demand for developers will continue growing.&quot;
            </p>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-green-600 font-medium">
                Predicts: Job Growth (+)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`${
            isMarkWinning
              ? 'border-red-200 bg-red-50 shadow-red-100'
              : 'border-gray-200 bg-white shadow-gray-100'
          } shadow-lg`}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-red-600" />
              <CardTitle className="text-xl text-red-600">
                Mark&apos;s Prediction
              </CardTitle>
              {isMarkWinning && (
                <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full font-medium">
                  WINNING
                </span>
              )}
            </div>
            <CardDescription className="text-gray-600">
              AI will reduce software developer jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              &quot;AI automation will reduce the need for human developers. The
              job market will contract significantly.&quot;
            </p>
            <div className="flex items-center gap-2 text-sm">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-red-600 font-medium">
                Predicts: Job Decline (-)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-gray-700">
              Current Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatNumber(current.bls.count)}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Software Developers (BLS)
            </p>
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
                current.analysis.jobChange >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
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
            <CardTitle className="text-lg text-gray-700">
              FRED Tech Employment
            </CardTitle>
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
            <CardTitle className="text-lg text-gray-700">
              Economic Health
            </CardTitle>
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

      {/* Winner Announcement */}
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
              isShawnWinning
                ? 'text-green-700'
                : isMarkWinning
                  ? 'text-red-700'
                  : 'text-gray-700'
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

      {/* Charts */}
      {chartData.length > 0 && (
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-gray-700">
              Job Market Trends
            </CardTitle>
            <CardDescription>
              Tracking software developer employment vs 2023 baseline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={displayChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    label={{
                      value: 'Jobs (thousands)',
                      angle: -90,
                      position: 'insideLeft',
                    }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="baseline"
                    stroke="#6b7280"
                    strokeDasharray="5 5"
                    name="2023 Baseline"
                    dot={{ fill: '#6b7280', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#2563eb"
                    strokeWidth={2}
                    name="Actual Jobs"
                    dot={{ fill: '#2563eb', r: 5 }}
                  />
                  <Bar
                    dataKey="jobChange"
                    fill="#059669"
                    name="Job Change"
                    opacity={0.7}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Data Summary */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-gray-700">
            Monthly Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {summary.totalMonths}
              </div>
              <p className="text-sm text-gray-500">Months of Data</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700">
                {formatNumber(summary.avgMonthlyChange)}
              </div>
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
                {summary.trendDirection === 'up'
                  ? '↗'
                  : summary.trendDirection === 'down'
                    ? '↘'
                    : '→'}
              </div>
              <p className="text-sm text-gray-500">Trend Direction</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">
              Data Collection Schedule
            </h4>
            <p className="text-sm text-gray-600">
              Data is automatically collected on the 1st of each month from BLS
              and FRED sources. Between updates, the app serves cached data for
              instant loading.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {formatDate(current.timestamp)} • Next update:{' '}
              {nextUpdateDue
                ? new Date(nextUpdateDue).toLocaleDateString()
                : 'TBD'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default BetTracker
