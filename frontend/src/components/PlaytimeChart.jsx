import React from 'react'
import { formatMinutes } from '../utils/formatTime'

const PlaytimeChart = (props) => {
  const max = Math.max(...props.data.map((elem)=>elem.minutes), 1);
  return (
    <div className='w-full flex flex-col gap-2'>
      <div className='h-48 flex items-end gap-2 md:gap-4 border-b border-b-gray-600/40 pb-0'>
        {props.data.map(function(elem,idx){
          const height = elem.minutes===0 ? 0 : Math.max(6, (elem.minutes/max)*100);
          return (
            <div key={idx} className='group flex-1 h-full flex flex-col justify-end items-center gap-1 min-w-0'>
              <span className={`mono text-[10px] md:text-[11px] transition-all duration-200 ${
                elem.minutes===0 ? 'text-transparent' : 'text-[#8a9bb0] md:opacity-0 md:group-hover:opacity-100'
              }`}>{formatMinutes(elem.minutes)}</span>
              <div className={`w-full max-w-12 rounded-t-[6px] transition-all duration-500 ${
                elem.isFuture ? 'bg-[#1a2332]' : 'bg-linear-to-t from-green-400 to-cyan-400 group-hover:opacity-80'
              }`}
              style={{height : elem.isFuture ? '4px' : `${height}%`}}></div>
            </div>
          )
        })}
      </div>
      <div className='flex gap-2 md:gap-4'>
        {props.data.map(function(elem,idx){
          return <span key={idx} className={`flex-1 text-center body text-[11px] truncate ${elem.isFuture ? 'text-[#2d3748]' : 'text-[#4a5568]'}`}>{elem.label}</span>
        })}
      </div>
    </div>
  )
}

export default PlaytimeChart
