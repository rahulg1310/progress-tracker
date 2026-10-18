import React, { useContext, useState } from 'react'
import { LoaderCircle, Sparkles, Zap } from 'lucide-react'
import { AiData } from '../context/AiContext'
import LevelCard from './LevelCard'
import StreakCard from './StreakCard'
import BadgeCard from './BadgeCard'
import ChallengeCard from './ChallengeCard'
import { mockDelay, generateMockChallenge } from '../mock/aiMockData'
import { formatRelativeDay } from '../utils/formatTime'

const AchievementsContent = () => {
  const {progression, setProgression, aiLoading} = useContext(AiData);
  const [generating, setGenerating] = useState(false);
  const [badgeFilter, setBadgeFilter] = useState('All');

  if(aiLoading || !progression){
    return (
      <div className='w-full flex justify-center py-24'><LoaderCircle className='animate-spin' size={22} color='#8a9bb0'/></div>
    )
  }

  const earnedCount = progression.badges.filter((elem)=>elem.earned).length;
  const filteredBadges = progression.badges.filter((elem)=>{
    return badgeFilter==='All' || (badgeFilter==='Earned' && elem.earned) || (badgeFilter==='Locked' && !elem.earned);
  });
  const activeChallenges = progression.challenges.filter((elem)=>elem.status==='active').length;

  const newChallenge = async ()=>{
    try{
      setGenerating(true);
      // MOCK: Phase 4 calls POST /ai/challenges (Coach writes the text, rules are validated server-side)
      await mockDelay(900);
      setProgression((prevProgression)=>({
        ...prevProgression,
        challenges : [generateMockChallenge(prevProgression.challenges.length), ...prevProgression.challenges]
      }));
    }
    catch(error){
      console.log(error);
    }
    finally{
      setGenerating(false);
    }
  }

  return (
    <div className='w-full py-5 px-8 md:px-12 flex flex-col gap-6'>
      <div className='flex flex-col'>
        <h1 className='font-bold text-4xl tracking-wider'>Achievements</h1>
        <h4 className='body text-[13px] text-[#8a9bb0]'>Earned from your real sessions, goals and progress</h4>
      </div>

      <div className='flex flex-col lg:flex-row gap-4'>
        <LevelCard level={progression.level} title={progression.title} xp={progression.xp} levelStartXp={progression.levelStartXp} nextLevelXp={progression.nextLevelXp} />
        <StreakCard streak={progression.streak} consistency={progression.consistency} />
      </div>

      <div className='flex flex-col gap-3'>
        <div className='flex justify-between items-center gap-3'>
          <h1 className='font-bold text-[#8a9bb0] tracking-wider'>CHALLENGES <span className='text-[#4a5568]'>· {activeChallenges} active</span></h1>
          <button disabled={generating || activeChallenges>=3}
          onClick={()=>{
            newChallenge();
          }}
          className='font-bold tracking-wider text-black bg-linear-to-r from-green-400 to-cyan-400 rounded-[7px] py-1.5 hover:-translate-y-0.5 hover:opacity-80 transition-all duration-200 px-3 flex items-center gap-2 disabled:opacity-40 disabled:hover:translate-y-0'>
            {generating ? <LoaderCircle size={16} className='animate-spin'/> : <Sparkles size={16}/>}<span className='hidden sm:inline'>New Challenge</span>
          </button>
        </div>
        {activeChallenges>=3 && (
          <p className='body text-[12px] text-[#4a5568]'>You can have up to 3 active challenges. Finish one to get another.</p>
        )}
        <div className='flex flex-wrap gap-4'>
          {progression.challenges.map(function(elem){
            return <ChallengeCard key={elem._id} title={elem.title} description={elem.description} progress={elem.progress} target={elem.target} xp={elem.xp} expiresAt={elem.expiresAt} status={elem.status} />
          })}
        </div>
      </div>

      <div className='flex flex-col gap-3'>
        <div className='flex justify-between items-center flex-wrap gap-3'>
          <h1 className='font-bold text-[#8a9bb0] tracking-wider'>BADGES <span className='text-[#4a5568]'>· {earnedCount}/{progression.badges.length}</span></h1>
          <div className='flex gap-2'>
            {['All','Earned','Locked'].map(function(elem){
              return (
                <button key={elem}
                onClick={()=>{
                  setBadgeFilter(elem);
                }}
                className={`button_border text-[14px] rounded-full px-3 border hover:bg-gray-700 transition-all duration-200 ${
                  elem===badgeFilter ? 'border-yellow-400 text-yellow-400' : 'border-white/25 text-white'
                }`}>{elem}</button>
              )
            })}
          </div>
        </div>
        <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4'>
          {filteredBadges.map(function(elem){
            return <BadgeCard key={elem.code} code={elem.code} name={elem.name} description={elem.description} earned={elem.earned} earnedAt={elem.earnedAt} progress={elem.progress} target={elem.target} />
          })}
        </div>
      </div>

      <div className='w-full bg-[#111620] py-4 px-6 rounded-xl border border-gray-400/15 flex flex-col gap-3 mb-3'>
        <h1 className='font-bold text-[#8a9bb0] tracking-wider'>RECENT XP</h1>
        {progression.recentXp.map(function(elem){
          return (
            <div key={elem._id} className='flex justify-between items-center gap-3'>
              <div className='min-w-0'>
                <h1 className='body text-[14px] truncate'>{elem.label}</h1>
                <span className='body text-[11px] text-[#4a5568]'>{formatRelativeDay(elem.date)}</span>
              </div>
              <span className='mono text-[13px] text-yellow-300 flex items-center gap-1 shrink-0'><Zap size={12}/>+{elem.xp}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AchievementsContent
