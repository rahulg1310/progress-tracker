import React from 'react'
import {Gamepad2} from 'lucide-react'
import { LayoutDashboard } from 'lucide-react'
import { Library } from 'lucide-react'
import { Clock } from 'lucide-react'
import { Trophy } from 'lucide-react'
import { ChartNoAxesColumn } from 'lucide-react'
import { TimerReset } from 'lucide-react'
import { UserRound } from 'lucide-react'
import { Heart } from 'lucide-react'
import { UsersRound } from 'lucide-react'

const Sidebar = () => {
  return (
    <>
      <div className='w-60 bg-[#0d1117] h-screen border-r  border-r-gray-400/10'>
        <div className='h-[83%] w-full flex flex-col justify-between'>
            <div className='flex flex-col gap-4'>
                <div className='py-5 flex justify-center '>
                    <Gamepad2 size={35}/>
                    <h1 className='font-bold text-3xl bg-linear-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent ml-2 mr-2'>QUESTLOG</h1>
                    <button></button>
                </div>
                <div className='font-semibold text-[#8a9bb0] text-lg flex flex-col gap-1 items-start px-3'>
                    <button className='flex items-center gap-2 w-full hover:bg-gray-800 px-3 py-1 rounded-[7px]'><LayoutDashboard size={15} className='mb-0.5'/> Dashboard</button>
                    <button className='flex items-center gap-2 w-full  hover:bg-gray-800 px-3 py-1 rounded-[7px]'><Clock size={15} className='mb-0.5'/>Sessions</button>
                    <button className='flex items-center gap-2 w-full  hover:bg-gray-800 px-3 py-1 rounded-[7px]'><UserRound size={15} className='mb-0.5'/>Profile</button>
                </div>
            </div>
            <div className='px-3 py-3 border-b border-b-gray-400/30'>
                <div className='px-3 flex bg-yellow-400/10 rounded-[8px] border border-yellow-400/20 justify-start items-center'>
                <div><span className='text-2xl'>🔥</span></div>
                <div className='py-2 px-4 flex flex-col items-start '>
                    <h4 className='font-bold text-2xl text-yellow-400'>12</h4>
                    <span className='text-[#4a5568] text-xs'>Day Streak</span>
                </div>
              </div>
            </div>
        </div>
        <div>
            <div></div>
            <div></div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
