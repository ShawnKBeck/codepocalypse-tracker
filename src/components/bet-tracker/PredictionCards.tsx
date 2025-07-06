import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, TrendingDown } from 'lucide-react'

interface Props {
  isShawnWinning: boolean
  isMarkWinning: boolean
}

export default function PredictionCards({ isShawnWinning, isMarkWinning }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card
        className={`${
          isShawnWinning ? 'border-green-200 bg-green-50 shadow-green-100' : 'border-gray-200 bg-white shadow-gray-100'
        } shadow-lg`}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            <CardTitle className="text-xl text-green-600">Shawn&apos;s Prediction</CardTitle>
            {isShawnWinning && (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">
                WINNING
              </span>
            )}
          </div>
          <CardDescription className="text-gray-600">AI will create more software developer jobs</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 text-sm leading-relaxed mb-4">
            &quot;AI will create more software jobs than it eliminates. The demand for developers will continue growing.&quot;
          </p>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-green-600 font-medium">Predicts: Job Growth (+)</span>
          </div>
        </CardContent>
      </Card>

      <Card
        className={`${
          isMarkWinning ? 'border-red-200 bg-red-50 shadow-red-100' : 'border-gray-200 bg-white shadow-gray-100'
        } shadow-lg`}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-red-600" />
            <CardTitle className="text-xl text-red-600">Mark&apos;s Prediction</CardTitle>
            {isMarkWinning && (
              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full font-medium">
                WINNING
              </span>
            )}
          </div>
          <CardDescription className="text-gray-600">AI will reduce software developer jobs</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 text-sm leading-relaxed mb-4">
            &quot;AI automation will reduce the need for human developers. The job market will contract significantly.&quot;
          </p>
          <div className="flex items-center gap-2 text-sm">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <span className="text-red-600 font-medium">Predicts: Job Decline (-)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
