import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
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

interface BetData {
  month: string
  date: string
  baseline: number
  actual: number | null
  fredTechEmployment?: number
  fredHealthScore?: number
}

interface BetTrackerProps {
  currentData?: {
    bls: number
    fred: {
      techEmployment: number
      healthScore: number
    }
  }
}

// Historical bet data with actual numbers only
const betData: BetData[] = [
  {
    month: 'Jun 2025',
    date: '2025-06-06',
    baseline: 1692.1,
    actual: 1692.1, // Starting baseline
    fredTechEmployment: 2431.2,
    fredHealthScore: 15,
  },
  {
    month: 'Jul 2025',
    date: '2025-07-06',
    baseline: 1692.1,
    actual: 1656.9, // Current actual data
    fredTechEmployment: 2431.2,
    fredHealthScore: 15,
  },
  {
    month: 'Aug 2025',
    date: '2025-08-06',
    baseline: 1692.1,
    actual: null,
  },
  {
    month: 'Sep 2025',
    date: '2025-09-06',
    baseline: 1692.1,
    actual: null,
  },
  {
    month: 'Oct 2025',
    date: '2025-10-06',
    baseline: 1692.1,
    actual: null,
  },
  {
    month: 'Nov 2025',
    date: '2025-11-06',
    baseline: 1692.1,
    actual: null,
  },
  {
    month: 'Dec 2025',
    date: '2025-12-06',
    baseline: 1692.1,
    actual: null,
  },
]

const chartConfig = {
  baseline: {
    label: 'Baseline (2023)',
    color: '#6b7280', // gray-500
  },
  actual: {
    label: 'Actual BLS Data',
    color: '#059669', // emerald-600
  },
}

export function BetTracker({ currentData }: BetTrackerProps) {
  // Update current data if provided
  const chartData = betData.map((item) => {
    if (item.month === 'Jul 2025' && currentData) {
      return {
        ...item,
        actual: currentData.bls / 1000, // Convert to thousands
        fredTechEmployment: currentData.fred.techEmployment,
        fredHealthScore: currentData.fred.healthScore,
      }
    }
    return item
  })

  const currentActual = chartData.find(
    (d) => d.actual !== null && d.month === 'Jul 2025'
  )?.actual
  const currentBaseline = 1692.1
  const jobChange = currentActual ? (currentActual - currentBaseline) * 1000 : 0
  const percentChange = currentActual
    ? ((currentActual - currentBaseline) / currentBaseline) * 100
    : 0

  const isJobsDecline = jobChange < 0
  const isJobsGrowth = jobChange > 0

  return (
    <div className="w-full space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">BLS Employment</CardTitle>
            <CardDescription>Software Developer Jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentActual
                ? (currentActual * 1000).toLocaleString()
                : 'Loading...'}
            </div>
            <p className="text-sm text-muted-foreground">Current Employment</p>
            <div
              className={`text-sm font-medium mt-2 ${isJobsDecline ? 'text-red-600' : isJobsGrowth ? 'text-green-600' : 'text-gray-600'}`}
            >
              {jobChange > 0 ? '+' : ''}
              {jobChange.toLocaleString()} ({percentChange.toFixed(1)}%)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">FRED Tech Employment</CardTitle>
            <CardDescription>Computer Systems Design</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentData?.fred.techEmployment.toLocaleString() || '2,431.2'}K
            </div>
            <p className="text-sm text-muted-foreground">Monthly Data</p>
            <div className="text-sm font-medium mt-2 text-red-600">
              Trending Down
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Economic Health</CardTitle>
            <CardDescription>FRED Composite Score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {currentData?.fred.healthScore || 15}/100
            </div>
            <p className="text-sm text-muted-foreground">Critical</p>
            <div className="text-sm font-medium mt-2 text-red-600">
              Tech sector declining
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Software Developer Employment Trend</CardTitle>
          <CardDescription>
            BLS Employment Data (June 2025 - December 2025)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[1600, 1750]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />

                {/* Baseline line */}
                <Line
                  type="monotone"
                  dataKey="baseline"
                  stroke={chartConfig.baseline.color}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4 }}
                  name="2023 Baseline"
                />

                {/* Actual data line */}
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke={chartConfig.actual.color}
                  strokeWidth={4}
                  dot={{ r: 8 }}
                  name="Current BLS Data"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Data Summary</CardTitle>
          <CardDescription>Key employment metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">BLS Employment Data</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>2023 Baseline:</span>
                  <span className="font-medium">1,692,100 jobs</span>
                </div>
                <div className="flex justify-between">
                  <span>Current (Jul 2025):</span>
                  <span
                    className={`font-medium ${isJobsDecline ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {currentActual
                      ? (currentActual * 1000).toLocaleString()
                      : 'Loading...'}{' '}
                    jobs
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Change:</span>
                  <span
                    className={`font-medium ${isJobsDecline ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {jobChange > 0 ? '+' : ''}
                    {jobChange.toLocaleString()} ({percentChange.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">FRED Economic Indicators</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Tech Employment:</span>
                  <span className="font-medium">
                    {currentData?.fred.techEmployment.toLocaleString() ||
                      '2,431.2'}
                    K
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Job Openings:</span>
                  <span className="font-medium text-red-600">
                    1,358 (Declining)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Health Score:</span>
                  <span className="font-medium text-red-600">
                    {currentData?.fred.healthScore || 15}/100 (Critical)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default BetTracker
