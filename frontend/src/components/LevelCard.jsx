import React from 'react'
import { Zap } from 'lucide-react'

const LevelCard = (props) => {
  const intoLevel = props.xp - props.levelStartXp;
  const levelSize = props.nextLevelXp - props.levelStartXp;
  const pct = Math.min(100, Math.round((intoLevel/levelSize)*100));
  return (
    <div className='flex-1 min-w-0 bg-[#111620] py-5 px-6 rounded-2xl border border-gray-400/15 flex flex-col gap-4'>
      <h1 className='font-bold tracking-wider text-[#8a9bb0]'>LEVEL</h1>
      <div className='flex items-center gap-5'>
        <div className='h-20 w-20 rounded-full flex items-center justify-center shrink-0'
        style={{background : `conic-gradient(#a78bfa ${pct}%,#1a2332 0)`}}>
          <div className='w-[68px] h-[68px] rounded-full bg-[#111620] flex flex-col items-center justify-center'>
            <span className='font-bold text-3xl text-[#a78bfa] leading-none'>{props.level}</span>
          </div>
        </div>
        <div className='flex flex-col gap-1 min-w-0'>
          <h1 className='font-bold text-2xl tracking-wider'>{props.title}</h1>
          <span className='mono text-[13px] text-[#8a9bb0] flex items-center gap-1'><Zap size={13} color='#f9e020'/>{props.xp.toLocaleString()} XP</span>
          <span className='body text-[12px] text-[#4a5568]'>{props.nextLevelXp-props.xp} XP to level {props.level+1}</span>
        </div>
      </div>
      <div className='h-2 bg-[#1a2332] rounded-full overflow-hidden w-full'>
        <div className='h-full rounded-full bg-linear-to-r from-purple-500 to-cyan-400 transition-all duration-500' style={{width : `${pct}%`}}></div>
      </div>
    </div>
  )
}

export default LevelCard
