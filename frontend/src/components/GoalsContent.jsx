import React, { useContext, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { AiData } from '../context/AiContext'
import { GamesData } from '../context/GamesContext'
import GoalCard from './GoalCard'
import QuestPlanCard from './QuestPlanCard'
import GoalModal from './GoalModal'
import QuestPlanModal from './QuestPlanModal'
import { replanMock } from '../mock/aiMockData'
import { toDateKey } from '../utils/formatTime'

const GoalsContent = () => {
  const {goals, setGoals, plans, setPlans, insights, aiLoading} = useContext(AiData);
  const {games} = useContext(GamesData);
  const [goalModal, setGoalModal] = useState(false);
  const [planModal, setPlanModal] = useState(false);
  const [filter, setFilter] = useState('All');

  const todayKey = toDateKey(new Date());
  const goalsWithStatus = goals.map((elem)=>{
    if(elem.currentValue>=elem.targetValue) return {...elem, status : 'met'};
    if(elem.endDate<todayKey) return {...elem, status : 'missed'};
    return {...elem, status : 'active'};
  });
  const filteredGoals = goalsWithStatus.filter((elem)=>{
    return filter==='All' || (filter==='Active' && elem.status==='active') || (filter==='Met' && elem.status==='met') || (filter==='Missed' && elem.status==='missed');
  });

  // MOCK: Phase 2 calls DELETE /ai/goals/:id
  const deleteGoal = (id)=>{
    const goal = goals.find((elem)=>elem._id===id);
    setGoals((prevGoals)=>prevGoals.filter((elem)=>elem._id!==id));
    if(goal?.planId){
      setPlans((prevPlans)=>prevPlans.filter((elem)=>elem._id!==goal.planId));
    }
  }

  const deletePlan = (id)=>{
    setPlans((prevPlans)=>prevPlans.filter((elem)=>elem._id!==id));
    setGoals((prevGoals)=>prevGoals.filter((elem)=>elem.planId!==id));
  }

  // MOCK: Phase 3 marks milestones automatically from logged sessions
  const toggleMilestone = (planId, milestoneId)=>{
    setPlans((prevPlans)=>prevPlans.map((plan)=>{
      if(plan._id!==planId) return plan;
      return {
        ...plan,
        milestones : plan.milestones.map((elem)=>{
          if(elem._id!==milestoneId) return elem;
          if(elem.status==='done') return {...elem, status : elem.date===todayKey ? 'today' : 'upcoming'};
          return {...elem, status : 'done'};
        })
      }
    }));
  }

  // MOCK: Phase 3 calls POST /ai/plans/:id/replan
  const replan = (planId)=>{
    setPlans((prevPlans)=>prevPlans.map((plan)=>plan._id===planId ? replanMock(plan) : plan));
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
                    <p className='body text-sm text-[#4a5568] mt-2'>Create a goal to start tracking it.</p>
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
            {plans.length===0 ? (
              <div className='flex w-full justify-center items-center'>
                <div className='p-8 text-center'>
                  <h1 className='font-bold text-xl text-[#8a9bb0]'>No Quest Plans</h1>
                  <p className='body text-sm text-[#4a5568] mt-2'>Plan a quest to get daily milestones for finishing a game.</p>
                </div>
              </div>
            ) : (
              plans.map(function(elem){
                return <QuestPlanCard key={elem._id} plan={elem} toggleMilestone={toggleMilestone} replan={replan} deletePlan={deletePlan} />
              })
            )}
          </div>
        </>
      )}

      {goalModal && (
        <GoalModal setGoalModal={setGoalModal} setGoals={setGoals} insights={insights} />
      )}
      {planModal && (
        <QuestPlanModal setPlanModal={setPlanModal} setGoals={setGoals} setPlans={setPlans} games={games} />
      )}
    </div>
  )
}

export default GoalsContent
