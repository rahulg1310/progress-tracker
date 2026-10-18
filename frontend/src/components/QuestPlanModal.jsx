import React, { useState } from 'react'
import { LoaderCircle, Sparkles } from 'lucide-react'
import { mockDelay, buildMockPlan } from '../mock/aiMockData'
import { toDateKey, formatMinutes } from '../utils/formatTime'

const twoWeeksFromNow = ()=>{
  const d = new Date();
  d.setDate(d.getDate()+13);
  return toDateKey(d);
}

const QuestPlanModal = (props) => {
  const candidates = props.games.filter((elem)=>elem.status!=='Completed' && elem.status!=='Dropped');
  const [gameId, setGameId] = useState(candidates[0]?._id || '');
  const [endDate, setEndDate] = useState(twoWeeksFromNow());
  const [dailyMinutes, setDailyMinutes] = useState(60);
  const [estimatedHours, setEstimatedHours] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const createPlan = async ()=>{
    try{
      const game = candidates.find((elem)=>elem._id===gameId);
      if(!game){
        setError('Please choose a game');
        return;
      }
      const todayKey = toDateKey(new Date());
      if(endDate<=todayKey){
        setError('Deadline must be after today');
        return;
      }
      setError('');
      setLoading(true);
      // MOCK: Phase 3 replaces this with POST /ai/plans (FastAPI planner)
      await mockDelay(900);
      const goalId = `goal-${Date.now()}`;
      const plan = buildMockPlan({
        goalId,
        gameTitle : game.title,
        colorAccent : game.colorAccent,
        startDate : todayKey,
        endDate,
        dailyMinutes,
        estimatedHours
      });
      props.setGoals((prevGoals)=>[
        {_id : goalId, type : 'finish_game', title : `Finish ${game.title}`, targetValue : 100, currentValue : game.progress, gameTitle : game.title, endDate, status : 'active', planId : plan._id},
        ...prevGoals
      ]);
      props.setPlans((prevPlans)=>[plan, ...prevPlans]);
      props.setPlanModal(false);
    }
    catch(error){
      console.log(error);
      setError('Could not create the plan. Please try again.');
    }
    finally{
      setLoading(false);
    }
  }

  return (
    <div className='fixed inset-0 bg-black/70 flex justify-center items-start md:items-center px-4 md:px-8 pt-12 py-4 z-50 overflow-auto'>
      <div className='bg-[#111820] max-w-xl w-full rounded-2xl border border-gray-400/20 flex flex-col gap-3 p-6'>
        <div className='flex justify-between items-center'>
          <h1 className='font-bold text-xl tracking-wider'>Plan a Quest</h1>
          <button
          onClick={()=>{
            props.setPlanModal(false);
          }}
          className='body hover:bg-gray-700 transition-all duration-200 py-1 px-2 rounded'>X</button>
        </div>
        <p className='body text-[13px] text-[#8a9bb0]'>Tell Coach what you want to finish and how much time you have. It builds daily milestones and adjusts them when you miss a day.</p>
        {candidates.length===0 ? (
          <div className='p-6 text-center'>
            <h1 className='font-bold text-xl text-[#8a9bb0]'>No Games to Plan</h1>
            <p className='body text-sm text-[#4a5568] mt-2'>Add a game with status Playing or Backlog in your Library first.</p>
          </div>
        ) : (
          <>
            <div className='w-full flex flex-col gap-1'>
              <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Game</span>
              <select
              onChange={(e)=>{
                setGameId(e.target.value);
              }}
              value={gameId} className='bg-[#080c10] py-1 px-2 rounded-[6px] body text-[15px] border border-white/15 focus:border-green-400 transition-all duration-200'>
                {candidates.map(function(elem){
                  return <option key={elem._id} value={elem._id}>{elem.title} ({elem.progress}%)</option>
                })}
              </select>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='w-full flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Finish By</span>
                <input
                onChange={(e)=>{
                  setEndDate(e.target.value);
                }}
                type="date" value={endDate} className='bg-[#080c10] py-1 px-2 rounded-[6px] text-[15px] body border outline-none border-white/15 focus:border-green-400 transition-all duration-200'/>
              </div>
              <div className='w-full flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Game Length (hours, optional)</span>
                <input
                onChange={(e)=>{
                  if(e.target.value>=0){
                    setEstimatedHours(e.target.value);
                  }
                }}
                type="number" min={0} value={estimatedHours} placeholder='Leave blank to estimate' className='bg-[#080c10] py-1 px-2 rounded-[6px] text-[15px] body border outline-none border-white/15 focus:border-green-400 transition-all duration-200 placeholder:text-[#4a5568]'/>
              </div>
            </div>
            <div className='w-full flex flex-col gap-1'>
              <h1 className='body text-[#8a9bb0] text-[12px] font-semibold'>Daily Time : <span className='text-green-500'>{formatMinutes(dailyMinutes)}</span></h1>
              <input
              onChange={(e)=>{
                setDailyMinutes(Number(e.target.value));
              }}
              type="range" min='15' max='240' step='15' value={dailyMinutes} className='accent-[#00f5a0]'/>
            </div>
            {estimatedHours==='' && (
              <p className='body text-[12px] text-yellow-200/80'>Without a length, Coach uses a rough estimate and labels it clearly as an estimate.</p>
            )}
          </>
        )}
        <span className='body text-[11px] text-[#ff2929]'>{error}</span>
        <div className='flex justify-end gap-8 border-t border-t-gray-600/70 pt-5'>
          <button
          onClick={()=>{
            props.setPlanModal(false);
          }}
          className='font-bold tracking-wider text-white bg-[#080c10] rounded-[7px] py-1.5 hover:opacity-60 transition-all duration-200 px-3'>Cancel</button>
          <button disabled={loading || candidates.length===0}
          onClick={()=>{
            createPlan();
          }}
          className='font-bold tracking-wider text-black bg-linear-to-r from-green-400 to-cyan-400 rounded-[7px] py-1.5 hover:opacity-60 transition-all duration-200 px-3 flex items-center gap-2 disabled:opacity-50'>{loading ? <LoaderCircle size={16} className='animate-spin'/> : <Sparkles size={16}/>}Generate Plan</button>
        </div>
      </div>
    </div>
  )
}

export default QuestPlanModal
