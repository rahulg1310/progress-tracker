import React from 'react'
import ProfileStatsCard from './ProfileStatsCard'
import GameCard from './GameCard'
import LibraryStatus from './LibraryStatus'
import GenreBreakdown from './GenreBreakdown'
import TopByPlaytime from './TopByPlaytime'
import { useContext } from 'react'
import { UserData } from '../context/UserContext'
import { GamesData } from '../context/GamesContext'

const DashContent = (props) => {
  const {user} = useContext(UserData);
  const {games} = useContext(GamesData);
  const totalGames = games.length;
  return (
    <div className='min-h-screen w-full px-8 md:px-12 py-5 overflow-y-auto'>
      <div className='flex flex-col gap-6 w-full'>
        <div className='flex justify-between items-center'>
            <div>
                <h1 className='font-bold text-4xl tracking-wider'>Dashboard</h1>
                <h4 className='body text-[13px] text-[#8a9bb0]'>Welcome Back, <span className='text-[#00f5a0] mono'>{user?.username}</span></h4>
            </div>
           
        </div>
        <div className='flex flex-wrap gap-4 w-full'>
            {props.profile_stats.map(function(elem,idx){
                return <ProfileStatsCard key={idx} num={elem.num} title={elem.title} stats={elem.stats} icon={elem.icon} color1={elem.color1} />
            })}
        </div>
        <div className='flex flex-col xl:flex-row gap-4 min-w-0'>
            <div className='flex-1 min-w-0 bg-[#111620] py-4 px-6 rounded-2xl border border-gray-400/15 flex flex-col gap-4'>
                <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                    <h1 className='font-bold text-[#8a9bb0] tracking-wider'>RECENTLY PLAYED</h1>
                    <span className='text-[11px] bg-gray-400/15 rounded-2xl px-2 py-1 text-gray-500 tracking-wider'>{totalGames} Games</span>
                </div>
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

                : (props.game_card.map(function(elem,idx){
                    return <GameCard key={idx} name={elem.name} genre={elem.genre} hours={elem.hours} color1={elem.color1} initial={elem.initial} progress={elem.progress} color2={elem.color2} status={elem.status} />
                }))
                }
            </div>
            <div className='w-full  xl:w-[320px] flex flex-col min-w-0 gap-4'>
                <div className='w-full bg-[#111620] py-6 px-5 rounded-2xl border border-gray-400/15 flex flex-col gap-6'>
                    <div>
                        <h1 className='font-bold tracking-wider text-[#8a9bb0]'>LIBRARY STATUS</h1>
                    </div>
                    <div className='flex gap-3 px-6 justify-center'>
                        {props.library_status.map(function(elem,idx){
                            return <LibraryStatus key={idx} num={elem.num} cg={elem.cg} color2={elem.color2} status={elem.status} />
                        })}
                    </div>
                </div>
                <div className='w-full bg-[#111620] py-6 px-6 rounded-2xl border border-gray-400/15 flex flex-col gap-6 h-full'>
                    <div>
                        <h1 className='font-bold tracking-wider text-[#8a9bb0]'>GENRE BREAKDOWN</h1>
                    </div>
                    <div className='flex flex-col gap-6 md:gap-2'>
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
                        
                        : (props.genre_breakdown.map(function(elem,idx){
                            return <GenreBreakdown key={idx} num={elem.num} progress={elem.progress} genre={elem.genre} />
                        }))
                        }
                    </div>
                </div>
            </div>
        </div>
        <div className='w-full flex-1 bg-[#111620] py-4 px-6 rounded-xl border border-gray-400/15 flex flex-col gap-4 mb-3'>
            <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                <h1 className='font-bold text-[#8a9bb0] tracking-wider'>TOP BY PLAYTIME</h1>
                <span className='text-[11px] bg-gray-400/15 rounded-2xl px-2 py-1 text-gray-500 tracking-wider'>{props.totalPlaytime}h total</span>
            </div>
            <div className='flex flex-col gap-6 md:gap-3'>
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

                : (props.top_by_playtime.map(function(elem,idx){
                    return <TopByPlaytime key={idx} name={elem.name} progress={elem.progress} hours={elem.hours} color={elem.color}/>
                }))
                }
            </div>
        </div>
      </div>
    </div>
  )
}

export default DashContent
