import React from 'react'

const ProfileStatsCard = (props) => {
  return (
    <div className='flex items-center bg-[#111620] px-6 py-3 rounded-2xl border border-gray-400/15 flex-1 min-w-[240px]'>
        <div className={`mr-4 ${props.color1} p-2.5 rounded-xl`}>
            {props.icon}
        </div>
        <div className='flex flex-col flex-1 min-w-0'>
            <h1 className='font-bold text-2xl'>{props.num}</h1>
            <span className='body text-[#8a9bb0] text-[13px]'>{props.title}</span>
            <span className='body text-[#4a5568] text-[11px]'>{props.stats}</span>
        </div>
    </div>
  )
}

export default ProfileStatsCard
