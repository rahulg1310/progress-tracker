import React from 'react'
import { Flame } from 'lucide-react'

const StreakCard = (props) => {
  const remaining = Math.max(0, props.consistency.target - props.consistency.daysPlayed);
  return (
    <div className='flex-1 min-w-0 bg-[#111620] py-5 px-6 rounded-2xl border border-gray-400/15 flex flex-col gap-4'>
      <div className='flex justify-between items-center'>
        <h1 className='font-bold tracking-wider text-[#8a9bb0]'>STREAK</h1>
        <span className='text-[11px] bg-gray-400/15 rounded-2xl px-2 py-1 text-gray-500 tracking-wider'>Best {props.streak.longest} days</span>
      </div>
      <div className='flex items-center gap-4'>
        <div className='bg-orange-500/15 p-3 rounded-xl'><Flame size={28} color='#f97316'/></div>
        <div>
          <h1 className='font-bold text-3xl'>{props.streak.current} <span className='text-lg text-[#8a9bb0]'>day{props.streak.current===1 ? '' : 's'}</span></h1>
          <span className='body text-[12px] text-[#4a5568]'>Log a session today to keep it going</span>
        </div>
      </div>
      <div className='flex justify-between gap-1'>
        {props.streak.days.map(function(elem){
          return (
            <div key={elem.date} className='flex flex-col items-center gap-1'>
              <div className={`w-7 h-7 md:w-8 md:h-8 rounded-[8px] border flex justify-center items-center ${
                elem.logged ? 'bg-orange-500/20 border-orange-500/40' : 'bg-[#0d1117] border-white/5'
              }`}>
                {elem.logged && <Flame size={14} color='#f97316'/>}
              </div>
              <span className='body text-[10px] text-[#4a5568]'>{elem.label}</span>
            </div>
          )
        })}
      </div>
      <p className='body text-[13px] text-[#8a9bb0] border-t border-t-gray-600/40 pt-3'>
        You've played on <span className='mono text-white'>{props.consistency.daysPlayed}</span> days this week.
        {remaining>0 ? ` Play ${remaining} more day${remaining>1 ? 's' : ''} to meet your consistency goal.` : ' Consistency goal met!'}
      </p>
    </div>
  )
}

export default StreakCard
