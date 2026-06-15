import React, { useState } from 'react'
import { Clock } from 'lucide-react'
import { Trophy } from 'lucide-react'
import { Star } from 'lucide-react'
import { Trash2 } from 'lucide-react'
import { Settings2 } from 'lucide-react'
import { useContext } from 'react'

const statusConfig = {
  Playing:   { color: 'text-green-400',  border: 'border-green-400',  dot: 'bg-green-400', glow: "#4ade80" },
  Completed: { color: 'text-blue-400',   border: 'border-blue-400',   dot: 'bg-blue-400', glow: "#60a5fa" },
  Backlog:   { color: 'text-yellow-400', border: 'border-yellow-400', dot: 'bg-yellow-400', glow: "#facc15" },
  Dropped:   { color: 'text-red-400',    border: 'border-red-400',    dot: 'bg-red-400', glow: "#f87171" },
}



const LibraryGameCard = (props) => {
  const cfg = statusConfig[props.status] || statusConfig['Playing']
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div 
    onMouseEnter={()=>{
      setIsHovered(true);
    }}
    onMouseLeave={()=>{
      setIsHovered(false);
    }}
    style={{  boxShadow : isHovered ? `0 0 12px ${props.colorAccent}25` : ""}} className={`group w-[19%] flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0e1520] relative hover:-translate-y-1 duration-200 transition-all`}>
      <div
        style={{ background: `linear-gradient(
                  135deg,
                  ${props.colorAccent}15,
                  #1a1f2e
                )` }}
        className='w-full flex justify-center items-center py-10 relative'
      >
        <div className='opacity-0 group-hover:opacity-100 absolute top-3 left-3 flex gap-2 transition-all duration-200 '>
          <button 
          onClick={()=>{
            props.editGame(props.id);
          }}
          className='rounded bg-black/30 backdrop-blur-sm px-2 py-1 hover:bg-black transition-all duration-200'><Settings2 size={17} color='#878787'/></button>
          <button 
          onClick={()=>{
            props.deleteGame(props.id);
          }}
          className='rounded bg-black/30 backdrop-blur-sm px-2 py-1 hover:bg-black transition-all duration-200'><Trash2 size={17} color='#878787'/></button>
        </div>
        <span style={{boxShadow : `0 0 10px ${cfg.glow}`}} className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
        <h1 className='font-bold text-5xl text-white'>{props.title[0]}</h1>
      </div>
      <div className='flex flex-col gap-1.5 px-3 py-3'>
        <h2 className='font-bold text-[15px] leading-tight'>{props.title}</h2>
        <p className='text-[#4a5568] text-[12px] body'>{props.genre}</p>
        <span className='body text-[10px] bg-gray-400/15 rounded px-1.5 py-0.5 w-fit'>
          {props.platform}
        </span>
        <div className='flex items-center gap-2 mt-1'>
          <div className='flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden'>
            <div
              className='h-full rounded-full'
              style={{
                width: `${props.progress}%`,
                backgroundColor: props.colorAccent,
              }}
            />
          </div>
          <span className='text-[11px] text-white/60'>{props.progress}%</span>
        </div>
        <div className='flex items-center gap-3 text-[11px] text-white/50 mt-0.5'>
          <span className='flex items-center gap-1'><Clock size={12} className='mb-1'/>  {props.playtime}h</span>
          {props.totalAchievements > 0 && (
            <span className='flex items-center gap-1'><Trophy size={12} className='mb-1'/> {props.achievementsEarned}/{props.totalAchievements}</span>
          )}
          {props.rating > 0 && <span className='flex items-center gap-1'><Star size={12} className='mb-1'/> {props.rating}/10</span>}
        </div>
        <span className={`mt-1 text-[11px] font-bold tracking-widest border rounded px-2 py-0.5 w-fit ${cfg.color} ${cfg.border}`}>
          {props.status.toUpperCase()}
        </span>
      </div>
    </div>
  )
}

export default LibraryGameCard