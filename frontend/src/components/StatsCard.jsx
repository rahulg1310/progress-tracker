import React from 'react'
import { ArrowRight } from 'lucide-react'
import { Trash2 } from 'lucide-react'


const StatsCard = (props) => {
  return (
        <div className='w-full md:w-3/4 flex flex-col gap-3  bg-[#0d1117] border border-white/5 rounded-xl py-4 px-6 hover:border-white/13 hover:-translate-y-1 transition-all duration-200 min-w-0 '>
          <div className='flex justify-between'>
            <h1 className='font-bold text-xl'>{props.game}</h1>
            <h1 className={`body font-semibold text-[13px] ${
                props.result === "Win" ? "text-green-500 bg-green-500/10" : props.result === "Loss" ? "text-red-500 bg-red-500/10" : "text-cyan-500 bg-cyan-500/10"
            }  py-1 px-3  rounded-xl`}>{props.result}</h1>
          </div>
          <h2 className='body text-[12px] text-[#4a5568]'>{new Date(props.date).toLocaleDateString()}</h2>
          <div className='flex gap-6 flex-wrap'>
            <div className='flex flex-col gap-0 justify-center items-center'>
              <h1 className='mono text-[16px] text-green-400'>{props.kills}</h1>
              <h1 className='body text-[12px] text-[#4a5568]'>KILLS</h1>
            </div>
            <div className='flex flex-col gap-0 justify-center items-center'>
              <h1 className='mono text-[16px] text-red-500'>{props.deaths}</h1>
              <h1 className='body text-[12px] text-[#4a5568]'>DEATHS</h1>
            </div>
            <div className='flex flex-col gap-0 justify-center items-center'>
              <h1 className='mono text-[16px] text-cyan-400'>{props.assists}</h1>
              <h1 className='body text-[12px] text-[#4a5568]'>ASSISTS</h1>
            </div>
            <div className='flex flex-col gap-0 justify-center items-center'>
              <h1 className='mono text-[16px] text-yellow-200'>{props.ratio}</h1>
              <h1 className='body text-[12px] text-[#4a5568]'>K/D</h1>
            </div>
            <div className='flex flex-col gap-0 justify-center items-center'>
              <h1 className='mono text-[16px]'>{props.duration}m</h1>
              <h1 className='body text-[12px] text-[#4a5568]'>DURATION</h1>
            </div>
            <div className='flex flex-col gap-0 justify-center items-center'>
              <h1 className='mono text-[16px] text-purple-600 lowercase font-semibold'>{props.mood}</h1>
              <h1 className='body text-[12px] text-[#4a5568]'>MOOD</h1>
            </div>
          </div> 
          <div className='flex justify-between'>
            <div className='flex items-center gap-2'>
                <h1 className='mono text-[14px]'>{props.rankBefore}</h1>
                <ArrowRight size={17} /> 
                <h1 className='mono text-[14px]'>{props.rankAfter}</h1>
            </div>
            <div>
                <button 
                onClick={()=>{
                    props.deleteSession(props.id);
                }}
                className='body hover:bg-gray-700 transition-all duration-200 p-[5px] rounded-[8px] '><Trash2 size={20} color='#948f8f' /></button>
            </div>
          </div>
          
        </div>
    )
}

export default StatsCard
