import React from 'react'

const GameCard = (props) => {
  return (
    <div className='bg-[#0d1117] border border-white/5 rounded-xl p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div className='flex gap-4 flex-1 min-w-0'>
            <div className='w-11 h-11 bg-green-300/20 border font-bold border-green-300/20 flex justify-center items-center rounded-[6px] '>{props.initial}</div>
            <div className='flex flex-col flex-1 min-w-0'>
                <h1 className='body font-bold'>{props.name}</h1>
                <span className='body text-[#4a5568] text-[11px]'>{props.genre} - {props.hours}</span>
                <div className='h-1 bg-[#1a2332] rounded-full overflow-hidden w-full mt-1'>
                        <div className={`h-full w-[${props.progress}] ${props.color1} rounded-full`}></div>
                </div>
            </div>
        </div>
        <div>
            <div className='body flex flex-col items-end text-[13px]' >
                <h1 className='text-orange-200'>{props.progress}</h1>
                <h1 className={`${props.color2}`}>{props.status}</h1>
            </div>
        </div>
    </div>
  )
}

export default GameCard
