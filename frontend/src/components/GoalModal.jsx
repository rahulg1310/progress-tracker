import React, { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { mockDelay } from '../mock/aiMockData'
import { toDateKey } from '../utils/formatTime'

const endOfWeek = ()=>{
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return toDateKey(d);
}

const GoalModal = (props) => {
  const [type, setType] = useState('weekly_playtime');
  const [target, setTarget] = useState(6);
  const [endDate, setEndDate] = useState(endOfWeek());
  const [targetError, setTargetError] = useState('');
  const [dateError, setDateError] = useState('');
  const [loading, setLoading] = useState(false);

  const targetLabel = {
    weekly_playtime : 'Target (hours)',
    active_days : 'Target (days, 1-7)',
    weekly_sessions : 'Target (sessions)',
  }[type];

  const isValid = ()=>{
    const value = Number(target);
    if(!value || value<=0){
      setTargetError('Please enter a target above 0');
      return false;
    }
    if(type==='active_days' && value>7){
      setTargetError('A week only has 7 days');
      return false;
    }
    if(type==='weekly_playtime' && value>100){
      setTargetError('Please enter 100 hours or less');
      return false;
    }
    if(endDate<toDateKey(new Date())){
      setDateError('End date cannot be in the past');
      return false;
    }
    return true;
  }

  const addGoal = async ()=>{
    try{
      if(!isValid()) return;
      setLoading(true);
      // MOCK: Phase 2 replaces this with POST /ai/goals
      await mockDelay(500);
      const value = Number(target);
      const week = props.insights?.week;
      const goal = {
        weekly_playtime : {title : `Play ${value}h this week`, targetValue : value*60, currentValue : week?.totalMinutes || 0},
        active_days : {title : `Play on ${value} days this week`, targetValue : value, currentValue : week?.activeDays || 0},
        weekly_sessions : {title : `Log ${value} sessions this week`, targetValue : value, currentValue : week?.sessions || 0},
      }[type];
      props.setGoals((prevGoals)=>[
        {_id : `goal-${Date.now()}`, type, gameTitle : '', endDate, status : goal.currentValue>=goal.targetValue ? 'met' : 'active', ...goal},
        ...prevGoals
      ]);
      props.setGoalModal(false);
    }
    catch(error){
      console.log(error);
    }
    finally{
      setLoading(false);
    }
  }

  return (
    <div className='fixed inset-0 bg-black/70 flex justify-center items-start md:items-center px-4 md:px-8 pt-12 py-4 z-50 overflow-auto'>
      <div className='bg-[#111820] max-w-xl w-full rounded-2xl border border-gray-400/20 flex flex-col gap-3 p-6'>
        <div className='flex justify-between items-center'>
          <h1 className='font-bold text-xl tracking-wider'>New Goal</h1>
          <button
          onClick={()=>{
            props.setGoalModal(false);
          }}
          className='body hover:bg-gray-700 transition-all duration-200 py-1 px-2 rounded'>X</button>
        </div>
        <div className='w-full flex flex-col gap-1'>
          <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Goal Type</span>
          <select
          onChange={(e)=>{
            setType(e.target.value);
            setTarget(e.target.value==='weekly_playtime' ? 6 : e.target.value==='active_days' ? 5 : 4);
            setTargetError('');
          }}
          value={type} className='bg-[#080c10] py-1 px-2 rounded-[6px] body text-[15px] border border-white/15 focus:border-green-400 transition-all duration-200'>
            <option value='weekly_playtime'>Weekly Playtime</option>
            <option value='active_days'>Active Days</option>
            <option value='weekly_sessions'>Weekly Sessions</option>
          </select>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='w-full flex flex-col gap-1'>
            <span className='body text-[#8a9bb0] text-[12px] font-semibold'>{targetLabel}</span>
            <input
            onChange={(e)=>{
              if(e.target.value>=0){
                setTarget(e.target.value);
                setTargetError('');
              }
            }}
            type="number" min={1} value={target} className='bg-[#080c10] py-1 px-2 rounded-[6px] text-[15px] body border outline-none border-white/15 focus:border-green-400 transition-all duration-200'/>
            <span className='body text-[11px] text-[#ff2929]'>{targetError}</span>
          </div>
          <div className='w-full flex flex-col gap-1'>
            <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Ends On</span>
            <input
            onChange={(e)=>{
              setEndDate(e.target.value);
              setDateError('');
            }}
            type="date" value={endDate} className='bg-[#080c10] py-1 px-2 rounded-[6px] text-[15px] body border outline-none border-white/15 focus:border-green-400 transition-all duration-200'/>
            <span className='body text-[11px] text-[#ff2929]'>{dateError}</span>
          </div>
        </div>
        <p className='body text-[12px] text-[#4a5568]'>Progress is tracked automatically from the sessions you log.</p>
        <div className='flex justify-end gap-8 border-t border-t-gray-600/70 pt-5'>
          <button
          onClick={()=>{
            props.setGoalModal(false);
          }}
          className='font-bold tracking-wider text-white bg-[#080c10] rounded-[7px] py-1.5 hover:opacity-60 transition-all duration-200 px-3'>Cancel</button>
          <button disabled={loading}
          onClick={()=>{
            addGoal();
          }}
          className='font-bold tracking-wider text-black bg-linear-to-r from-green-400 to-cyan-400 rounded-[7px] py-1.5 hover:opacity-60 transition-all duration-200 px-3 flex items-center gap-2 disabled:opacity-50'>{loading && <LoaderCircle size={16} className='animate-spin'/>}Create Goal</button>
        </div>
      </div>
    </div>
  )
}

export default GoalModal
