"use client";
import React from "react";

export default function Home() {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<null | { year: string, count: number }>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function fetchJobCount() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/report", { method: "GET" });
      const data = await res.json();
      if (data.ok) {
        setResult(data.data);
      } else {
        setError(data.error || "Unknown error");
      }
    } catch (e: unknown) {
      let message = 'Unknown error';
      if (e instanceof Error) message = e.message;
      else if (typeof e === 'string') message = e;
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-white">
      <main className="w-full max-w-2xl space-y-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-center text-cyan-300 drop-shadow-lg">📊 Codepocalypse Tracker</h1>
        <p className="text-lg text-center text-cyan-100">
          Monitoring the long-term trend of software development job availability in the United States.
        </p>
        <div className="bg-white/5 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-2">The Bet</h2>
          <p>
            Shawn and Mark have a friendly bet: <b>Will there be more or fewer software development jobs five years from now?</b><br/>
            Shawn believes job numbers will grow despite AI advances; Mark believes they will decline. This app tracks the trend using public data and keeps both parties updated.
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-6 shadow-lg flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-2">Latest BLS Software Developer Job Count</h2>
          <button
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded mb-4 disabled:opacity-60"
            onClick={fetchJobCount}
            disabled={loading}
          >
            {loading ? "Fetching..." : "Fetch Latest Data"}
          </button>
          {result && (
            <div className="mt-2 text-center">
              <div className="text-2xl font-bold">{result.count.toLocaleString()}</div>
              <div className="text-sm text-cyan-200">Employment ({result.year})</div>
            </div>
          )}
          {error && (
            <div className="mt-2 text-red-400">Error: {error}</div>
          )}
        </div>
        <div className="text-xs text-cyan-300 text-center mt-8">
          Data source: <a href="https://www.bls.gov/ooh/computer-and-information-technology/software-developers.htm" className="underline hover:text-cyan-100" target="_blank">Bureau of Labor Statistics</a>
        </div>
      </main>
      <footer className="mt-12 text-cyan-200 text-xs text-center">
        Maintained by Shawn Beck &amp; Mark [Last Name] in collaboration with Windsurf.<br/>
        <span className="opacity-60">Let the data decide. 🧠🦾📉📈</span>
      </footer>
    </div>
  );
}
