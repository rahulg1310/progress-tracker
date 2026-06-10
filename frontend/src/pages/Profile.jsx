import React from 'react'
import Sidebar from '../components/Sidebar'
import ProfileContent from '../components/ProfileContent'

const Profile = () => {
  return (
    <div className='flex min-h-screen w-full bg-[#080c10]'>
        <Sidebar />
        <div className='flex-1 overflow-y-auto'>
            <ProfileContent />
        </div>
    </div>
  )
}

export default Profile
