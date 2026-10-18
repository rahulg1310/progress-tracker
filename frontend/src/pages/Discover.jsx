import React from 'react'
import Sidebar from '../components/Sidebar'
import DiscoverContent from '../components/DiscoverContent'

const Discover = () => {
  return (
    <div className='flex flex-col md:flex-row h-screen w-full bg-[#080c10]'>
        <Sidebar />
        <div className='flex-1 h-full overflow-y-auto'>
            <DiscoverContent />
        </div>
    </div>
  )
}

export default Discover
