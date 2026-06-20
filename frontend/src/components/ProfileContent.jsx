import React, { useContext, useState } from 'react'
import { UserData } from '../context/UserContext'
import ProfileModal from './ProfileModal';
import { GamesData } from '../context/GamesContext';
import { SessionData } from '../context/SessionContext';

const ProfileContent = () => {
  const {games} = useContext(GamesData);
  const {sessions} = useContext(SessionData);
  const {user,setUser} = useContext(UserData);
  const [editUser, setEditUser] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPfp, setEditPfp] = useState("");
  const [modal, setModal] = useState(false);
  const totalGames = games.length;
  const completedGames = games.filter((elem)=>{
    return elem.status==="Completed"
  });
  const playingGames = games.filter((elem)=>{
    return elem.status==="Playing"
  }).length
  const backlogGames = games.filter((elem)=>{
    return elem.status==="Backlog"
  }).length
  const totalPlaytime = games.reduce((total,elem)=>{
    return total+elem.playtime;
  },0)
  const totalSessions = sessions.length;
  const avgSesssion = sessions.reduce((total,elem)=>{
    return total + elem.duration
  },0)/(totalSessions);
  const averageSession = totalSessions === 0 ? 0 : avgSesssion.toFixed(0);
  const earnedAchievements = games.reduce((total,elem)=>{
    return total+elem.achievementsEarned
  },0)
  const avgRating = games.reduce((total,elem)=>{
    return total+elem.rating;
  },0)/totalGames;
  const averageRating = totalGames===0 ? 0 : avgRating.toFixed(1);
  const completionRate =totalGames===0 ? 0 : ((completedGames.length/totalGames)*100).toFixed(0);
  const fullAchievements = games.reduce((total,elem)=>{
    return total+elem.totalAchievements;
  },0);
  const achievementRate = totalGames===0 ? 0 : ((earnedAchievements/fullAchievements)*100).toFixed(0);
  const topGames = [...games].sort((a,b)=>b.rating-a.rating);
  const topRatedGames = topGames.slice(0,3);

  return (
    <div className='w-full py-5 px-8 md:px-12 flex flex-col'>
      <h1 className='font-bold text-4xl tracking-wider mb-10'>Profile</h1>
      <div className='w-full bg-[#111620] py-4 px-6 rounded-2xl border border-gray-400/15 flex flex-col gap-4 mb-5'>
        <div className='font-bold text-3xl flex gap-1 items-end'>
            <h1 className='min-w-0'>{user?.username}</h1>
            <button 
            onClick={()=>{
                setEditUser(user.username || "");
                setEditBio(user.bio || "");
                setEditPfp(user.profilePicture || "");
                setModal(true);
            }}
            className='text-[#7d8ca7] text-[13px] ml-0.5 rounded-[7px] px-2 py-1 bg-black hover:-translate-y-0.5 hover:bg-gray-800 transition-all duration-200 min-w-0 mb-1'>Edit Profile</button>
        </div>
        <h1 className='mono text-[#8a9bb0] text-[15px]'>{user?.bio}</h1>
        <div className='flex gap-2 items-center'>
            <h1 className='font-bold body text-[12px] text-purple-400 bg-purple-400/20 py-0.5 px-3 rounded-2xl border border-purple-400'>Achievements : {earnedAchievements}</h1>
        </div>
        <div className='flex gap-5'>
            <span className='body text-[#8a9bb0] text-[13px]'>Joined May 2026</span>
            <span className='body text-[#8a9bb0] text-[13px]'>Fav Genre : Souls</span>
        </div>
      </div>
      <div className='w-full md:w-1/2 bg-[#111620] py-4 px-6 rounded-2xl border border-gray-400/15 flex flex-col gap-2 mb-5'>
            
        <div className='flex justify-between border-b border-gray-400/15 py-1'>
            <h1 className='body text-[#8a9bb0] text-[14px]'>Games in Library</h1>
            <span className='mono text-[14px] text-green-400 font-semibold'>{totalGames}</span>
        </div>
        <div className='flex justify-between border-b border-gray-400/15 py-1'>
            <h1 className='body text-[#8a9bb0] text-[14px]'>Games Completed</h1>
            <span className='mono text-[14px] text-blue-400 font-semibold'>{completedGames.length}</span>
        </div>
        <div className='flex justify-between border-b border-gray-400/15 py-1'>
            <h1 className='body text-[#8a9bb0] text-[14px]'>Currently Playing</h1>
            <span className='mono text-[14px] text-amber-400 font-semibold'>{playingGames}</span>
        </div>
        <div className='flex justify-between border-b border-gray-400/15 py-1'>
            <h1 className='body text-[#8a9bb0] text-[14px]'>In Backlog</h1>
            <span className='mono text-[14px] text-cyan-400 font-semibold'>{backlogGames}</span>
        </div>
        <div className='flex justify-between border-b border-gray-400/15 py-1'>
            <h1 className='body text-[#8a9bb0] text-[14px]'>Total Playtime</h1>
            <span className='mono text-[14px] text-orange-400 font-semibold'>{totalPlaytime}h</span>
        </div>
        <div className='flex justify-between border-b border-gray-400/15 py-1'>
            <h1 className='body text-[#8a9bb0] text-[14px]'>Average Session</h1>
            <span className='mono text-[14px] text-red-400 font-semibold'>~{averageSession}m / game</span>
        </div>
        <div className='flex justify-between border-b border-gray-400/15 py-1'>
            <h1 className='body text-[#8a9bb0] text-[14px]'>Achievements Earned</h1>
            <span className='mono text-[14px] text-green-400 font-semibold'>{earnedAchievements}</span>
        </div>
        <div className='flex justify-between  py-1 mb-2'>
            <h1 className='body text-[#8a9bb0] text-[14px]'>Average Rating</h1>
            <span className='mono text-[14px] text-amber-400 font-semibold'>{averageRating} / 10</span>
        </div>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-5'>
        <div className='w-full bg-[#111620] py-4 px-6 rounded-2xl border border-gray-400/15 flex flex-col gap-3 '>
            <h1 className='body text-lg font-bold mb-5'>Completion Overview</h1>
            <div className='flex justify-around mb-3'>
                <div className='flex flex-col gap-2 items-center'>
                    <div style={{background : `conic-gradient(#4ADE80 ${completionRate}%,#1a2332 0)`}} className='h-23 w-23 rounded-full flex justify-center items-center'>
                        <div className='h-20 w-20 rounded-full bg-[#111620] flex justify-center items-center'>
                            <span className='font-bold text-green-400'>{completionRate}%</span>
                        </div>
                    </div>
                    <span className='body text-[12px] text-[#8a9bb0]'>Completion Rate</span>
                </div>
                <div className='flex flex-col gap-2 items-center'>
                    <div style={{background : `conic-gradient(#C084FC ${achievementRate}%,#1a2332 0)`}} className='h-23 w-23 rounded-full flex justify-center items-center'>
                        <div className='h-20 w-20 rounded-full bg-[#111620] flex justify-center items-center'>
                            <span className='font-bold text-purple-400'>{achievementRate}%</span>
                        </div>
                    </div>
                    <span className='body text-[12px] text-[#8a9bb0]'>Achievement Rate</span>
                </div>
            </div>
        </div>
        <div className='w-full bg-[#111620] py-4 px-6 rounded-2xl border border-gray-400/15 flex flex-col gap-3 '>
            <h1 className='body text-lg font-bold mb-1'>Top Rated Games</h1>
            {   
                totalGames === 0 ? (
                  <div className='flex w-full justify-center items-center'>
                  <div className='p-8 text-center'>
                    <h1 className='font-bold text-xl text-[#8a9bb0]'>
                      No Games Found
                    </h1>
                  <p className='body text-sm text-[#4a5568] mt-2'>
                    Add your first game to get started.
                  </p>
                  </div>
                  </div> )

            : (topRatedGames.map(function(elem,idx){
                    return (
                        <div key={idx} className='flex justify-between items-center'>
                            <div className='flex gap-3 items-center'>   
                                <span className={`font-bold text-lg text-amber-400`}>#{idx+1}</span>
                                <div className='h-10 w-10 flex justify-center items-center bg-amber-500/20 rounded-[8px] border border-amber-500/50'>{elem.title[0]}</div>
                                <div className='flex flex-col justify-start'>
                                    <h1 className='body text-[13px]'>{elem.title}</h1>
                                    <h1 className='body text-[11px] text-[#4a5568]'>{elem.genre}</h1>
                                </div>
                            </div>
                            <span className='text-[11px] mono text-amber-400'>{elem.rating}/10</span>
                        </div>
                    )
                }))
            }
        </div>
      </div>
      <div className='w-full bg-[#111620] py-6 px-6 rounded-2xl border border-gray-400/15 flex flex-col gap-3 mb-5 overflow-y-auto'>
        <h1 className='body text-lg font-bold '>Completed Games</h1>
        <div className='flex flex-wrap gap-2.5'>
            {
                totalGames === 0 ? (
                  <div className='flex w-full justify-center items-center'>
                  <div className='p-8 text-center'>
                    <h1 className='font-bold text-xl text-[#8a9bb0]'>
                      No Games Found
                    </h1>
                  <p className='body text-sm text-[#4a5568] mt-2'>
                    Add your first game to get started.
                  </p>
                  </div>
                  </div>)

                : (completedGames.map(function(elem,idx){
                    return (
                        <div key={idx} className='py-2 px-4 bg-[#080c10] rounded-[8px] flex gap-8'>
                            <div className='flex gap-3 items-center'>
                                <div className='w-2 h-2 bg-amber-400 rounded-full'></div>
                                <div className='flex flex-col'>
                                    <h1 className='body font-semibol text-sm'>{elem.title}</h1>
                                    <h1 className='body text-[11px] text-[#4a5568]'>{elem.playtime}h - {elem.achievementsEarned} Achievements</h1>
                                </div>
                            </div>
                            <div className='mono text-[12px] text-amber-400'>{elem.rating}/10</div>
                        </div>
                    )
                }))
            }
        </div>
      </div>
      {modal && (
        <ProfileModal setModal={setModal} editUser={editUser} setEditUser={setEditUser} editBio={editBio} setEditBio={setEditBio} editPfp={editPfp} setEditPfp={setEditPfp} />
      )}
    </div>
  )
}

export default ProfileContent
