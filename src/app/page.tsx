'use client'
import React from 'react'

export default function Home() {
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState<null | {
    bls: { year: string; count: number; source?: string; note?: string } | null
    indeed: {
      count: number
      searchTerms: string
      location: string
      source?: string
    } | null
    errors: string[]
    fallbackUsed?: boolean
  }>(null)
  const [error, setError] = React.useState<string | null>(null)

  async function fetchJobCount() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/report', { method: 'GET' })
      const data = await res.json()
      if (data.ok) {
        setResult(data.data)
      } else {
        setError(data.error || 'Unknown error')
      }
    } catch (e: unknown) {
      let message = 'Unknown error'
      if (e instanceof Error) message = e.message
      else if (typeof e === 'string') message = e
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-white">
      <main className="w-full max-w-2xl space-y-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-center text-cyan-300 drop-shadow-lg">
          📊 Codepocalypse Tracker
        </h1>
        <p className="text-lg text-center text-cyan-100">
          Monitoring the long-term trend of software development job
          availability in the United States.
        </p>
        <div className="bg-white/5 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-2">The Bet</h2>
          <p>
            Shawn and Mark have a friendly bet:{' '}
            <b>
              Will there be more or fewer software development jobs five years
              from now?
            </b>
            <br />
            Shawn believes job numbers will grow despite AI advances; Mark
            believes they will decline. This app tracks the trend using public
            data and keeps both parties updated.
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-6 shadow-lg flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-4">
            Latest Software Developer Job Data
          </h2>
          <button
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded mb-4 disabled:opacity-60"
            onClick={fetchJobCount}
            disabled={loading}
          >
            {loading ? 'Fetching...' : 'Fetch Latest Data'}
          </button>
          {result && (
            <div className="mt-2 space-y-4 w-full">
              {result.bls && (
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <div className="text-sm text-cyan-200 mb-1">
                    BLS Employment Data
                    {result.bls.source === 'BLS Official Data (2023)' && (
                      <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">
                        Official Data
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-cyan-100">
                    {result.bls.count.toLocaleString()}
                  </div>
                  <div className="text-xs text-cyan-300">
                    Official Employment ({result.bls.year})
                    {result.bls.source && (
                      <div className="text-xs text-cyan-400 mt-1">
                        Source: {result.bls.source}
                      </div>
                    )}
                    {result.bls.note && (
                      <div className="text-xs text-cyan-400 mt-1 italic">
                        {result.bls.note}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {result.indeed && (
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <div className="text-sm text-cyan-200 mb-1">
                    {result.indeed.source === 'Alternative Sources'
                      ? 'Job Postings (Multiple Sources)'
                      : 'Indeed Job Postings'}
                    {result.fallbackUsed && (
                      <span className="ml-2 px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded">
                        Fallback Active
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-cyan-100">
                    {result.indeed.count.toLocaleString()}
                  </div>
                  <div className="text-xs text-cyan-300">
                    {result.indeed.source === 'Alternative Sources'
                      ? 'Aggregated from GitHub, Stack Overflow, USA Jobs, Remote OK'
                      : `Current Job Postings (${result.indeed.location})`}
                  </div>
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="bg-red-500/20 rounded-lg p-4">
                  <div className="text-sm text-red-200 mb-2">
                    Data Collection Errors:
                  </div>
                  {result.errors.map((error, index) => (
                    <div key={index} className="text-xs text-red-300">
                      {error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {error && <div className="mt-2 text-red-400">Error: {error}</div>}
        </div>
        <div className="text-xs text-cyan-300 text-center mt-8">
          Data sources:{' '}
          <a
            href="https://www.bls.gov/ooh/computer-and-information-technology/software-developers.htm"
            className="underline hover:text-cyan-100"
            target="_blank"
          >
            Bureau of Labor Statistics
          </a>
          {' and '}
          <a
            href="https://www.indeed.com/jobs?q=software+developer&l=United+States"
            className="underline hover:text-cyan-100"
            target="_blank"
          >
            Indeed Job Postings
          </a>
        </div>
      </main>
      <footer className="mt-12 text-cyan-200 text-xs text-center">
        Maintained by Shawn Beck &amp; Mark [Last Name] in collaboration with
        Windsurf.
        <br />
        <span className="opacity-60">Let the data decide. 🧠🦾📉📈</span>
      </footer>
    </div>
  )
}
