import React from 'react'
import {
  LineChart,
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
import { TrendingUp, TrendingDown, Users, Database } from 'lucide-react'

interface BetData {
  month: string
  date: string
  baseline: number
  actual: number | null
  fredTechEmployment?: number
  fredJobOpenings?: number
  fredHealthScore?: number
}

interface BetTrackerProps {
  currentData?: {
    bls: number
    fred: {
      techEmployment: number
      jobOpenings?: number
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
    fredJobOpenings: 1358,
    fredHealthScore: 15,
  },
  {
    month: 'Jul 2025',
    date: '2025-07-06',
    baseline: 1692.1,
    actual: 1656.9, // Current actual data
    fredTechEmployment: 2431.2,
    fredJobOpenings: 1358,
    fredHealthScore: 15,
  },
  {
    month: 'Aug 2025',
    date: '2025-08-06',
    baseline: 1692.1,
    actual: null,
    fredTechEmployment: undefined,
    fredJobOpenings: undefined,
    fredHealthScore: undefined,
  },
  {
    month: 'Sep 2025',
    date: '2025-09-06',
    baseline: 1692.1,
    actual: null,
    fredTechEmployment: undefined,
    fredJobOpenings: undefined,
    fredHealthScore: undefined,
  },
  {
    month: 'Oct 2025',
    date: '2025-10-06',
    baseline: 1692.1,
    actual: null,
    fredTechEmployment: undefined,
    fredJobOpenings: undefined,
    fredHealthScore: undefined,
  },
  {
    month: 'Nov 2025',
    date: '2025-11-06',
    baseline: 1692.1,
    actual: null,
    fredTechEmployment: undefined,
    fredJobOpenings: undefined,
    fredHealthScore: undefined,
  },
  {
    month: 'Dec 2025',
    date: '2025-12-06',
    baseline: 1692.1,
    actual: null,
    fredTechEmployment: undefined,
    fredJobOpenings: undefined,
    fredHealthScore: undefined,
  },
]

const chartConfig = {
  baseline: {
    label: 'Baseline (2023)',
    color: '#6b7280', // gray-500
  },
  actual: {
    label: 'Actual BLS Data',
    color: '#06b6d4', // cyan-500 (retro terminal color)
  },
  fredTechEmployment: {
    label: 'FRED Tech Employment',
    color: '#10b981', // emerald-500 (retro green)
  },
  fredJobOpenings: {
    label: 'Job Openings',
    color: '#f59e0b', // amber-500
  },
  fredHealthScore: {
    label: 'Economic Health',
    color: '#ef4444', // red-500 (warning color)
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
        fredJobOpenings: currentData.fred.jobOpenings || 1358,
        fredHealthScore: currentData.fred.healthScore,
      }
    }
    return item
  })

  // Create trend data (normalized to percentages for comparison)
  const trendData = chartData.map((item) => {
    if (item.actual && item.fredTechEmployment && item.fredHealthScore) {
      const blsChange = ((item.actual - item.baseline) / item.baseline) * 100
      const fredHealthChange = ((item.fredHealthScore - 50) / 50) * 100 // Normalize health score around 50

      return {
        month: item.month,
        blsTrend: blsChange,
        fredHealthTrend: fredHealthChange,
        combinedTrend: (blsChange + fredHealthChange) / 2,
      }
    }
    return {
      month: item.month,
      blsTrend: item.month === 'Jun 2025' ? 0 : null,
      fredHealthTrend: item.month === 'Jun 2025' ? -40 : null, // Health score 15 vs ideal 50
      combinedTrend: item.month === 'Jun 2025' ? -20 : null,
    }
  })

  const currentActual = chartData.find(
    (d) => d.actual !== null && d.month === 'Jul 2025'
  )?.actual
  const currentBaseline = 1692.1
  const jobChange = currentActual ? (currentActual - currentBaseline) * 1000 : 0
  const percentChange = currentActual
    ? ((currentActual - currentBaseline) / currentBaseline) * 100
    : 0

  // Determine winner based on data
  const isShawnWinning = percentChange > 0
  const economicHealth = currentData?.fred.healthScore || 15

  return (
    <div className="w-full space-y-6">
      {/* The Bet Status - Original Side-by-Side Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        <div
          className={`p-4 md:p-6 rounded-lg border-2 ${
            isShawnWinning
              ? 'bg-green-900/50 border-green-400 shadow-green-400/20'
              : 'bg-gray-800/50 border-gray-600'
          } shadow-lg`}
        >
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-6 md:w-8 h-6 md:h-8 text-green-400" />
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-green-400 font-mono retro-text">
                Shawn&apos;s Prediction
              </h3>
              <p className="text-sm text-gray-300 font-mono">
                More jobs in 5 years
              </p>
            </div>
          </div>
          <p className="text-gray-200 font-mono text-sm">
            &quot;AI will create more software jobs than it eliminates. The
            demand for developers will continue growing.&quot;
          </p>
          {isShawnWinning && (
            <div className="mt-3 text-green-400 font-bold animate-pulse font-mono retro-text">
              🏆 Currently Winning!
            </div>
          )}
        </div>

        <div
          className={`p-4 md:p-6 rounded-lg border-2 ${
            !isShawnWinning
              ? 'bg-red-900/50 border-red-400 shadow-red-400/20'
              : 'bg-gray-800/50 border-gray-600'
          } shadow-lg`}
        >
          <div className="flex items-center gap-3 mb-3">
            <TrendingDown className="w-6 md:w-8 h-6 md:h-8 text-red-400" />
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-red-400 font-mono retro-text">
                Mark&apos;s Prediction
              </h3>
              <p className="text-sm text-gray-300 font-mono">
                Fewer jobs in 5 years
              </p>
            </div>
          </div>
          <p className="text-gray-200 font-mono text-sm">
            &quot;AI automation will reduce the need for human developers. The
            job market will contract significantly.&quot;
          </p>
          {!isShawnWinning && (
            <div className="mt-3 text-red-400 font-bold animate-pulse font-mono retro-text">
              🏆 Currently Winning!
            </div>
          )}
        </div>
      </div>

      {/* Current Stats - Terminal Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-gray-900/80 p-4 md:p-6 rounded-lg border border-cyan-400/50 shadow-lg shadow-cyan-400/10">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-cyan-400" />
            <h3 className="text-lg font-semibold text-cyan-400 font-mono">
              BLS Total
            </h3>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-cyan-300 font-mono">
            {(currentData?.bls || 1656880).toLocaleString()}
          </p>
          <p className="text-sm text-gray-400 font-mono">Software Developers</p>
        </div>

        <div className="bg-gray-900/80 p-4 md:p-6 rounded-lg border border-emerald-400/50 shadow-lg shadow-emerald-400/10">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-6 h-6 text-emerald-400" />
            <h3 className="text-lg font-semibold text-emerald-400 font-mono">
              FRED Tech
            </h3>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-emerald-300 font-mono">
            {(currentData?.fred.techEmployment || 2431.2).toFixed(1)}K
          </p>
          <p className="text-sm text-gray-400 font-mono">Tech Employment</p>
        </div>

        <div className="bg-gray-900/80 p-4 md:p-6 rounded-lg border border-yellow-400/50 shadow-lg shadow-yellow-400/10">
          <div className="flex items-center gap-3 mb-2">
            {percentChange > 0 ? (
              <TrendingUp className="w-6 h-6 text-green-400" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-400" />
            )}
            <h3 className="text-lg font-semibold text-yellow-400 font-mono">
              BLS Trend
            </h3>
          </div>
          <p
            className={`text-2xl md:text-3xl font-bold font-mono ${percentChange > 0 ? 'text-green-400' : 'text-red-400'}`}
          >
            {percentChange > 0 ? '+' : ''}
            {percentChange.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-400 font-mono">
            Change from baseline
          </p>
        </div>

        <div className="bg-gray-900/80 p-4 md:p-6 rounded-lg border border-red-400/50 shadow-lg shadow-red-400/10">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="w-6 h-6 text-red-400" />
            <h3 className="text-lg font-semibold text-red-400 font-mono">
              Economy
            </h3>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-red-400 font-mono">
            {economicHealth}/100
          </p>
          <p className="text-sm text-gray-400 font-mono">
            Health Score (Critical)
          </p>
        </div>
      </div>

      {/* Dual Data Analysis Report - Terminal Style */}
      <div className="bg-gray-900/80 p-4 md:p-6 rounded-lg border border-cyan-400/50 shadow-lg shadow-cyan-400/10 mb-6 md:mb-8">
        <h3 className="text-xl md:text-2xl font-bold mb-4 text-cyan-400 font-mono retro-text">
          📊 DUAL DATA ANALYSIS REPORT
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold text-green-400 mb-3 font-mono">
              📍 BLS DATA (QUARTERLY)
            </h4>
            <div className="space-y-2 text-sm text-gray-300 font-mono">
              <p>
                <span className="text-cyan-400">CURRENT COUNT:</span>{' '}
                {(currentData?.bls || 1656880).toLocaleString()} developers
              </p>
              <p>
                <span className="text-cyan-400">CHANGE:</span>{' '}
                {jobChange > 0 ? '+' : ''}
                {jobChange.toLocaleString()} jobs ({percentChange.toFixed(1)}%)
              </p>
              <p>
                <span className="text-cyan-400">TREND:</span>{' '}
                {percentChange > 0 ? 'GROWTH TRAJECTORY' : 'DECLINING TREND'}
              </p>
              <p>
                <span className="text-cyan-400">OUTLOOK:</span>{' '}
                {percentChange > 0 ? 'SUPPORTS SHAWN' : 'SUPPORTS MARK'}
              </p>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-red-400 mb-3 font-mono">
              ⚠️ FRED DATA (MONTHLY)
            </h4>
            <div className="space-y-2 text-sm text-gray-300 font-mono">
              <p>
                <span className="text-cyan-400">TECH SECTOR:</span>{' '}
                {(currentData?.fred.techEmployment || 2431.2).toFixed(1)}K
                workers
              </p>
              <p>
                <span className="text-cyan-400">HEALTH SCORE:</span>{' '}
                {economicHealth}/100 (CRITICAL)
              </p>
              <p>
                <span className="text-cyan-400">STATUS:</span> ECONOMIC STRESS
                DETECTED
              </p>
              <p>
                <span className="text-cyan-400">SIGNAL:</span> WARNING
                INDICATORS ACTIVE
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-600 rounded font-mono">
          <p className="text-yellow-200 font-medium text-sm">
            ⚠️ <span className="text-yellow-400">SYSTEM ALERT:</span> BLS shows{' '}
            {percentChange > 0 ? 'growth' : 'decline'}(
            {percentChange.toFixed(1)}%) while FRED economic health remains
            critical ({economicHealth}/100). Monitoring both data streams for
            convergence patterns. Current status:{' '}
            <span
              className={percentChange > 0 ? 'text-green-400' : 'text-red-400'}
            >
              {percentChange > 0 ? 'SHAWN AHEAD' : 'MARK AHEAD'}
            </span>
          </p>
        </div>
      </div>

      {/* Charts with retro styling */}
      <Card className="bg-gray-900/80 border-cyan-400/50 shadow-lg shadow-cyan-400/10">
        <CardHeader>
          <CardTitle className="text-cyan-400 font-mono retro-text">
            🤖 CODEPOCALYPSE TRACKER
          </CardTitle>
          <CardDescription className="text-gray-300 font-mono">
            Software Developer Job Decline - Real-Time Government Data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="month"
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontFamily: 'monospace' }}
                />
                <YAxis
                  domain={[1600, 1750]}
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontFamily: 'monospace' }}
                />
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
                  name="Live BLS Data"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* FRED Economic Indicators Chart */}
      <Card className="bg-gray-900/80 border-emerald-400/50 shadow-lg shadow-emerald-400/10">
        <CardHeader>
          <CardTitle className="text-emerald-400 font-mono retro-text">
            📡 ECONOMIC WARNING SIGNALS
          </CardTitle>
          <CardDescription className="text-gray-300 font-mono">
            Federal Reserve Data - Economic Health Monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="month"
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontFamily: 'monospace' }}
                />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  domain={[0, 3000]}
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontFamily: 'monospace' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontFamily: 'monospace' }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />

                <Bar
                  yAxisId="left"
                  dataKey="fredTechEmployment"
                  fill={chartConfig.fredTechEmployment.color}
                  name="Tech Employment (K)"
                />

                <Bar
                  yAxisId="left"
                  dataKey="fredJobOpenings"
                  fill={chartConfig.fredJobOpenings.color}
                  name="Job Openings"
                />

                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="fredHealthScore"
                  stroke={chartConfig.fredHealthScore.color}
                  strokeWidth={3}
                  dot={{ r: 6 }}
                  name="Economic Health Score"
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Combined Trends Chart */}
      <Card className="bg-gray-900/80 border-purple-400/50 shadow-lg shadow-purple-400/10">
        <CardHeader>
          <CardTitle className="text-purple-400 font-mono retro-text">
            🔮 THE CONVERGENCE
          </CardTitle>
          <CardDescription className="text-gray-300 font-mono">
            All Economic Indicators - Trend Analysis Matrix
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="month"
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontFamily: 'monospace' }}
                />
                <YAxis
                  domain={[-50, 10]}
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontFamily: 'monospace' }}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value: unknown, name: string) => [
                    typeof value === 'number' ? `${value.toFixed(1)}%` : 'N/A',
                    name,
                  ]}
                />
                <Legend />

                <Line
                  type="monotone"
                  dataKey="blsTrend"
                  stroke={chartConfig.actual.color}
                  strokeWidth={3}
                  dot={{ r: 6 }}
                  name="Jobs Trend"
                  connectNulls={false}
                />

                <Line
                  type="monotone"
                  dataKey="fredHealthTrend"
                  stroke={chartConfig.fredHealthScore.color}
                  strokeWidth={3}
                  dot={{ r: 6 }}
                  name="Economic Health Crisis"
                  connectNulls={false}
                />

                <Line
                  type="monotone"
                  dataKey="combinedTrend"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="8 4"
                  dot={{ r: 4 }}
                  name="Codepocalypse Index"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* The Verdict - Terminal Style */}
      <div className="bg-gray-900/80 p-4 md:p-6 rounded-lg border border-cyan-400/50 shadow-lg shadow-cyan-400/10">
        <h3 className="text-xl md:text-2xl font-bold mb-4 text-cyan-400 font-mono retro-text">
          ⚖️ THE VERDICT
        </h3>
        <p className="text-center text-gray-300 mb-6 font-mono">
          Real-time government data analysis • 5-year bet tracking initiated
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4
              className={`font-semibold mb-2 font-mono ${isShawnWinning ? 'text-green-400' : 'text-gray-500'}`}
            >
              SHAWN&apos;S PREDICTION: {isShawnWinning ? '✓ AHEAD' : '✗ BEHIND'}
            </h4>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">STARTING POINT:</span>
                <span className="text-cyan-300">1,692,100 jobs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">CURRENT REALITY:</span>
                <span
                  className={`font-medium ${isShawnWinning ? 'text-green-400' : 'text-red-400'}`}
                >
                  {(currentData?.bls || 1656880).toLocaleString()} jobs
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">NET CHANGE:</span>
                <span
                  className={`font-medium ${isShawnWinning ? 'text-green-400' : 'text-red-400'}`}
                >
                  {jobChange > 0 ? '+' : ''}
                  {Math.abs(jobChange).toLocaleString()} (
                  {Math.abs(percentChange).toFixed(1)}%{' '}
                  {jobChange > 0 ? 'growth' : 'decline'})
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4
              className={`font-semibold mb-2 font-mono ${!isShawnWinning ? 'text-red-400' : 'text-gray-500'}`}
            >
              MARK&apos;S PREDICTION: {!isShawnWinning ? '✓ AHEAD' : '✗ BEHIND'}
            </h4>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">ECONOMIC HEALTH:</span>
                <span className="text-red-400">
                  {economicHealth}/100 (CRITICAL)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">TECH SECTOR:</span>
                <span className="text-red-400">
                  {(currentData?.fred.techEmployment || 2431.2).toFixed(1)}K
                  (STRESSED)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">AI IMPACT:</span>
                <span className="text-red-400">MONITORING</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">TREND SIGNAL:</span>
                <span className="text-yellow-400">WARNING ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BetTracker
