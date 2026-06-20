import React from 'react'
import Sidebar from '../components/Sidebar'
import LibraryContent from '../components/LibraryContent'

const Library = () => {
  return (
    <div className='flex flex-col md:flex-row h-screen w-full bg-[#080c10]'>
        <Sidebar />
        <div className='flex-1 h-full overflow-y-auto'>
            <LibraryContent />
        </div>
    </div>
  )
}

export default Library
