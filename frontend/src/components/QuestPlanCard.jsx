import React, { useState } from 'react'
import { CircleCheck, Circle, CircleX, CircleDot, CircleSlash, Info, RefreshCw, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { formatMinutes, formatShortDate } from '../utils/formatTime'

const milestoneConfig = {
  done:     { icon: <CircleCheck size={16} color='#4ade80'/>, text: 'text-[#8a9bb0] line-through' },
  today:    { icon: <CircleDot size={16} color='#00d9f5'/>,   text: 'text-white' },
  upcoming: { icon: <Circle size={16} color='#4a5568'/>,      text: 'text-[#8a9bb0]' },
  missed:   { icon: <CircleX size={16} color='#f87171'/>,     text: 'text-red-300' },
  skipped:  { icon: <CircleSlash size={16} color='#4a5568'/>, text: 'text-[#4a5568] line-through' },
}

const QuestPlanCard = (props) => {
  const plan = props.plan;
  const [expanded, setExpanded] = useState(false);
  const doneCount = plan.milestones.filter((elem)=>elem.status==='done').length;
  const missedCount = plan.milestones.filter((elem)=>elem.status==='missed').length;
  const pct = Math.round((doneCount/plan.milestones.length)*100);
  const isEstimate = plan.estimate.source!=='user';

  // Show today and the next few days unless expanded
  const todayIndex = Math.max(0, plan.milestones.findIndex((elem)=>elem.status==='today' || elem.status==='upcoming'));
  const visible = expanded ? plan.milestones : plan.milestones.slice(Math.max(0, todayIndex-2), todayIndex+4);

  return (
    <div className='w-full bg-[#111620] rounded-2xl border border-gray-400/15 overflow-hidden'>
      <div className='h-1 w-full' style={{backgroundColor : plan.colorAccent}}></div>
      <div className='py-5 px-6 flex flex-col gap-4'>
        <div className='flex flex-col md:flex-row md:justify-between md:items-start gap-3'>
          <div>
            <h1 className='font-bold text-2xl tracking-wider'>{plan.gameTitle}</h1>
            <span className='body text-[12px] text-[#8a9bb0]'>{formatShortDate(plan.startDate)} - {formatShortDate(plan.endDate)} · {formatMinutes(plan.dailyMinutes)} a day</span>
          </div>
          <div className='flex gap-2 items-center flex-wrap'>
            <span className={`body text-[11px] font-semibold py-1 px-2.5 rounded-xl ${
              isEstimate ? 'text-yellow-400 bg-yellow-400/10' : 'text-green-400 bg-green-400/10'
            }`}>{isEstimate ? `~${plan.estimate.hours}h · AI estimate` : `${plan.estimate.hours}h · Your estimate`}</span>
            <button
            onClick={()=>{
              props.deletePlan(plan._id);
            }}
            className='body hover:bg-gray-700 transition-all duration-200 p-[5px] rounded-[8px]' title='Delete plan'><Trash2 size={18} color='#948f8f'/></button>
          </div>
        </div>

        {isEstimate && (
          <div className='body text-[12px] text-yellow-200/80 bg-yellow-400/5 border border-yellow-400/20 rounded-xl px-3 py-2 flex gap-2'>
            <Info size={14} className='shrink-0 mt-0.5'/>
            <span>Completion time is uncertain ({plan.estimate.confidence} confidence). {plan.estimate.note} Add your own estimate for a more accurate plan.</span>
          </div>
        )}

        <div className='flex flex-col gap-1'>
          <div className='h-2 bg-[#1a2332] rounded-full overflow-hidden w-full'>
            <div className='h-full rounded-full transition-all duration-500' style={{width : `${pct}%`, backgroundColor : plan.colorAccent}}></div>
          </div>
          <div className='flex justify-between body text-[12px] text-[#8a9bb0]'>
            <span>{doneCount} of {plan.milestones.length} milestones done</span>
            <span className='mono'>{pct}%</span>
          </div>
        </div>

        <p className='body text-[13px] text-[#8a9bb0]'>{plan.feasibility}</p>

        {plan.adjustmentNote && (
          <p className='body text-[12px] text-cyan-300 bg-cyan-400/5 border border-cyan-400/20 rounded-xl px-3 py-2'>Plan v{plan.version}: {plan.adjustmentNote}</p>
        )}

        {missedCount>0 && (
          <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-red-500/5 border border-red-500/20 rounded-xl px-3 py-2'>
            <span className='body text-[12px] text-red-300'>You missed {missedCount} milestone{missedCount>1 ? 's' : ''}. Coach can spread the remaining time over the days left.</span>
            <button
            onClick={()=>{
              props.replan(plan._id);
            }}
            className='button_border w-fit flex items-center gap-1.5 border border-red-400/40 text-red-300 rounded-[7px] px-2.5 py-1 hover:bg-gray-700 transition-all duration-200 shrink-0'><RefreshCw size={13}/>Adjust Plan</button>
          </div>
        )}

        <div className='flex flex-col gap-1'>
          {visible.map(function(elem){
            const cfg = milestoneConfig[elem.status] || milestoneConfig['upcoming'];
            const canToggle = elem.status==='today' || elem.status==='upcoming' || elem.status==='done';
            return (
              <div key={elem._id} className={`flex items-center gap-3 px-3 py-2 rounded-[8px] ${elem.status==='today' ? 'bg-cyan-400/5 border border-cyan-400/20' : ''}`}>
                <button disabled={!canToggle}
                onClick={()=>{
                  props.toggleMilestone(plan._id, elem._id);
                }}
                className='shrink-0 disabled:cursor-default' title={canToggle ? 'Toggle done' : ''}>{cfg.icon}</button>
                <span className='mono text-[12px] text-[#4a5568] w-14 shrink-0'>{formatShortDate(elem.date)}</span>
                <span className={`body text-[13px] flex-1 min-w-0 truncate ${cfg.text}`}>{elem.title}</span>
                <span className='mono text-[12px] text-[#8a9bb0] shrink-0'>{formatMinutes(elem.targetMinutes)}</span>
              </div>
            )
          })}
        </div>
        {plan.milestones.length>visible.length || expanded ? (
          <button
          onClick={()=>{
            setExpanded(!expanded);
          }}
          className='button_border w-fit flex items-center gap-1 text-[#8a9bb0] hover:text-white transition-all duration-200'>
            {expanded ? <>Show less <ChevronUp size={14}/></> : <>Show all {plan.milestones.length} days <ChevronDown size={14}/></>}
          </button>
        ) : null}
      </div>
    </div>
  )
}

export default QuestPlanCard
