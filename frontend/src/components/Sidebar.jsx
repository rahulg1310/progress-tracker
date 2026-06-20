import React, { useState } from 'react'
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
import { Menu } from 'lucide-react'
import { X } from 'lucide-react'

const Sidebar = () => {
  const {user , setUser} = useContext(UserData);
  const [modal, setModal] = useState(false);
  const navigate = useNavigate();
  return (
    <>
      <div className='md:hidden h-16 bg-[#0d1117] border-b border-gray-700 flex items-center justify-between px-2'>
        <h1 className='font-bold mono text-4xl bg-linear-to-r from-red-800 to-purple-800 bg-clip-text text-transparent ml-2 mr-2'>路 KAIRO</h1>
        <button onClick={()=>{
          setModal(!modal);
        }}>
          {
            modal===true ? <X size={28}/> : <Menu size={28}/>
          }
        </button>

      {
        modal && (
          <div 
          onClick={()=>{
            setModal(false)
          }}
          className='fixed inset-0 z-80 '>
          </div>
        )
      }
        <div className={`fixed top-16 left-0 z-[100] overflow-y-auto w-full h-[calc(100vh-64px)] bg-[#0d1117] transition-transform duration-300 ${
          modal ? "translate-x-0" : "-translate-x-full"
        }`}>
          <div className="flex flex-col justify-between h-full py-6">
            <div className="tracking-normal flex flex-col gap-2 px-3 font-semibold text-2xl text-[#8a9bb0]">
              <button
                onClick={()=>{
                  navigate('/dashboard');
                  setModal(false);
                }}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 rounded-lg"
              >
                <LayoutDashboard size={21} />
                Dashboard
              </button>
              <button
                onClick={()=>{
                  navigate('/library');
                  setModal(false);
                }}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 rounded-lg"
              >
                <Library size={21} />
                Library
              </button>
              <button
                onClick={()=>{
                  navigate('/sessions');
                  setModal(false);
                }}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 rounded-lg"
              >
                <Clock size={21} />
                Sessions
              </button>

              <button
                onClick={()=>{
                  navigate('/profile');
                  setModal(false);
                }}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 rounded-lg"
              >
                <UserRound size={21} />
                Profile
              </button>
            </div>
            <div className="border-t flex flex-col border-gray-700 pt-5 px-4">
              <h2 className="text-center text-2xl font-bold mb-4">
                {user?.username}
              </h2>
              <button
                onClick={()=>{
                  setUser(null);
                  localStorage.removeItem("user");
                  localStorage.removeItem("token");
                  navigate('/');
                  setModal(false);
                }}
                className="w-full font-semibold flex justify-center items-center gap-2 py-2 hover:bg-gray-800 rounded-lg text-[#8a9bb0]"
              >
                Sign Out
                <LogOut size={21} />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className='hidden md:flex w-60 bg-[#0d1117] h-screen border-r  border-r-gray-400/10 px-2 flex flex-col'>
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
        <div className='w-full flex flex-col justify-around px-4 py-4 flex-1 border-t-2 border-gray-600/40'>
            <div className='w-full flex justify-center mono text-xl font-semibold'>
              <div className='flex gap-1 items-center'>
                  <h1>{user?.username}</h1>
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
              className='w-full py-1 flex justify-center items-center gap-2 font-bold tracking-wider text-xl hover:bg-gray-800 rounded-[7px] transition-all duration-200 text-[#8a9bb0]'>Sign out <LogOut size={15}/></button>
            </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
