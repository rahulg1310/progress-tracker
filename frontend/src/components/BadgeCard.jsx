import React from 'react'
import { Swords, Flame, Timer, Target, Trophy, Compass, CalendarCheck, Zap, Award, Lock } from 'lucide-react'
import { formatShortDate } from '../utils/formatTime'

// Icons are mapped in the frontend because the API only returns badge codes
const badgeIcons = {
  first_session : Swords,
  streak_7 : Flame,
  marathon : Timer,
  goal_getter : Target,
  completionist : Trophy,
  genre_explorer : Compass,
  clockwork : CalendarCheck,
  streak_30 : Zap,
}

const BadgeCard = (props) => {
  const Icon = badgeIcons[props.code] || Award;
  const pct = Math.min(100, Math.round((props.progress/props.target)*100));
  return (
    <div className={`bg-[#0d1117] border rounded-xl p-4 flex flex-col items-center text-center gap-2 transition-all duration-200 hover:-translate-y-1 ${
      props.earned ? 'border-yellow-400/30' : 'border-white/5'
    }`}>
      <div className={`relative w-14 h-14 rounded-full flex justify-center items-center ${
        props.earned ? 'bg-yellow-400/15' : 'bg-[#1a2332]'
      }`}>
        <Icon size={24} color={props.earned ? '#f9e020' : '#4a5568'}/>
        {!props.earned && (
          <div className='absolute -bottom-1 -right-1 bg-[#111820] rounded-full p-1 border border-white/10'><Lock size={10} color='#8a9bb0'/></div>
        )}
      </div>
      <h1 className={`font-bold tracking-wider ${props.earned ? 'text-white' : 'text-[#8a9bb0]'}`}>{props.name}</h1>
      <p className='body text-[11px] text-[#4a5568] min-h-8'>{props.description}</p>
      {props.earned ? (
        <span className='body text-[11px] text-yellow-400'>{props.earnedAt ? `Earned ${formatShortDate(props.earnedAt)}` : 'Earned'}</span>
      ) : (
        <div className='w-full flex flex-col gap-1'>
          <div className='h-1 bg-[#1a2332] rounded-full overflow-hidden w-full'>
            <div className='h-full rounded-full bg-yellow-400/70' style={{width : `${pct}%`}}></div>
          </div>
          <span className='mono text-[11px] text-[#8a9bb0]'>{props.progress}/{props.target}</span>
        </div>
      )}
    </div>
  )
}

export default BadgeCard
