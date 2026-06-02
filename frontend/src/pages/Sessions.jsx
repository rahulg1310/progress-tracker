import React from 'react'
import Sidebar from '../components/Sidebar'
import SessionContent from '../components/SessionContent'
SessionContent

const Sessions = () => {
  return (
    <div className='flex min-h-screen w-full bg-[#080c10]'>
        <Sidebar />
        <div className='flex-1 overflow-y-auto'>
            <SessionContent />
        </div>
    </div>
  )
}

export default Sessions
