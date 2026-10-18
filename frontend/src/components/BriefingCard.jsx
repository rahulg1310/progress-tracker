import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, X, ArrowRight } from 'lucide-react'
import { AiData } from '../context/AiContext'

const toneConfig = {
  cyan:   'text-cyan-400',
  orange: 'text-orange-400',
  green:  'text-green-400',
  red:    'text-red-400',
}

const greeting = ()=>{
  const hour = new Date().getHours();
  if(hour<12) return 'Good morning';
  if(hour<17) return 'Good afternoon';
  return 'Good evening';
}

const readDismissed = ()=>{
  try{
    return localStorage.getItem('briefingDismissed');
  }
  catch{
    return null;
  }
}

const BriefingCard = () => {
  const navigate = useNavigate();
  const {briefing, aiLoading} = useContext(AiData);
  const [dismissedDate, setDismissedDate] = useState(readDismissed());

  if(aiLoading){
    return (
      <div className='w-full bg-[#111620] py-5 px-6 rounded-2xl border border-gray-400/15 flex flex-col gap-3 animate-pulse'>
        <div className='h-4 w-40 bg-[#1a2332] rounded'></div>
        <div className='h-6 w-3/4 bg-[#1a2332] rounded'></div>
        <div className='h-4 w-1/2 bg-[#1a2332] rounded'></div>
      </div>
    )
  }

  if(!briefing || dismissedDate===briefing.date) return null;

  return (
    <div className='relative w-full overflow-hidden rounded-2xl border border-green-400/20 bg-linear-to-r from-green-400/10 via-[#111620] to-cyan-400/10 py-5 px-6 flex flex-col gap-4'>
      <button
      onClick={()=>{
        try{
          localStorage.setItem('briefingDismissed', briefing.date);
        }
        catch(error){
          console.log(error);
        }
        setDismissedDate(briefing.date);
      }}
      className='absolute top-3 right-3 hover:bg-gray-700 p-1 rounded-[6px] transition-all duration-200' title='Hide for today'><X size={16} color='#8a9bb0'/></button>
      <div className='flex flex-col gap-1 pr-8'>
        <span className='body text-[12px] text-[#00f5a0] flex items-center gap-1.5 font-semibold tracking-wide'><Sparkles size={13}/>{greeting().toUpperCase()} · TODAY'S BRIEFING</span>
        <h1 className='font-bold text-2xl tracking-wider'>{briefing.headline}</h1>
        <p className='body text-[13px] text-[#8a9bb0]'>{briefing.text}</p>
      </div>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div className='flex gap-6 flex-wrap'>
          {briefing.items.map(function(elem,idx){
            return (
              <div key={idx} className='flex flex-col'>
                <span className={`mono text-[16px] ${toneConfig[elem.tone] || 'text-white'}`}>{elem.value}</span>
                <span className='body text-[11px] text-[#4a5568]'>{elem.label}</span>
              </div>
            )
          })}
        </div>
        <button
        onClick={()=>{
          navigate('/coach', {state : {prompt : briefing.prompt}});
        }}
        className='w-fit font-bold tracking-wider text-black bg-linear-to-r from-green-400 to-cyan-400 rounded-[7px] py-1.5 hover:-translate-y-0.5 hover:opacity-80 transition-all duration-200 px-3 flex items-center gap-1'>Ask Coach <ArrowRight size={15}/></button>
      </div>
    </div>
  )
}

export default BriefingCard
