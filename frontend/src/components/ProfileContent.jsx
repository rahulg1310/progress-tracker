import React, { useContext } from 'react'
import { UserData } from '../context/UserContext'


const ProfileContent = () => {
  const {user} = useContext(UserData);
  return (
    <div className='w-full py-5 px-12 flex flex-col'>
      <h1 className='font-bold text-4xl tracking-wider mb-10'>Profile</h1>
      <div className='w-full bg-[#111620] py-4 px-6 rounded-2xl border border-gray-400/15 flex flex-col gap-4'>
        <div className='h-20 w-20 rounded-full bg-gray-700 flex justify-center items-center'>
            <div className='h-19 w-19 rounded-full bg-[#1a2332] overflow-hidden'>
                <img src="https://i.pinimg.com/236x/86/36/07/863607364f9d235e29d570f40315be07.jpg" alt="pfp" className='' />
            </div>
        </div>
        <div className='font-bold text-3xl flex gap-1 items-end'>
            <h1>{user?.username}</h1>
            <span className='text-[#4a5568] text-lg'>#7743</span>
            <button className='text-[#7d8ca7] text-[13px] ml-0.5 rounded-xl px-2 py-1 bg-[#1a2332] hover:-translate-y-0.5 hover:bg-gray-700 transition-all duration-200'>Edit Profile</button>
        </div>
        <h1 className='body text-[#8a9bb0] text-[15px]'>250 on my wrist, 250 on my bitch</h1>
        <div className='flex gap-2 items-center'>
            <h1 className='font-bold body text-[12px] text-yellow-400 bg-yellow-400/20 py-0.5 px-3 rounded-2xl border border-yellow-400'>Level</h1>
            <h1 className='font-bold body text-[12px] text-green-400 bg-green-400/20 py-0.5 px-3 rounded-2xl border border-green-400'>Streak</h1>
            <h1 className='font-bold body text-[12px] text-purple-400 bg-purple-400/20 py-0.5 px-3 rounded-2xl border border-purple-400'>Achievements</h1>
        </div>
        <div className='flex flex-col gap-1'>
            <div className='flex justify-between'>
                <span className='font-bold body text-[13px] text-[#8a9bb0]'>Level 69</span>
                <span className='font-bold mono text-[13px] text-[#a714e0]'>84%</span>
            </div>
            <div className='h-1.5 w-full rounded bg-[#1a2332] overflow-hidden'>
                <div className='h-full w-[84%] bg-purple-600 rounded'></div>
            </div>
            <span className='text-[#4a5568] body text-[11px]'>1,580 XP Until Next Level</span>
        </div>
        <div className='flex gap-5'>
            <span className='body text-[#8a9bb0] text-[13px]'>Joined May 2026</span>
            <span className='body text-[#8a9bb0] text-[13px]'>Fav Genre : Souls</span>
        </div>
      </div>
    </div>
  )
}

export default ProfileContent
