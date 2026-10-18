import React from 'react'
import Sidebar from '../components/Sidebar'
import CoachContent from '../components/CoachContent'

const Coach = () => {
  return (
    <div className='flex flex-col md:flex-row h-screen w-full bg-[#080c10]'>
        <Sidebar />
        <div className='flex-1 min-h-0 h-full overflow-hidden'>
            <CoachContent />
        </div>
    </div>
  )
}

export default Coach
