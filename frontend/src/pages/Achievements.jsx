import React from 'react'
import Sidebar from '../components/Sidebar'
import AchievementsContent from '../components/AchievementsContent'

const Achievements = () => {
  return (
    <div className='flex flex-col md:flex-row h-screen w-full bg-[#080c10]'>
        <Sidebar />
        <div className='flex-1 h-full overflow-y-auto'>
            <AchievementsContent />
        </div>
    </div>
  )
}

export default Achievements
