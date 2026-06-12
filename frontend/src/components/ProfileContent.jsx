import React, { useContext, useState } from 'react'
import { UserData } from '../context/UserContext'
import ProfileModal from './ProfileModal';

const ProfileContent = () => {
  const {user,setUser} = useContext(UserData);
  const [editUser, setEditUser] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPfp, setEditPfp] = useState("");
  const [modal, setModal] = useState(false);
  return (
    <div className='w-full py-5 px-12 flex flex-col'>
      <h1 className='font-bold text-4xl tracking-wider mb-10'>Profile</h1>
      <div className='w-full bg-[#111620] py-4 px-6 rounded-2xl border border-gray-400/15 flex flex-col gap-4 mb-5'>
        <div className='h-20 w-20 rounded-full bg-gray-700 flex justify-center items-center'>
            <div className='h-19 w-19 rounded-full bg-[#1a2332] overflow-hidden'>
                <img src="https://pbs.twimg.com/media/G1c19UTWoAAYFAs.jpg" alt="pfp" />
            </div>
        </div>
        <div className='font-bold text-3xl flex gap-1 items-end'>
            <h1 className='min-w-0'>{user?.username}</h1>
            <span className='text-[#4a5568] text-lg min-w-0'>#7743</span>
            <button 
            onClick={()=>{
                setEditUser("");
                setEditBio("");
                setEditPfp("");
                setModal(true);
            }}
            className='text-[#7d8ca7] text-[13px] ml-0.5 rounded-[7px] px-2 py-1 bg-black hover:-translate-y-0.5 hover:bg-gray-800 transition-all duration-200 min-w-0 mb-1'>Edit Profile</button>
        </div>
        <h1 className='body text-[#8a9bb0] text-[15px]'>250 on my wrist, 250 on my bitch</h1>
        <div className='flex gap-2 items-center'>
            <h1 className='font-bold body text-[12px] text-green-400 bg-green-400/20 py-0.5 px-3 rounded-2xl border border-green-400'>Streak</h1>
            <h1 className='font-bold body text-[12px] text-purple-400 bg-purple-400/20 py-0.5 px-3 rounded-2xl border border-purple-400'>Achievements</h1>
        </div>
        <div className='flex gap-5'>
            <span className='body text-[#8a9bb0] text-[13px]'>Joined May 2026</span>
            <span className='body text-[#8a9bb0] text-[13px]'>Fav Genre : Souls</span>
        </div>
      </div>
      <div className='w-full md:w-1/2 bg-[#111620] py-4 px-6 rounded-2xl border border-gray-400/15 flex flex-col gap-2 mb-5'>
            
        <div className='flex justify-between border-b border-gray-400/15 py-1'>
            <h1 className='body text-[#8a9bb0] text-[14px]'>Games in Library</h1>
            <span className='mono text-[14px] text-green-400 font-semibold'>8</span>
        </div>
        <div className='flex justify-between border-b border-gray-400/15 py-1'>
            <h1 className='body text-[#8a9bb0] text-[14px]'>Games Completed</h1>
            <span className='mono text-[14px] text-blue-400 font-semibold'>3</span>
        </div>
        <div className='flex justify-between border-b border-gray-400/15 py-1'>
            <h1 className='body text-[#8a9bb0] text-[14px]'>Currently Playing</h1>
            <span className='mono text-[14px] text-amber-400 font-semibold'>3</span>
        </div>
        <div className='flex justify-between border-b border-gray-400/15 py-1'>
            <h1 className='body text-[#8a9bb0] text-[14px]'>In Backlog</h1>
            <span className='mono text-[14px] text-cyan-400 font-semibold'>1</span>
        </div>
        <div className='flex justify-between border-b border-gray-400/15 py-1'>
            <h1 className='body text-[#8a9bb0] text-[14px]'>Total Playtime</h1>
            <span className='mono text-[14px] text-orange-400 font-semibold'>577h</span>
        </div>
        <div className='flex justify-between border-b border-gray-400/15 py-1'>
            <h1 className='body text-[#8a9bb0] text-[14px]'>Average Session</h1>
            <span className='mono text-[14px] text-red-400 font-semibold'>~72h / game</span>
        </div>
        <div className='flex justify-between border-b border-gray-400/15 py-1'>
            <h1 className='body text-[#8a9bb0] text-[14px]'>Achievements Earned</h1>
            <span className='mono text-[14px] text-green-400 font-semibold'>209</span>
        </div>
        <div className='flex justify-between border-b border-gray-400/15 py-1'>
            <h1 className='body text-[#8a9bb0] text-[14px]'>Completion Rate</h1>
            <span className='mono text-[14px] text-blue-400 font-semibold'>8</span>
        </div>
        <div className='flex justify-between border-b border-gray-400/15 py-1'>
            <h1 className='body text-[#8a9bb0] text-[14px]'>Average Rating</h1>
            <span className='mono text-[14px] text-amber-400 font-semibold'>9.3 / 10</span>
        </div>
        <div className='flex justify-between mb-2 py-1'>
            <h1 className='body text-[#8a9bb0] text-[14px]'>Current Streak</h1>
            <span className='mono text-[14px] text-orange-400 font-semibold'>12 Days</span>
        </div>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-5'>
        <div className='w-full bg-[#111620] py-4 px-6 rounded-2xl border border-gray-400/15 flex flex-col gap-3 '>
            <h1 className='body text-lg font-bold mb-5'>Completion Overview</h1>
            <div className='flex justify-around mb-3'>
                <div className='flex flex-col gap-2 items-center'>
                    <div style={{background : 'conic-gradient(#4ADE80 38%,#1a2332 0)'}} className='h-23 w-23 rounded-full flex justify-center items-center'>
                        <div className='h-20 w-20 rounded-full bg-[#111620] flex justify-center items-center'>
                            <span className='font-bold text-green-400'>38%</span>
                        </div>
                    </div>
                    <span className='body text-[12px] text-[#8a9bb0]'>Completion Rate</span>
                </div>
                <div className='flex flex-col gap-2 items-center'>
                    <div style={{background : 'conic-gradient(#C084FC 57%,#1a2332 0)'}} className='h-23 w-23 rounded-full flex justify-center items-center'>
                        <div className='h-20 w-20 rounded-full bg-[#111620] flex justify-center items-center'>
                            <span className='font-bold text-purple-400'>57%</span>
                        </div>
                    </div>
                    <span className='body text-[12px] text-[#8a9bb0]'>Achievement Rate</span>
                </div>
            </div>
        </div>
        <div className='w-full bg-[#111620] py-4 px-6 rounded-2xl border border-gray-400/15 flex flex-col gap-3 '>
            <h1 className='body text-lg font-bold mb-1'>Top Rated Games</h1>
            <div className='flex justify-between items-center'>
                <div className='flex gap-3 items-center'>   
                    <span className='font-bold text-lg text-amber-400'>#1</span>
                    <div className='h-10 w-10 flex justify-center items-center bg-amber-500/20 rounded-[8px] border border-amber-500/50'>E</div>
                    <div className='flex flex-col justify-start'>
                        <h1 className='body text-[13px]'>Elden Ring</h1>
                        <h1 className='body text-[11px] text-[#4a5568]'>Souls</h1>
                    </div>
                </div>
                <span className='text-[11px] mono text-amber-400'>10/10</span>
            </div>
            <div className='flex justify-between items-center'>
                <div className='flex gap-3 items-center'>   
                    <span className='font-bold text-lg text-cyan-400'>#1</span>
                    <div className='h-10 w-10 flex justify-center items-center bg-cyan-500/20 rounded-[8px] border border-cyan-500/50'>S</div>
                    <div className='flex flex-col justify-start'>
                        <h1 className='body text-[13px]'>Sekiro</h1>
                        <h1 className='body text-[11px] text-[#4a5568]'>Soulslike</h1>
                    </div>
                </div>
                <span className='text-[11px] mono text-cyan-400'>10/10</span>
            </div>
            <div className='flex justify-between items-center'>
                <div className='flex gap-3 items-center'>   
                    <span className='font-bold text-lg text-red-400'>#1</span>
                    <div className='h-10 w-10 flex justify-center items-center bg-red-500/20 rounded-[8px] border border-red-500/50'>M</div>
                    <div className='flex flex-col justify-start'>
                        <h1 className='body text-[13px]'>Marvel's Spider Man</h1>
                        <h1 className='body text-[11px] text-[#4a5568]'>Action</h1>
                    </div>
                </div>
                <span className='text-[11px] mono text-red-400'>10/10</span>
            </div>
        </div>
      </div>
      <div className='w-full bg-[#111620] py-6 px-6 rounded-2xl border border-gray-400/15 flex flex-col gap-3 mb-5 overflow-y-auto'>
        <h1 className='body text-lg font-bold '>Completed Games</h1>
        <div className='flex flex-wrap gap-2.5'>
            <div className='py-2 px-4 bg-[#080c10] rounded-[8px] flex gap-8'>
                <div className='flex gap-3 items-center'>
                    <div className='w-2 h-2 bg-amber-400 rounded-full'></div>
                    <div className='flex flex-col'>
                        <h1 className='body font-semibol text-sm'>Elden Ring</h1>
                        <h1 className='body text-[11px] text-[#4a5568]'>112h - 45 Achievements</h1>
                    </div>
                </div>
                <div className='mono text-[12px] text-amber-400'>10/10</div>
            </div>
            <div className='py-2 px-4 bg-[#080c10] rounded-[8px] flex gap-8'>
                <div className='flex gap-3 items-center'>
                    <div className='w-2 h-2 bg-amber-400 rounded-full'></div>
                    <div className='flex flex-col'>
                        <h1 className='body font-semibol text-sm'>Sekiro</h1>
                        <h1 className='body text-[11px] text-[#4a5568]'>512h - 75 Achievements</h1>
                    </div>
                </div>
                <div className='mono text-[12px] text-amber-400'>10/10</div>
            </div>
            <div className='py-2 px-4 bg-[#080c10] rounded-[8px] flex gap-8'>
                <div className='flex gap-3 items-center'>
                    <div className='w-2 h-2 bg-amber-400 rounded-full'></div>
                    <div className='flex flex-col'>
                        <h1 className='body font-semibol text-sm'>Resident Evil Requiem</h1>
                        <h1 className='body text-[11px] text-[#4a5568]'>24h - 25 Achievements</h1>
                    </div>
                </div>
                <div className='mono text-[12px] text-amber-400'>10/10</div>
            </div>
        </div>
      </div>
      {modal && (
        <ProfileModal setModal={setModal} editUser={editUser} setEditUser={setEditUser} editBio={editBio} setEditBio={setEditBio} editPfp={editPfp} setEditPfp={setEditPfp} />
      )}
    </div>
  )
}

export default ProfileContent
