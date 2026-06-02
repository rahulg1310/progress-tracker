import React from 'react'
import SessionContentCard from './SessionContentCard'

const SessionContent = (props) => {
  return (
    <div className='w-full py-5 px-12 flex flex-col gap-6'>
      <div className='w-full flex justify-between'>
        <div className='flex flex-col'>
            <h1 className='font-bold text-4xl tracking-wider'>Session Tracker</h1>
            <h4 className='body text-[13px] text-[#8a9bb0]'>{props.session_card.data} Sessions Logged</h4>
        </div>
        <div>
            <button className='font-bold tracking-wider text-black w-full bg-linear-to-r from-green-400 to-cyan-400 rounded-[7px] py-1.5 hover:-translate-y-0.5 hover:opacity-80 transition-all duration-200 px-3'>+ Log Session</button>
        </div>
      </div>
      <div className='flex gap-4'>
        {props.session_card.map(function(elem,idx){
            return <SessionContentCard key={idx} data={elem.data} title={elem.title} color={elem.color} />
        })}
      </div>
    </div>
  )
}

export default SessionContent
