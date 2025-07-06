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
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartDataPoint } from './types'

const chartConfig = {
  baseline: { label: 'Baseline (2023)', color: '#6b7280' },
  actual: { label: 'Actual BLS Data', color: '#2563eb' },
  jobChange: { label: 'Job Change', color: '#059669' },
}

export default function JobMarketChart({ chartData }: { chartData: ChartDataPoint[] }) {
  if (chartData.length === 0) return null

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-gray-700">Job Market Trends</CardTitle>
        <CardDescription>
          Tracking software developer employment vs 2023 baseline
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
              <YAxis
                tick={{ fontSize: 12 }}
                label={{ value: 'Jobs (thousands)', angle: -90, position: 'insideLeft' }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line type="monotone" dataKey="baseline" stroke="#6b7280" strokeDasharray="5 5" name="2023 Baseline" dot={{ fill: '#6b7280', r: 4 }} />
              <Line type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={2} name="Actual Jobs" dot={{ fill: '#2563eb', r: 5 }} />
              <Bar dataKey="jobChange" fill="#059669" name="Job Change" opacity={0.7} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
