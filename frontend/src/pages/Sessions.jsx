import React from 'react'
import Sidebar from '../components/Sidebar'
import SessionContent from '../components/SessionContent'
SessionContent

const Sessions = () => {
  const session_card = [
    {
        data : '-',
        title : 'Total Sessions',
        color : 'text-[#00f5a0]'
    },
    {
        data : '-',
        title : 'Total Hours',
        color : 'text-[#00d9f5]'
    },
    {
        data : '-',
        title : 'Avg K/D',
        color : 'text-[#a78bfa]'
    },
    {
        data : '-',
        title : 'Win Rate',
        color : 'text-[#f9e020]'
    },
    {
        data : '-',
        title : 'Avg Session',
        color : 'text-[#f97316]'
    },
    {
        data : '-',
        title : 'Best Streak',
        color : 'text-[#ec4899]'
    },
  ]
  return (
    <div className='flex min-h-screen w-full bg-[#080c10]'>
        <Sidebar />
        <div className='flex-1 overflow-y-auto'>
            <SessionContent session_card={session_card}/>
        </div>
    </div>
  )
}

export default Sessions
