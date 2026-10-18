import React, { useEffect, useState } from 'react'
import { CircleCheck, ShieldAlert, LoaderCircle, Undo2, CircleX, Clock } from 'lucide-react'

const statusConfig = {
  done:      { label: 'Saved',              color: 'text-green-400',  border: 'border-green-400/30' },
  pending:   { label: 'Needs confirmation', color: 'text-yellow-400', border: 'border-yellow-400/40' },
  executing: { label: 'Applying...',        color: 'text-cyan-400',   border: 'border-cyan-400/30' },
  confirmed: { label: 'Confirmed',          color: 'text-green-400',  border: 'border-green-400/30' },
  cancelled: { label: 'Cancelled',          color: 'text-[#8a9bb0]',  border: 'border-white/10' },
  undone:    { label: 'Undone',             color: 'text-[#8a9bb0]',  border: 'border-white/10' },
  expired:   { label: 'Expired',            color: 'text-[#8a9bb0]',  border: 'border-white/10' },
  failed:    { label: 'Failed',             color: 'text-red-400',    border: 'border-red-400/40' },
}

const ActionCard = (props) => {
  const action = props.action;
  const [now, setNow] = useState(Date.now());

  const needsClock = action.status==='done' || action.status==='pending';
  useEffect(()=>{
    if(!needsClock) return;
    const timer = setInterval(()=>{
      setNow(Date.now());
    },1000);
    return ()=>clearInterval(timer);
  },[needsClock])

  const undoLeft = action.undoUntil ? Math.max(0, new Date(action.undoUntil).getTime()-now) : 0;
  const isExpired = action.status==='pending' && action.expiresAt && new Date(action.expiresAt).getTime()<=now;
  const status = isExpired ? 'expired' : action.status;
  const cfg = statusConfig[status] || statusConfig['done'];

  const undoMinutes = Math.floor(undoLeft/60000);
  const undoSeconds = String(Math.floor((undoLeft%60000)/1000)).padStart(2,'0');

  return (
    <div className={`bg-[#0d1117] border ${cfg.border} rounded-xl p-4 flex flex-col gap-3 max-w-md`}>
      <div className='flex justify-between items-center gap-3'>
        <div className='flex items-center gap-2'>
          {status==='pending' ? <ShieldAlert size={17} color='#facc15'/>
          : status==='executing' ? <LoaderCircle size={17} className='animate-spin' color='#22d3ee'/>
          : status==='failed' ? <CircleX size={17} color='#f87171'/>
          : status==='cancelled' || status==='undone' || status==='expired' ? <CircleX size={17} color='#8a9bb0'/>
          : <CircleCheck size={17} color='#4ade80'/>}
          <h1 className='font-bold tracking-wider'>{action.title}</h1>
        </div>
        <span className={`body text-[11px] font-semibold ${cfg.color}`}>{cfg.label}</span>
      </div>

      <div className='flex flex-col gap-1.5'>
        {action.details.map(function(elem,idx){
          return (
            <div key={idx} className='flex justify-between gap-4 body text-[13px]'>
              <span className='text-[#4a5568]'>{elem.label}</span>
              <span className='mono text-[13px] text-right'>{elem.value}</span>
            </div>
          )
        })}
      </div>

      {status==='pending' && (
        <div className='flex justify-end gap-3 border-t border-t-gray-600/40 pt-3'>
          <button
          onClick={()=>{
            props.onCancel();
          }}
          className='font-bold tracking-wider text-white bg-[#080c10] rounded-[7px] py-1 px-3 hover:opacity-60 transition-all duration-200'>Cancel</button>
          <button
          onClick={()=>{
            props.onConfirm();
          }}
          className='font-bold tracking-wider text-black bg-linear-to-r from-green-400 to-cyan-400 rounded-[7px] py-1 px-3 hover:opacity-80 transition-all duration-200'>Confirm</button>
        </div>
      )}

      {status==='done' && undoLeft>0 && (
        <div className='flex justify-between items-center border-t border-t-gray-600/40 pt-3'>
          <span className='body text-[11px] text-[#4a5568] flex items-center gap-1'><Clock size={12}/>Undo available for {undoMinutes}:{undoSeconds}</span>
          <button
          onClick={()=>{
            props.onUndo();
          }}
          className='button_border flex items-center gap-1.5 border border-white/20 rounded-[7px] px-2.5 py-1 hover:bg-gray-700 transition-all duration-200'><Undo2 size={13}/>Undo</button>
        </div>
      )}
    </div>
  )
}

export default ActionCard
