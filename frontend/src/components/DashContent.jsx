import React from 'react'
import ProfileStatsCard from './ProfileStatsCard'
import GameCard from './GameCard'
import LibraryStatus from './LibraryStatus'
import GenreBreakdown from './GenreBreakdown'
import TopByPlaytime from './TopByPlaytime'
import { useContext } from 'react'
import { UserData } from '../context/UserContext'

const DashContent = (props) => {
  const {user} = useContext(UserData);
  return (
    <div className='min-h-screen w-full px-4 md:px-8  xl:px-12 py-5 overflow-y-auto'>
      <div className='flex flex-col gap-6 w-full'>
        <div className='flex justify-between items-center'>
            <div>
                <h1 className='font-bold text-4xl tracking-wider'>Dashboard</h1>
                <h4 className='body text-[13px] text-[#8a9bb0]'>Welcome Back, <span className='text-[#00f5a0]'>{user?.username}</span></h4>
            </div>
            <div>
                <div className='px-3 flex bg-yellow-400/10 rounded-3xl border border-yellow-400/20 justify-center items-center'>
                    <span className='text-2xl'>🔥</span>
                    <div className='py-2 px-4 flex items-center gap-2 '>
                        <h4 className='font-bold text-xl text-yellow-400'>12</h4>
                        <span className='body text-[#8a9bb0] text-xs'>Day Streak</span>
                    </div>
                </div>
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
                    <span className='text-[11px] bg-gray-400/15 rounded-2xl px-2 py-1 text-gray-500 tracking-wider'>5 Games</span>
                </div>
                {props.game_card.map(function(elem,idx){
                    return <GameCard key={idx} name={elem.name} genre={elem.genre} hours={elem.hours} color1={elem.color1} initial={elem.initial} progress={elem.progress} color2={elem.color2} status={elem.status} />
                })}
            </div>
            <div className='w-full xl:w-[320px] flex flex-col min-w-0 gap-4'>
                <div className='w-full bg-[#111620] py-6 px-6 rounded-2xl border border-gray-400/15 flex flex-col gap-6'>
                    <div>
                        <h1 className='font-bold tracking-wider text-[#8a9bb0]'>LIBRARY STATUS</h1>
                    </div>
                    <div className='flex gap-4 px-3 justify-center'>
                        {props.library_status.map(function(elem,idx){
                            return <LibraryStatus key={idx} num={elem.num} cg={elem.cg} color2={elem.color2} status={elem.status} />
                        })}
                    </div>
                </div>
                <div className='w-full bg-[#111620] py-6 px-6 rounded-2xl border border-gray-400/15 flex flex-col gap-6 h-full'>
                    <div>
                        <h1 className='font-bold tracking-wider text-[#8a9bb0]'>GENRE BREAKDOWN</h1>
                    </div>
                    <div className='flex flex-col gap-2'>
                        {props.genre_breakdown.map(function(elem,idx){
                            return <GenreBreakdown key={idx} num={elem.num} progress={elem.progress} genre={elem.genre} />
                        })}
                    </div>
                </div>
            </div>
        </div>
        <div className='w-full flex-1 bg-[#111620] py-4 px-6 rounded-xl border border-gray-400/15 flex flex-col gap-4 '>
            <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                <h1 className='font-bold text-[#8a9bb0] tracking-wider'>TOP BY PLAYTIME</h1>
                <span className='text-[11px] bg-gray-400/15 rounded-2xl px-2 py-1 text-gray-500 tracking-wider'>557h total</span>
            </div>
            <div className='flex flex-col gap-3'>
                {props.top_by_playtime.map(function(elem,idx){
                    return <TopByPlaytime key={idx} name={elem.name} progress={elem.progress} hours={elem.hours} color={elem.color}/>
                })}
            </div>
        </div>
        <div className='w-full flex-1 bg-[#111620] py-4 px-6 rounded-xl border border-gray-400/15 flex flex-col gap-4 '>
            <div>
                <h1 className='font-bold text-[#8a9bb0] tracking-wider'>LEVEL</h1>
            </div>
            <div className='flex gap-7'>
                <div>
                    <div className='h-24 w-24 bg-[conic-gradient(#3b2fe6_85%,#1a2332_0)] rounded-full flex items-center justify-center mb-2'>
                        <div className='w-20 h-20 rounded-full bg-[#111620] flex items-center justify-center'>
                            <span className='font-bold text-[#afabe6] text-xl'>47</span>
                        </div>
                    </div>
                </div>
                <div className='flex flex-col gap-2 w-full'>
                    <div className='flex justify-between'>
                        <h1 className='body text-[14px] text-[#8a9bb0]'>Current XP</h1>
                        <h1 className='mono text-[14px] text-[#e8edf2] font-bold'>8,420</h1>
                    </div>
                    <div className='flex justify-between'>
                        <h1 className='body text-[14px] text-[#8a9bb0]'>Next Level</h1>
                        <h1 className='mono text-[14px] text-[#e8edf2] font-bold'>10,000</h1>
                    </div>
                    <div className='flex justify-between'>
                        <h1 className='body text-[14px] text-[#8a9bb0]'>Remaining</h1>
                        <h1 className='mono text-[14px] text-[#e8edf2] font-bold'>1,580</h1>
                    </div>
                    <div>
                        <div className='w-full h-1.5 rounded-full bg-[#1a2332]'>
                            <div className='w-[85%] h-full rounded-full bg-linear-to-r from-blue-500 to-cyan-500'></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}

export default DashContent
