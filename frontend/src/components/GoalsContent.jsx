import React, { useContext, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { AiData } from '../context/AiContext'
import { GamesData } from '../context/GamesContext'
import GoalCard from './GoalCard'
import QuestPlanCard from './QuestPlanCard'
import GoalModal from './GoalModal'
import QuestPlanModal from './QuestPlanModal'
import axios from 'axios'
import { aiHeaders } from '../utils/aiRequest'

const GoalsContent = () => {
  const {goals, setGoals, plans, setPlans, plansError, refreshAiData, aiLoading} = useContext(AiData);
  const {games} = useContext(GamesData);
  const [goalModal, setGoalModal] = useState(false);
  const [planModal, setPlanModal] = useState(false);
  const [filter, setFilter] = useState('All');
  const [replanningId, setReplanningId] = useState(null);

  const goalsWithStatus = goals;
  const filteredGoals = goalsWithStatus.filter((elem)=>{
    return filter==='All' || (filter==='Active' && elem.status==='active') || (filter==='Met' && elem.status==='met') || (filter==='Missed' && elem.status==='missed');
  });

  const deleteGoal = async (id)=>{
    try{
      await axios.delete(`${import.meta.env.VITE_API_URL}/ai/goals/${id}`,{headers : aiHeaders()});
      setGoals((prevGoals)=>prevGoals.filter((elem)=>elem._id!==id));
      refreshAiData();
    }
    catch(error){
      console.log(error);
    }
  }

  const deletePlan = async (id)=>{
    try{
      await axios.delete(`${import.meta.env.VITE_API_URL}/ai/plans/${id}`,{headers : aiHeaders()});
      setPlans((prevPlans)=>prevPlans.filter((elem)=>elem._id!==id));
    }
    catch(error){
      console.log(error);
    }
  }

  const replan = async (id)=>{
    try{
      setReplanningId(id);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/ai/plans/${id}/replan`,{},{headers : aiHeaders()});
      setPlans((prevPlans)=>prevPlans.map((elem)=>elem._id===id ? res.data.plan : elem));
    }
    catch(error){
      console.log(error);
    }
    finally{
      setReplanningId(null);
    }
  }

  return (
    <div className='w-full py-5 px-8 md:px-12 flex flex-col gap-6'>
      <div className='w-full flex flex-col md:flex-row md:justify-between md:items-center gap-4'>
        <div className='flex flex-col'>
          <h1 className='font-bold text-4xl tracking-wider'>Goals & Quests</h1>
          <h4 className='body text-[13px] text-[#8a9bb0]'>Set targets and let Coach turn them into a daily plan</h4>
        </div>
        <div className='flex gap-3'>
          <button
          onClick={()=>{
            setGoalModal(true);
          }}
          className='font-bold tracking-wider text-white border border-white/20 rounded-[7px] py-1.5 hover:-translate-y-0.5 hover:bg-gray-800 transition-all duration-200 px-3'>+ New Goal</button>
          <button
          onClick={()=>{
            setPlanModal(true);
          }}
          className='font-bold tracking-wider text-black bg-linear-to-r from-green-400 to-cyan-400 rounded-[7px] py-1.5 hover:-translate-y-0.5 hover:opacity-80 transition-all duration-200 px-3'>+ Plan a Quest</button>
        </div>
      </div>

      {aiLoading ? (
        <div className='flex justify-center py-16'><LoaderCircle className='animate-spin' size={22} color='#8a9bb0'/></div>
      ) : (
        <>
          <div className='flex flex-col gap-3'>
            <div className='flex justify-between items-center flex-wrap gap-3'>
              <h1 className='font-bold text-[#8a9bb0] tracking-wider'>GOALS</h1>
              <div className='flex gap-2 flex-wrap'>
                {['All','Active','Met','Missed'].map(function(elem){
                  return (
                    <button key={elem}
                    onClick={()=>{
                      setFilter(elem);
                    }}
                    className={`button_border text-[14px] rounded-full px-3 border hover:bg-gray-700 transition-all duration-200 ${
                      elem===filter ? 'border-cyan-400 text-cyan-400' : 'border-white/25 text-white'
                    }`}>{elem}</button>
                  )
                })}
              </div>
            </div>
            <div className='flex flex-wrap gap-4'>
              {filteredGoals.length===0 ? (
                <div className='flex w-full justify-center items-center'>
                  <div className='p-8 text-center'>
                    <h1 className='font-bold text-xl text-[#8a9bb0]'>No Goals Found</h1>
                    <p className='body text-sm text-[#4a5568] mt-2'>Create a goal, or ask Coach to set one for you.</p>
                  </div>
                </div>
              ) : (
                filteredGoals.map(function(elem){
                  return <GoalCard key={elem._id} id={elem._id} title={elem.title} type={elem.type} gameTitle={elem.gameTitle} currentValue={elem.currentValue} targetValue={elem.targetValue} endDate={elem.endDate} status={elem.status} deleteGoal={deleteGoal} />
                })
              )}
            </div>
          </div>

          <div className='flex flex-col gap-3 mb-3'>
            <h1 className='font-bold text-[#8a9bb0] tracking-wider'>QUEST PLANS</h1>
            {plansError && (
              <p className='body text-[12px] text-red-300'>{plansError}</p>
            )}
            {plans.length===0 ? (
              <div className='flex w-full justify-center items-center'>
                <div className='p-8 text-center'>
                  <h1 className='font-bold text-xl text-[#8a9bb0]'>No Quest Plans</h1>
                  <p className='body text-sm text-[#4a5568] mt-2'>Plan a quest to get daily milestones for finishing a game.</p>
                </div>
              </div>
            ) : (
              plans.map(function(elem){
                return <QuestPlanCard key={elem._id} plan={elem} replan={replan} replanning={replanningId===elem._id} deletePlan={deletePlan} />
              })
            )}
          </div>
        </>
      )}

      {goalModal && (
        <GoalModal setGoalModal={setGoalModal} setGoals={setGoals} refreshAiData={refreshAiData} />
      )}
      {planModal && (
        <QuestPlanModal setPlanModal={setPlanModal} setPlans={setPlans} games={games} />
      )}
    </div>
  )
}

export default GoalsContent
