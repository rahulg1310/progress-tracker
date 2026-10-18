import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Gamepad2, Timer, CalendarDays, Database, Sparkles, LoaderCircle } from 'lucide-react'
import { AiData } from '../context/AiContext'
import ProfileStatsCard from './ProfileStatsCard'
import PlaytimeChart from './PlaytimeChart'
import TopByPlaytime from './TopByPlaytime'
import { formatMinutes } from '../utils/formatTime'

const deltaText = (current, previous, format, unit) => {
  const diff = current - previous;
  if (diff === 0) return `Same as last ${unit}`;
  return `${diff > 0 ? '+' : '-'}${format(Math.abs(diff))} vs last ${unit}`;
}

const InsightsContent = () => {
  const navigate = useNavigate();
  const {insights, aiLoading, aiError} = useContext(AiData);
  const [period, setPeriod] = useState('week');

  if(aiLoading || !insights){
    return (
      <div className='w-full h-full flex flex-col justify-center items-center gap-3 py-24'>
        {aiError ? (
          <p className='body text-sm text-red-300'>{aiError}</p>
        ) : (
          <>
            <LoaderCircle className='animate-spin' size={22} color='#8a9bb0'/>
            <p className='body text-[13px] text-[#4a5568]'>Crunching your session data...</p>
          </>
        )}
      </div>
    )
  }

  const data = insights[period];
  const asNumber = (value)=>String(value);

  const insight_stats = [
    {
      num : formatMinutes(data.totalMinutes),
      title : 'Total Playtime',
      stats : deltaText(data.totalMinutes, data.prevTotalMinutes, formatMinutes, data.unit),
      icon : <Clock size={20} color='#5fc9ec'/>,
      color1 : 'bg-blue-400/15'
    },
    {
      num : data.sessions,
      title : 'Sessions',
      stats : deltaText(data.sessions, data.prevSessions, asNumber, data.unit),
      icon : <Gamepad2 size={20} color='#47b60c'/>,
      color1 : 'bg-green-400/15'
    },
    {
      num : formatMinutes(data.avgSessionMinutes),
      title : 'Avg Session',
      stats : deltaText(data.avgSessionMinutes, data.prevAvgSessionMinutes, formatMinutes, data.unit),
      icon : <Timer size={20} color='#e7b427'/>,
      color1 : 'bg-orange-500/15'
    },
    {
      num : data.activeDays,
      title : 'Active Days',
      stats : deltaText(data.activeDays, data.prevActiveDays, asNumber, data.unit),
      icon : <CalendarDays size={20} color='#d127e7'/>,
      color1 : 'bg-purple-700/15'
    }
  ]

  const goalPct = data.goal ? Math.min(100, Math.round((data.goal.current/data.goal.target)*100)) : 0;
  const goalLeft = data.goal ? Math.max(0, data.goal.target-data.goal.current) : 0;

  const top_games = data.topGames.map(function(elem){
    return {
      name : elem.title,
      progress : data.totalMinutes===0 ? '0%' : `${Math.round((elem.minutes/data.totalMinutes)*100)}%`,
      color : elem.color,
      hours : formatMinutes(elem.minutes)
    }
  })

  return (
    <div className='w-full py-5 px-8 md:px-12 flex flex-col gap-6'>
      <div className='w-full flex flex-col md:flex-row md:justify-between md:items-center gap-4'>
        <div className='flex flex-col'>
          <h1 className='font-bold text-4xl tracking-wider'>Progress Insights</h1>
          <h4 className='body text-[13px] text-[#8a9bb0]'>{data.title} · <span className='mono text-[#00f5a0]'>{data.range}</span></h4>
        </div>
        <div className='flex gap-2'>
          <button
          onClick={()=>{
            setPeriod('week');
          }}
          className={`button_border text-[14px] rounded-full px-3 py-0.5 border hover:bg-gray-700 transition-all duration-200 ${
            'week'===period ? 'border-cyan-400 text-cyan-400' : 'border-white/25 text-white'
          }`}>Weekly</button>
          <button
          onClick={()=>{
            setPeriod('month');
          }}
          className={`button_border text-[14px] rounded-full px-3 py-0.5 border hover:bg-gray-700 transition-all duration-200 ${
            'month'===period ? 'border-cyan-400 text-cyan-400' : 'border-white/25 text-white'
          }`}>Monthly</button>
        </div>
      </div>

      <div className='flex flex-wrap gap-4 w-full'>
        {insight_stats.map(function(elem,idx){
          return <ProfileStatsCard key={idx} num={elem.num} title={elem.title} stats={elem.stats} icon={elem.icon} color1={elem.color1} />
        })}
      </div>

      <div className='flex flex-col xl:flex-row gap-4 min-w-0'>
        <div className='flex-1 min-w-0 bg-[#111620] py-4 px-6 rounded-2xl border border-gray-400/15 flex flex-col gap-4'>
          <div className='flex justify-between items-center'>
            <h1 className='font-bold text-[#8a9bb0] tracking-wider'>{period==='week' ? 'DAILY PLAYTIME' : 'WEEKLY PLAYTIME'}</h1>
            <span className='text-[11px] bg-gray-400/15 rounded-2xl px-2 py-1 text-gray-500 tracking-wider'>{formatMinutes(data.totalMinutes)} total</span>
          </div>
          <PlaytimeChart data={data.chart} />
        </div>
        <div className='w-full xl:w-[320px] bg-[#111620] py-6 px-6 rounded-2xl border border-gray-400/15 flex flex-col gap-5 items-center'>
          <h1 className='self-start font-bold tracking-wider text-[#8a9bb0]'>GOAL PROGRESS</h1>
          {data.goal ? (
            <>
              <div className='h-32 w-32 rounded-full flex items-center justify-center'
              style={{background : `conic-gradient(#00f5a0 ${goalPct}%,#1a2332 0)`}}>
                <div className='w-28 h-28 rounded-full bg-[#111620] flex flex-col items-center justify-center'>
                  <span className='font-bold text-3xl text-[#00f5a0]'>{goalPct}%</span>
                  <span className='body text-[11px] text-[#4a5568]'>{data.goal.title}</span>
                </div>
              </div>
              <p className='body text-[13px] text-[#8a9bb0] text-center'>
                <span className='mono text-white'>{formatMinutes(data.goal.current)}</span> of <span className='mono text-white'>{formatMinutes(data.goal.target)}</span>
                {goalLeft>0 ? <> · {formatMinutes(goalLeft)} to go</> : <> · goal reached</>}
              </p>
            </>
          ) : (
            <div className='flex-1 flex flex-col justify-center items-center text-center gap-3'>
              <p className='body text-[13px] text-[#8a9bb0]'>{period==='week' ? 'Set a weekly playtime goal to track it here.' : 'Monthly view has no goal. Switch to Weekly to see your goal.'}</p>
              {period==='week' && (
                <button
                onClick={()=>{
                  navigate('/goals');
                }}
                className='button_border border border-white/15 rounded-[7px] px-3 py-1 hover:bg-gray-700 transition-all duration-200 text-[#8a9bb0]'>Set a goal</button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className='w-full bg-[#111620] py-5 px-6 rounded-2xl border border-gray-400/15 flex flex-col gap-4'>
        <div className='flex flex-col md:flex-row md:justify-between md:items-center gap-3'>
          <div className='flex items-center gap-2'>
            <Sparkles size={16} color='#00f5a0'/>
            <h1 className='font-bold text-[#8a9bb0] tracking-wider'>COACH ANALYSIS</h1>
          </div>
          <button
          onClick={()=>{
            navigate('/coach', {state : {prompt : `Explain my progress ${period==='week' ? 'this week' : 'this month'} and how I can improve`}});
          }}
          className='button_border w-fit border border-white/15 rounded-[7px] px-3 py-1 hover:bg-gray-700 transition-all duration-200 text-[#8a9bb0]'>Ask Coach about this</button>
        </div>
        <ul className='flex flex-col gap-2'>
          {data.summary.map(function(elem,idx){
            return (
              <li key={idx} className='body text-[14px] flex gap-3'>
                <span className='mt-2 w-1.5 h-1.5 rounded-full bg-[#00f5a0] shrink-0'></span>
                <span>{elem}</span>
              </li>
            )
          })}
        </ul>
        <span className='body text-[11px] text-[#4a5568] flex items-center gap-1.5 border-t border-t-gray-600/40 pt-3'><Database size={12} className='shrink-0'/>{data.basedOn} Numbers are calculated from your records, not generated.</span>
      </div>

      <div className='w-full bg-[#111620] py-4 px-6 rounded-xl border border-gray-400/15 flex flex-col gap-4 mb-3'>
        <div className='flex justify-between items-center'>
          <h1 className='font-bold text-[#8a9bb0] tracking-wider'>WHERE YOUR TIME WENT</h1>
          <span className='text-[11px] bg-gray-400/15 rounded-2xl px-2 py-1 text-gray-500 tracking-wider'>{top_games.length} Games</span>
        </div>
        <div className='flex flex-col gap-6 md:gap-3'>
          {top_games.length===0 && (
            <p className='body text-[13px] text-[#4a5568]'>No sessions in this period yet.</p>
          )}
          {top_games.map(function(elem,idx){
            return <TopByPlaytime key={idx} name={elem.name} progress={elem.progress} hours={elem.hours} color={elem.color}/>
          })}
        </div>
      </div>
    </div>
  )
}

export default InsightsContent
