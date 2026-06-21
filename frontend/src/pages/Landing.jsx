import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Hexagon, Clock, Trophy, Activity, Library, BarChart3, Target } from 'lucide-react'

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Library size={22} color="#00f5a0" />,
      bg: 'bg-green-400/10',
      title: 'Game Library',
      desc: 'Track every game you own — status, progress, achievements, and ratings in one organized grid.'
    },
    {
      icon: <Activity size={22} color="#00d9f5" />,
      bg: 'bg-cyan-400/10',
      title: 'Session Tracker',
      desc: 'Log K/D, wins, rank changes, and mood after every session. Watch your stats trend over time.'
    },
    {
      icon: <BarChart3 size={22} color="#a78bfa" />,
      bg: 'bg-purple-400/10',
      title: 'Dashboard Insights',
      desc: 'Total playtime, completion rate, genre breakdown — all pulled live from your own data.'
    },
    {
      icon: <Target size={22} color="#f9e020" />,
      bg: 'bg-yellow-400/10',
      title: 'Profile',
      desc: 'Your gaming identity — top rated games and a completion overview that keeps you honest.'
    }
  ]

  const tickerStats = [
    { label: 'K/D', value: '2.46', color: '#00d9f5' },
    { label: 'COMPLETION', value: '61%', color: '#00f5a0' },
    { label: 'ACHIEVEMENTS', value: '336', color: '#a78bfa' },
    { label: 'AVG RATING', value: '9.3', color: '#f9e020' }
  ]

  return (
    <div className="min-h-screen w-full bg-[#080c10] overflow-x-hidden">
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/[0.07]">
        <h1 className="font-bold bg-linear-to-r from-red-800 to-purple-800 bg-clip-text text-transparent text-2xl tracking-wider">
          路 KAIRO
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/signin')}
            className="body text-[13px] text-[#8a9bb0] hover:text-[#e8edf2] transition-all duration-200 px-3 py-1.5"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="body text-[13px] font-semibold text-black bg-linear-to-r from-purple-400 to-red-400 rounded-[7px] px-4 py-1.5 hover:-translate-y-0.5 hover:opacity-80 transition-all duration-200"
          >
            Get Started
          </button>
        </div>
      </nav>
      <section className="px-6 md:px-12 pt-16 md:pt-24 pb-16 max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center gap-6">
          <h1 className="font-bold text-4xl md:text-6xl tracking-normal leading-tight max-w-3xl">
            Your gaming life,<br />
            <span className="bg-linear-to-r from-[#00f5a0] to-[#00d9f5] bg-clip-text text-transparent">
              tracked properly.
            </span>
          </h1>
          <p className="body text-sm md:text-base text-[#8a9bb0] max-w-xl">
            Kairo replaces your scattered notes app, spreadsheet, and memory with one dashboard —
            every game, every session, every stat that actually matters.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => navigate('/signup')}
              className="font-bold tracking-wider text-black text-sm bg-linear-to-r from-purple-400 to-red-400 rounded-[8px] px-6 py-2.5 hover:-translate-y-0.5 hover:opacity-80 transition-all duration-200"
            >
              Start Tracking — It's Free
            </button>
            <button
              onClick={() => navigate('/signin')}
              className="body text-sm text-[#e8edf2] border border-white/15 rounded-[8px] px-6 py-2.5 hover:border-white/30 transition-all duration-200"
            >
              I have an account
            </button>
          </div>
        </div>
        <div className="mt-16 bg-[#111820] border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.07]">
            <span className="w-2 h-2 rounded-full bg-[#00f5a0] animate-pulse" />
            <span className="body text-[11px] text-[#8a9bb0] tracking-wide">LIVE FROM A KAIRO PROFILE</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-white/[0.07]">
            {tickerStats.map((s, i) => (
              <div key={i} className="px-5 py-5 flex flex-col gap-1">
                <span className="mono text-2xl md:text-3xl font-semibold" style={{ color: s.color }}>
                  {s.value}
                </span>
                <span className="body text-[10px] text-[#4a5568] tracking-widest">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="px-6 md:px-12 py-16 max-w-6xl mx-auto">
        <div className="flex flex-col gap-2 mb-10">
          <h2 className="font-bold text-2xl md:text-3xl tracking-normal">Everything your backlog needs</h2>
          <p className="body text-sm text-[#8a9bb0]">Four screens. Zero spreadsheets.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-[#111820] border border-white/[0.07] rounded-2xl p-6 flex flex-col gap-3 hover:border-white/[0.14] transition-all duration-200"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${f.bg}`}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="body text-[13px] text-[#8a9bb0] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="px-6 md:px-12 py-16 max-w-6xl mx-auto">
        <div className="bg-[#111820] border border-white/[0.07] rounded-2xl p-10 md:p-14 flex flex-col items-center text-center gap-5">
          <Hexagon size={32} color="#00f5a0" />
          <h2 className="font-bold text-2xl md:text-3xl tracking-normal max-w-md">
            Stop forgetting what you've played.
          </h2>
          <button
            onClick={() => navigate('/signup')}
            className="font-bold tracking-wider text-black text-sm bg-linear-to-r from-purple-400 to-red-400 rounded-[8px] px-6 py-2.5 hover:-translate-y-0.5 hover:opacity-80 transition-all duration-200"
          >
            Create Your Library
          </button>
        </div>
      </section>
      <footer className="px-6 md:px-12 py-6 border-t border-white/[0.07] flex flex-col md:flex-row items-center justify-between gap-3 max-w-6xl mx-auto">
        <h1 className="font-bold bg-linear-to-r from-red-800 to-purple-800 bg-clip-text text-transparent text-lg tracking-wider">
          路 KAIRO
        </h1>
        <p className="body text-[12px] text-[#4a5568]">Built by a dev who plays too much Sekiro.</p>
      </footer>
    </div>
  )
}

export default Landing