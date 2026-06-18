import React from 'react'

const TopByPlaytime = (props) => {
  return (
    <div className='flex flex-col sm:flex-row gap-3 sm:gap-6 sm:items-center'>
        <span className='body text-[13px] text-[#8a9bb0] w-[100px]'>{props.name}</span>
        <div className='w-full md:flex-1 h-2 rounded-full bg-[#1a2332]'>
            <div style={{width : props.progress, backgroundColor : props.color}} className={`h-full rounded-full`}></div>
        </div>
        <span className='body text-xs text-[#4a5568]'>{props.hours}</span>
    </div>
  )
}

export default TopByPlaytime
