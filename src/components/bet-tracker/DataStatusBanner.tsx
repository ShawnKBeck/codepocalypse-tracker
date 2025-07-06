import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Database } from 'lucide-react'

interface Props {
  fromCache: boolean
  message?: string
  dataAge?: number
  nextUpdateDue?: string
  currentMonth: string
}

export default function DataStatusBanner({
  fromCache,
  message,
  dataAge,
  nextUpdateDue,
  currentMonth,
}: Props) {
  return (
    <Card className={`${fromCache ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'} shadow-lg`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">{fromCache ? 'Cached Data' : 'Fresh Data'}</p>
              <p className="text-sm text-blue-600">{message || `Data from ${currentMonth}`}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-600">{dataAge !== undefined ? `${dataAge} days old` : 'Current'}</p>
            <p className="text-xs text-blue-500">
              Next update: {nextUpdateDue ? new Date(nextUpdateDue).toLocaleDateString() : 'TBD'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
