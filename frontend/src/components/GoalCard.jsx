import React from 'react'
import { Target, Trash2, CalendarDays } from 'lucide-react'
import { goalTypes } from '../mock/aiMockData'
import { formatMinutes, formatShortDate } from '../utils/formatTime'

const statusConfig = {
  active: { label: 'In Progress', color: 'text-cyan-400 bg-cyan-400/10', bar: '#00d9f5' },
  met:    { label: 'Met',         color: 'text-green-400 bg-green-400/10', bar: '#00f5a0' },
  missed: { label: 'Missed',      color: 'text-red-400 bg-red-400/10', bar: '#f87171' },
}

const formatValue = (value, unit) => {
  if (unit === 'minutes') return formatMinutes(value);
  if (unit === 'percent') return `${value}%`;
  return `${value} ${unit}`;
}

const GoalCard = (props) => {
  const cfg = statusConfig[props.status] || statusConfig['active'];
  const unit = goalTypes[props.type]?.unit || '';
  const pct = props.targetValue===0 ? 0 : Math.min(100, Math.round((props.currentValue/props.targetValue)*100));
  return (
    <div className='w-full md:w-[calc(50%-8px)] xl:w-[calc(33.333%-11px)] bg-[#0d1117] border border-white/5 rounded-xl py-4 px-5 flex flex-col gap-3 hover:border-white/13 hover:-translate-y-1 transition-all duration-200 min-w-0'>
      <div className='flex justify-between items-start gap-3'>
        <div className='flex items-center gap-3 min-w-0'>
          <div className='bg-green-400/10 p-2 rounded-xl shrink-0'><Target size={18} color='#00f5a0'/></div>
          <div className='min-w-0'>
            <h1 className='font-bold text-lg line-clamp-2 wrap-break-word'>{props.title}</h1>
            <span className='body text-[11px] text-[#4a5568]'>{goalTypes[props.type]?.label}{props.gameTitle ? ` · ${props.gameTitle}` : ''}</span>
          </div>
        </div>
        <span className={`body text-[11px] font-semibold py-1 px-2.5 rounded-xl shrink-0 ${cfg.color}`}>{cfg.label}</span>
      </div>
      <div className='flex flex-col gap-1'>
        <div className='h-2 bg-[#1a2332] rounded-full overflow-hidden w-full'>
          <div className='h-full rounded-full transition-all duration-500' style={{width : `${pct}%`, backgroundColor : cfg.bar}}></div>
        </div>
        <div className='flex justify-between body text-[12px]'>
          <span className='mono text-[#8a9bb0]'>{formatValue(props.currentValue, unit)} / {formatValue(props.targetValue, unit)}</span>
          <span className='mono text-orange-200'>{pct}%</span>
        </div>
      </div>
      <div className='flex justify-between items-center'>
        <span className='body text-[11px] text-[#4a5568] flex items-center gap-1'><CalendarDays size={12}/>Ends {formatShortDate(props.endDate)}</span>
        <button
        onClick={()=>{
          props.deleteGoal(props.id);
        }}
        className='body hover:bg-gray-700 transition-all duration-200 p-[5px] rounded-[8px]' title='Delete goal'><Trash2 size={18} color='#948f8f'/></button>
      </div>
    </div>
  )
}

export default GoalCard
