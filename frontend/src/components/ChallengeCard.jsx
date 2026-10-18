import React from 'react'
import { Swords, CircleCheck, Zap } from 'lucide-react'
import { formatShortDate, formatMinutes } from '../utils/formatTime'

const ChallengeCard = (props) => {
  const isDone = props.status==='completed';
  const isExpired = props.status==='expired';
  const show = (value)=>props.unit==='minutes' ? formatMinutes(value) : value;
  const pct = Math.min(100, Math.round((props.progress/props.target)*100));
  return (
    <div className={`w-full md:w-[calc(50%-8px)] xl:w-[calc(33.333%-11px)] bg-[#0d1117] border rounded-xl py-4 px-5 flex flex-col gap-3 min-w-0 ${
      isDone ? 'border-green-400/25' : isExpired ? 'border-white/5 opacity-50' : 'border-white/5 hover:border-white/13'
    } transition-all duration-200`}>
      <div className='flex justify-between items-start gap-3'>
        <div className='flex items-center gap-2 min-w-0'>
          {isDone ? <CircleCheck size={18} color='#4ade80'/> : <Swords size={18} color='#00d9f5'/>}
          <h1 className='font-bold text-lg truncate'>{props.title}</h1>
        </div>
        <span className='mono text-[12px] text-yellow-300 bg-yellow-400/10 rounded-xl px-2 py-0.5 flex items-center gap-1 shrink-0'><Zap size={11}/>{props.xp} XP</span>
      </div>
      <p className='body text-[13px] text-[#8a9bb0]'>{props.description}</p>
      {props.flavor && <p className='body text-[12px] text-[#4a5568] italic'>{props.flavor}</p>}
      <div className='flex flex-col gap-1'>
        <div className='h-1.5 bg-[#1a2332] rounded-full overflow-hidden w-full'>
          <div className={`h-full rounded-full ${isDone ? 'bg-green-400' : 'bg-cyan-400'}`} style={{width : `${pct}%`}}></div>
        </div>
        <div className='flex justify-between body text-[11px] text-[#4a5568]'>
          <span className='mono'>{show(props.progress)}/{show(props.target)}</span>
          <span>{isDone ? 'Completed' : isExpired ? 'Expired' : `Ends ${formatShortDate(props.expiresAt)}`}</span>
        </div>
      </div>
    </div>
  )
}

export default ChallengeCard
