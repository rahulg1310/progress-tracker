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
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { UserData } from '../context/UserContext'
import { useContext } from 'react'

const Sidebar = () => {
  const {user , setUser} = useContext(UserData);
  const navigate = useNavigate();
  return (
    <>
      <div className='w-60 bg-[#0d1117] h-screen border-r  border-r-gray-400/10 px-2 flex flex-col'>
        <div className='h-[83%] w-full flex flex-col justify-between'>
            <div className='flex flex-col gap-4'>
                <div className='py-5 flex justify-center '>
                  
                    <h1 className='font-bold mono text-4xl bg-linear-to-r from-red-800 to-purple-800 bg-clip-text text-transparent ml-2 mr-2'>路 KAIRO</h1>
                    
                </div>
                <div className='font-semibold text-[#8a9bb0] text-xl flex flex-col gap-1 items-start px-3'>
                    <button 
                    onClick={()=>{
                      navigate('/dashboard');
                    }}
                    className='flex items-center gap-2 w-full hover:bg-gray-800 px-3 py-1 rounded-[7px] transition-all duration-200'><LayoutDashboard size={15} className='mb-0.5'/>Dashboard</button>
                    <button 
                    onClick={()=>{
                      navigate('/library');
                    }}
                    className='flex items-center gap-2 w-full hover:bg-gray-800 px-3 py-1 rounded-[7px] transition-all duration-200'><Library size={15} className='mb-0.5'/>Library</button>
                    <button 
                    onClick={()=>{
                      navigate('/sessions');
                    }}
                    className='flex items-center gap-2 w-full  hover:bg-gray-800 px-3 py-1 rounded-[7px] transition-all duration-200'><Clock size={15} className='mb-0.5'/>Sessions</button>
                    <button 
                    onClick={()=>{
                      navigate('/profile');
                    }}
                    className='flex items-center gap-2 w-full  hover:bg-gray-800 px-3 py-1 rounded-[7px] transition-all duration-200'><UserRound size={15} className='mb-0.5'/>Profile</button>
                </div>
            </div>
        </div>
        <div className='w-full flex flex-col justify-between px-4 py-4 flex-1 border-t-2 border-gray-600/40'>
            <div className='w-full flex justify-center mono text-xl font-semibold'>
              <div className='flex gap-1 items-center'>
                <div className='w-18 h-18 flex justify-center items-center bg-gray-700 rounded-full mr-2'>
                  <div className='w-17 h-17 rounded-full overflow-hidden'>
                    <img src="https://pbs.twimg.com/media/G1c19UTWoAAYFAs.jpg" alt="pfp" className='' />
                  </div>
                </div>
                  <h1>{user?.username}</h1>
                  <span className='text-[12px] text-[#4a5568] mt-2.5'>#7743</span>
              </div>
            </div>
            <div className='w-full flex justify-center'>
              <button 
              onClick={()=>{
                setUser(null);
                localStorage.removeItem("user");
                localStorage.removeItem("token");
                navigate('/');
              }}
              className='w-full py-1 flex justify-center items-center gap-2 font-bold tracking-wider text-xl hover:bg-gray-800 rounded-[7px] transition-all duration-200 text-[#8a9bb0]'>Logout <LogOut size={15}/></button>
            </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
