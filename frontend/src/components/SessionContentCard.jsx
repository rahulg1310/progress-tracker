import React from 'react'

const SessionContentCard = (props) => {
  return (
    <div className='bg-[#0d1117] border border-white/5 rounded-xl p-3 flex flex-col flex-1 justify-center items-center gap-2'>
        <h1 className={`${props.color} font-bold text-2xl`}>{props.data}</h1>
        <h1 className='body text-[#8a9bb0] text-[13px]'>{props.title}</h1>
    </div>
  )
}

export default SessionContentCard
