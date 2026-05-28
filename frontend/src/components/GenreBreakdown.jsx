import React from 'react'

const GenreBreakdown = (props) => {
  return (
    <div className='flex flex-col sm:flex-row gap-3 sm:gap-6 sm:items-center'>
        <span className='body text-[11.3px] text-[#8a9bb0] w-[70px] wrap-break-word'>{props.genre}</span>
        <div className='w-[60%] h-1 rounded-full bg-[#1a2332]'>
            <div className='h-full rounded-full bg-amber-400'
                 style={{width : props.progress}}>
            </div>
        </div>
        <span className='body text-xs text-[#8a9bb0]'>{props.num}</span>
    </div>
  )
}

export default GenreBreakdown
