'use client'

import { useState, useEffect } from 'react'
import BetTracker from '@/components/BetTracker'

// Retro CSS effects from original
const retroStyles = `
  @keyframes scanlines {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  
  @keyframes flicker {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes typewriter {
    from { width: 0; }
    to { width: 100%; }
  }
  
  @keyframes blink {
    50% { border-color: transparent; }
  }
  
  .retro-text {
    text-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor;
  }
  
  .fade-in-up {
    animation: fadeInUp 1s ease-out forwards;
  }
  
  .fade-in-scale {
    animation: fadeInScale 0.8s ease-out forwards;
  }
  
  .typewriter {
    overflow: hidden;
    border-right: 3px solid;
    white-space: nowrap;
    animation: blink 1s step-end infinite;
  }
`

interface BetData {
  bls: number | null
  fred: {
    techEmployment: number
    healthScore: number
  } | null
  winner: string | null
  jobChange: number
  percentChange: number
}

export default function Home() {
  const [betData, setBetData] = useState<BetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardStep, setDashboardStep] = useState(0)
  const [typewriterText, setTypewriterText] = useState('')
  const [lastUpdated] = useState(new Date())

  // Inject retro styles
  useEffect(() => {
    const styleSheet = document.createElement('style')
    styleSheet.innerText = retroStyles
    document.head.appendChild(styleSheet)

    return () => {
      document.head.removeChild(styleSheet)
    }
  }, [])

  // Progressive dashboard loading with typewriter effect
  useEffect(() => {
    if (loading) return

    // Typewriter effect for main title
    const titleText = '📊 CODEPOCALYPSE TRACKER'
    let currentIndex = 0

    const typeInterval = setInterval(() => {
      setTypewriterText(titleText.slice(0, currentIndex + 1))
      currentIndex++

      if (currentIndex >= titleText.length) {
        clearInterval(typeInterval)
      }
    }, 100)

    // Progressive loading of dashboard sections
    const dashboardTimeline = [
      { step: 0, delay: 0 }, // Start typewriter
      { step: 1, delay: 2000 }, // Subtitle fade-in
      { step: 2, delay: 3000 }, // Components fade-in
    ]

    dashboardTimeline.forEach(({ step, delay }) => {
      setTimeout(() => setDashboardStep(step), delay)
    })

    return () => clearInterval(typeInterval)
  }, [loading])

  useEffect(() => {
    async function fetchBetData() {
      try {
        const response = await fetch('/api/bet-tracker')
        const data = await response.json()

        if (data.ok) {
          setBetData(data.betData)
        } else {
          setError(data.error || 'Failed to fetch bet data')
        }
      } catch (err) {
        setError('Failed to connect to API')
        console.error('Error fetching bet data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBetData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-cyan-400 text-xl font-mono">
            Establishing connection...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4 retro-text">
            ⚠️ SYSTEM ERROR
          </div>
          <p className="text-cyan-300 font-mono">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all duration-200 font-mono retro-text"
          >
            [R] RETRY CONNECTION
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Static/TV noise background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="w-full h-full bg-repeat"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
            backgroundSize: '128px 128px',
            animation: 'scanlines 4s linear infinite',
          }}
        ></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1
            className={`text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent retro-text ${typewriterText.length < 24 ? 'typewriter' : ''}`}
          >
            {typewriterText || ' '}
          </h1>
          {dashboardStep >= 1 && (
            <div className="fade-in-up">
              <p className="text-lg md:text-xl text-cyan-300 font-mono retro-text">
                Monitoring the Great Software Job Debate of 2025-2030
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-gray-300 font-mono">
                <span className="text-green-400">●</span>
                <span className="text-sm">
                  SYSTEM STATUS: ONLINE | LAST SYNC:{' '}
                  {lastUpdated.toLocaleString()}
                </span>
              </div>

              {/* ASCII Art Frame */}
              <div className="mt-6 text-xs text-cyan-600 leading-tight font-mono">
                <div>╔════════════════════════════════════════╗</div>
                <div>║ 🚀 AI vs HUMANS: THE FINAL CODE 🚀 ║</div>
                <div>╚════════════════════════════════════════╝</div>
              </div>
            </div>
          )}
        </div>

        {/* Main Dashboard */}
        {dashboardStep >= 2 && (
          <div className="fade-in-scale">
            <BetTracker
              currentData={
                betData
                  ? {
                      bls: betData.bls || 1656880,
                      fred: betData.fred || {
                        techEmployment: 2431.2,
                        healthScore: 15,
                      },
                    }
                  : undefined
              }
            />
          </div>
        )}

        {/* Retro Footer */}
        {dashboardStep >= 2 && (
          <div className="text-center mt-8 text-cyan-400 text-sm font-mono fade-in-up retro-text">
            <div className="border-2 border-cyan-400 bg-black/50 p-4 mx-auto max-w-2xl">
              <p>🧠🦾 LET THE DATA DECIDE 📉📈</p>
              <p className="text-xs mt-2 text-green-400">
                [GOVERNMENT DATA STREAMS ACTIVE] | [REAL-TIME TRACKING ENABLED]
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
