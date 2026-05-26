import React from 'react'
import { Hexagon, Clock, Trophy, Check, Star } from 'lucide-react'
import ProfileStatsCard from './ProfileStatsCard'

const DashContent = (props) => {
  return (
    <div className='min-h-screen w-full px-4 md:px-8  xl:px-12 py-5 overflow-y-auto'>
      <div className='flex flex-col gap-6 w-full'>
        <div className='flex justify-between items-center'>
            <div>
                <h1 className='font-bold text-4xl tracking-wider'>Dashboard</h1>
                <h4 className='body text-[13px] text-[#8a9bb0]'>Welcome Back, <span className='text-[#00f5a0]'>ZOICCY</span></h4>
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
            {props.profile_stats.map(function(elem){
                return <ProfileStatsCard num={elem.num} title={elem.title} stats={elem.stats} icon={elem.icon} color1={elem.color1} />
            })}
        </div>
        <div className='flex flex-col xl:flex-row gap-4 min-w-0'>
            <div className='flex-1 min-w-0 bg-[#111620] py-4 px-6 rounded-2xl border border-gray-400/15 flex flex-col gap-4'>
                <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                    <h1 className='font-bold text-[#8a9bb0] tracking-wider'>RECENTLY PLAYED</h1>
                    <span className='text-[11px] bg-gray-400/15 rounded-2xl px-2 py-1 text-gray-500 tracking-wider'>5 Games</span>
                </div>
                <div className='bg-[#0d1117] border border-white/5 rounded-xl p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                    <div className='flex gap-4 flex-1 min-w-0'>
                        <div className='w-11 h-11 bg-green-300/20 border font-bold border-green-300/20 flex justify-center items-center rounded-[6px] '>E</div>
                        <div className='flex flex-col flex-1 min-w-0'>
                            <h1 className='body font-bold'>Elden Ring</h1>
                            <span className='body text-[#4a5568] text-[11px]'>Action RPG - 94h</span>
                            <div className='h-1 bg-[#1a2332] rounded-full overflow-hidden w-full mt-1'>
                                <div className='h-full w-[67%] bg-green-500 rounded-full'></div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className='body flex flex-col items-end text-[13px]' >
                            <h1 className='text-orange-200'>67%</h1>
                            <h1 className='text-green-400'>PLAYING</h1>
                        </div>
                    </div>
                </div>
                <div className='bg-[#0d1117] border border-white/5 rounded-xl p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                    <div className='flex gap-4 flex-1 min-w-0'>
                        <div className='w-11 h-11 bg-green-300/20 border font-bold border-green-300/20 flex justify-center items-center rounded-[6px] '>S</div>
                        <div className='flex flex-col flex-1 min-w-0'>
                            <h1 className='body font-bold'>Stardew Valley</h1>
                            <span className='body text-[#4a5568] text-[11px]'>Simulation - 210h</span>
                            <div className='h-1 bg-[#1a2332] rounded-full overflow-hidden w-full mt-1'>
                                <div className='h-full w-[55%] bg-green-500 rounded-full'></div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className='body flex flex-col items-end text-[13px]' >
                            <h1 className='text-orange-200'>55%</h1>
                            <h1 className='text-green-400'>PLAYING</h1>
                        </div>
                    </div>
                </div>
                <div className='bg-[#0d1117] border border-white/5 rounded-xl p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                    <div className='flex gap-4 flex-1 min-w-0'>
                        <div className='w-11 h-11 bg-green-300/20 border font-bold border-green-300/20 flex justify-center items-center rounded-[6px] '>H</div>
                        <div className='flex flex-col flex-1 min-w-0'>
                            <h1 className='body font-bold'>Hollow Knight</h1>
                            <span className='body text-[#4a5568] text-[11px]'>Metroidvania - 28h</span>
                            <div className='h-1 bg-[#1a2332] rounded-full overflow-hidden w-full mt-1'>
                                <div className='h-full w-[28%] bg-green-500 rounded-full'></div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className='body flex flex-col items-end text-[13px]' >
                            <h1 className='text-orange-200'>28%</h1>
                            <h1 className='text-green-400'>PLAYING</h1>
                        </div>
                    </div>
                </div>
                <div className='bg-[#0d1117] border border-white/5 rounded-xl p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                    <div className='flex gap-4 flex-1 min-w-0'>
                        <div className='w-11 h-11 bg-green-300/20 border font-bold border-green-300/20 flex justify-center items-center rounded-[6px] '>C</div>
                        <div className='flex flex-col flex-1 min-w-0'>
                            <h1 className='body font-bold'>Cyberpunk  2077</h1>
                            <span className='body text-[#4a5568] text-[11px]'>Action RPG - 42h</span>
                            <div className='h-1 bg-[#1a2332] rounded-full overflow-hidden w-full mt-1'>
                                <div className='h-full w-[27%] bg-red-700 rounded-full'></div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className='body flex flex-col items-end text-[13px]' >
                            <h1 className='text-orange-200'>27%</h1>
                            <h1 className='text-red-700'>DROPPED</h1>
                        </div>
                    </div>
                </div>
                <div className='bg-[#0d1117] border border-white/5 rounded-xl p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                    <div className='flex gap-4 flex-1 min-w-0'>
                        <div className='w-11 h-11 bg-green-300/20 border font-bold border-green-300/20 flex justify-center items-center rounded-[6px] '>S</div>
                        <div className='flex flex-col flex-1 min-w-0'>
                            <h1 className='body font-bold'>Sekiro : Shadow's Die Twice</h1>
                            <span className='body text-[#4a5568] text-[11px]'>Action RPG - 564h</span>
                            <div className='h-1 bg-[#1a2332] rounded-full overflow-hidden w-full mt-1'>
                                <div className='h-full w-[100%] bg-blue-500 rounded-full'></div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className='body flex flex-col items-end text-[13px]' >
                            <h1 className='text-orange-200'>100%</h1>
                            <h1 className='text-blue-400'>COMPLETED</h1>
                        </div>
                    </div>
                </div>
            </div>
            <div className='w-full xl:w-[320px] flex flex-col min-w-0 gap-4'>
                <div className='w-full bg-[#111620] py-6 px-6 rounded-2xl border border-gray-400/15 flex flex-col gap-6'>
                    <div>
                        <h1 className='font-bold tracking-wider text-[#8a9bb0]'>LIBRARY STATUS</h1>
                    </div>
                    <div className='flex gap-4 px-3 justify-center'>
                        <div className='flex flex-col items-center'>
                            <div className='h-16 w-16 bg-[conic-gradient(#00f5a0_35%,#1a2332_0)] rounded-full flex items-center justify-center mb-2'>
                                <div className='w-14 h-14 rounded-full bg-[#111620] flex items-center justify-center'>
                                    <span className='font-bold text-[#00f5a0]'>3</span>
                                </div>
                            </div>
                            <span className='body text-[#4a5568] text-[13px]'>Playing</span>
                        </div>
                        <div className='flex flex-col items-center'>
                            <div className='h-16 w-16 bg-[conic-gradient(#0aa5ff_35%,#1a2332_0)] rounded-full flex items-center justify-center mb-2'>
                                <div className='w-14 h-14 rounded-full bg-[#111620] flex items-center justify-center'>
                                    <span className='font-bold text-[#0aa5ff]'>3</span>
                                </div>
                            </div>
                            <span className='body text-[#4a5568] text-[13px]'>Completed</span>
                        </div>
                        <div className='flex flex-col items-center'>
                            <div className='h-16 w-16 bg-[conic-gradient(#6200ff_15%,#1a2332_0)] rounded-full flex items-center justify-center mb-2'>
                                <div className='w-14 h-14 rounded-full bg-[#111620] flex items-center justify-center'>
                                    <span className='font-bold text-[#6200ff]'>1</span>
                                </div>
                            </div>
                            <span className='body text-[#4a5568] text-[13px]'>Backlog</span>
                        </div>
                        <div className='flex flex-col items-center'>
                            <div className='h-16 w-16 bg-[conic-gradient(#f50000_15%,#1a2332_0)] rounded-full flex items-center justify-center mb-2'>
                                <div className='w-14 h-14 rounded-full bg-[#111620] flex items-center justify-center'>
                                    <span className='font-bold text-[#f50000]'>1</span>
                                </div>
                            </div>
                            <span className='body text-[#4a5568] text-[13px]'>Dropped</span>
                        </div>
                    </div>
                </div>
                <div className='w-full bg-[#111620] py-6 px-6 rounded-2xl border border-gray-400/15 flex flex-col gap-6 h-full'>
                    <div>
                        <h1 className='font-bold tracking-wider text-[#8a9bb0]'>GENRE BREAKDOWN</h1>
                    </div>
                    <div className='flex flex-col gap-2'>
                        <div className='flex flex-col sm:flex-row gap-3 sm:gap-6 sm:items-center'>
                            <span className='body text-xs text-[#8a9bb0] w-[70px] wrap-break-word'>Action RPG</span>
                            <div className='w-[60%] h-1 rounded-full bg-[#1a2332]'>
                                <div className='w-[100%] h-full rounded-full bg-amber-400'>
                                </div>
                            </div>
                            <span className='body text-xs text-[#8a9bb0]'>2</span>
                        </div>
                        <div className='flex flex-col sm:flex-row gap-3 sm:gap-6 sm:items-center'>
                            <span className='body text-xs text-[#8a9bb0] w-[70px] wrap-break-word'>Action RPG</span>
                            <div className='w-[60%] h-1 rounded-full bg-[#1a2332]'>
                                <div className='w-[50%] h-full rounded-full bg-amber-400'>
                                </div>
                            </div>
                            <span className='body text-xs text-[#8a9bb0]'>1</span>
                        </div><div className='flex flex-col sm:flex-row gap-3 sm:gap-6 sm:items-center'>
                            <span className='body text-[11px] text-[#8a9bb0] w-[70px] wrap-break-word'>Metroidvania</span>
                            <div className='w-[60%] h-1 rounded-full bg-[#1a2332]'>
                                <div className='w-[50%] h-full rounded-full bg-amber-400'>
                                </div>
                            </div>
                            <span className='body text-xs text-[#8a9bb0]'>1</span>
                        </div><div className='flex flex-col sm:flex-row gap-3 sm:gap-6 sm:items-center'>
                            <div className='flex flex-col flex-1 min-w-0'>
                                <span className='body text-xs text-[#8a9bb0] w-[70px] wrap-break-word'>Action Adventure</span>
                                
                            </div>
                            <div className='w-[60%] h-1 rounded-full bg-[#1a2332]'>
                                <div className='w-[50%] h-full rounded-full bg-amber-400'>
                                </div>
                            </div>
                            <span className='body text-xs text-[#8a9bb0]'>1</span>
                        </div><div className='flex flex-col sm:flex-row gap-3 sm:gap-6 sm:items-center'>
                            <span className='body text-xs text-[#8a9bb0] w-[70px] wrap-break-word'>Roguelike</span>
                            <div className='w-[60%] h-1 rounded-full bg-[#1a2332]'>
                                <div className='w-[50%] h-full rounded-full bg-amber-400'>  
                                </div>
                            </div>
                            <span className='body text-xs text-[#8a9bb0]'>1</span>
                        </div><div className='flex flex-col sm:flex-row gap-3 sm:gap-6 sm:items-center'>
                            <span className='body text-xs text-[#8a9bb0] w-[70px] wrap-break-word'>RPG</span>
                            <div className='w-[60%] h-1 rounded-full bg-[#1a2332]'>
                                <div className='w-[50%] h-full rounded-full bg-amber-400'>
                                </div>
                            </div>
                            <span className='body text-xs text-[#8a9bb0]'>1</span>
                        </div><div className='flex flex-col sm:flex-row gap-3 sm:gap-6 sm:items-center'>
                            <span className='body text-xs text-[#8a9bb0] w-[70px] wrap-break-word'>Action</span>
                            <div className='w-[60%] h-1 rounded-full bg-[#1a2332]'>
                                <div className='w-[50%] h-full rounded-full bg-amber-400'>
                                </div>
                            </div>
                            <span className='body text-xs text-[#8a9bb0]'>1</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div className='w-full xl:w-[73%] bg-[#111620] py-4 px-6 rounded-xl border border-gray-400/15 flex flex-col gap-4 '>
            <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                <h1 className='font-bold text-[#8a9bb0] tracking-wider'>TOP BY PLAYTIME</h1>
                <span className='text-[11px] bg-gray-400/15 rounded-2xl px-2 py-1 text-gray-500 tracking-wider'>557h total</span>
            </div>
            <div className='flex flex-col gap-3'>
                <div className='flex flex-col sm:flex-row gap-3 sm:gap-6 sm:items-center'>
                    <span className='body text-[13px] text-[#8a9bb0] w-[100px]'>Sekiro</span>
                    <div className='flex-1 h-2 rounded-full bg-[#1a2332]'>
                        <div className='w-[100%] h-full rounded-full bg-amber-400'></div>
                    </div>
                    <span className='body text-xs text-[#4a5568]'>210h</span>
                </div>
                <div className='flex flex-col sm:flex-row gap-3 sm:gap-6 sm:items-center'>
                    <span className='body text-[13px] text-[#8a9bb0] w-[100px] '>Cyberpunk 2077</span>
                    <div className='flex-1 h-2 rounded-full bg-[#1a2332]'>
                        <div className='w-[30%] h-full rounded-full bg-blue-400'></div>
                    </div>
                    <span className='body text-xs text-[#4a5568]'>42h</span>
                </div>
                <div className='flex flex-col sm:flex-row gap-3 sm:gap-6 sm:items-center'>
                    <span className='body text-[13px] text-[#8a9bb0] w-[100px]'>Stardew Valley</span>
                    <div className='w-[80%] h-2 rounded-full bg-[#1a2332]'>
                        <div className='w-[27%] h-full rounded-full bg-green-400'></div>
                    </div>
                    <span className='body text-xs text-[#4a5568]'>21h</span>
                </div>
                <div className='flex flex-col sm:flex-row gap-3 sm:gap-6 sm:items-center'>
                    <span className='body text-[13px] text-[#8a9bb0] w-[100px]'>God Of War</span>
                    <div className='w-[80%] h-2 rounded-full bg-[#1a2332]'>
                        <div className='w-[80%] h-full rounded-full bg-red-400'></div>
                    </div>
                    <span className='body text-xs text-[#4a5568]'>64h</span>
                </div>
                <div className='flex flex-col sm:flex-row gap-3 sm:gap-6 sm:items-center'>
                    <span className='body text-[13px] text-[#8a9bb0] w-[100px] '>Elden Ring</span>
                    <div className='w-[80%] h-2 rounded-full bg-[#1a2332]'>
                        <div className='w-[85%] h-full rounded-full bg-yellow-400'></div>
                    </div>
                    <span className='body text-xs text-[#4a5568]'>190h</span>
                </div>
            </div>
        </div>
        <div className='w-full xl:w-[73%] bg-[#111620] py-4 px-6 rounded-xl border border-gray-400/15 flex flex-col gap-4 '>
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
