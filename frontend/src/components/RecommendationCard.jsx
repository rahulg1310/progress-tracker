import React, { useState } from 'react'
import { Check, Plus, LoaderCircle, CircleCheck } from 'lucide-react'

const RecommendationCard = (props) => {
  const rec = props.rec;
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState('Backlog');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div style={{boxShadow : props.selected ? `0 0 14px ${rec.colorAccent}30` : ''}} className={`w-full flex flex-col overflow-hidden rounded-2xl border bg-[#0e1520] transition-all duration-200 ${
      props.selected ? 'border-cyan-400/50' : 'border-white/10 hover:-translate-y-1'
    }`}>
      <div style={{background : `linear-gradient(135deg, ${rec.colorAccent}30, #1a1f2e)`}}
      className='w-full h-28 relative flex justify-center items-center'>
        {rec.coverImage && !imageFailed ? (
          <img src={rec.coverImage} alt='' loading='lazy' onError={()=>setImageFailed(true)} className='absolute inset-0 w-full h-full object-cover opacity-70'/>
        ) : (
          <span className='font-bold text-6xl opacity-30'>{rec.title[0]}</span>
        )}
        <span className='absolute top-3 right-3 mono text-[12px] font-semibold text-black bg-linear-to-r from-green-400 to-cyan-400 rounded-xl px-2 py-0.5'>{rec.match}% match</span>
      </div>
      <div className='p-4 flex flex-col gap-3 flex-1'>
        <div>
          <h1 className='font-bold text-xl tracking-wider'>{rec.title}</h1>
          <span className='body text-[11px] text-[#4a5568]'>{rec.released} · {rec.estHours ? `~${rec.estHours}h (RAWG average)` : 'length unknown'}{rec.platforms.length ? ` · ${rec.platforms.join(', ')}` : ''}</span>
        </div>
        <div className='flex gap-1.5 flex-wrap'>
          {rec.genres.map(function(elem){
            return <span key={elem} className='body text-[11px] text-[#8a9bb0] bg-gray-400/10 rounded-xl px-2 py-0.5'>{elem}</span>
          })}
        </div>
        <ul className='flex flex-col gap-1.5 flex-1'>
          {rec.reasons.map(function(elem,idx){
            return (
              <li key={idx} className='body text-[13px] flex gap-2'>
                <Check size={14} color='#00f5a0' className='shrink-0 mt-0.5'/>
                <span>{elem}</span>
              </li>
            )
          })}
        </ul>


        {props.added ? (
          <div className='flex items-center gap-2 text-green-400 body text-[13px] border-t border-t-gray-600/40 pt-3'><CircleCheck size={16}/>Added to your Library as {props.addedStatus}</div>
        ) : confirming ? (
          <div className='flex flex-col gap-2 border-t border-t-gray-600/40 pt-3'>
            <span className='body text-[12px] text-[#8a9bb0]'>Add {rec.title} to your Library as:</span>
            <div className='flex gap-2 items-center'>
              <select
              onChange={(e)=>{
                setStatus(e.target.value);
              }}
              value={status} className='bg-[#080c10] py-1 px-2 rounded-[6px] body text-[13px] border border-white/15 focus:border-green-400 transition-all duration-200 flex-1'>
                <option>Backlog</option>
                <option>Playing</option>
              </select>
              <button
              onClick={()=>{
                setConfirming(false);
              }}
              className='font-bold tracking-wider text-white bg-[#080c10] rounded-[7px] py-1 hover:opacity-60 transition-all duration-200 px-2.5'>Cancel</button>
              <button disabled={adding}
              onClick={async ()=>{
                try{
                  setAddError('');
                  setAdding(true);
                  await props.addGame(rec, status);
                  setConfirming(false);
                }
                catch(error){
                  console.log(error);
                  setAddError('Could not add the game. Please try again.');
                }
                finally{
                  setAdding(false);
                }
              }}
              className='font-bold tracking-wider text-black bg-linear-to-r from-green-400 to-cyan-400 rounded-[7px] py-1 hover:opacity-80 transition-all duration-200 px-2.5 flex items-center gap-1'>{adding && <LoaderCircle size={14} className='animate-spin'/>}Add</button>
            </div>
            {addError && <span className='body text-[11px] text-red-300'>{addError}</span>}
          </div>
        ) : (
          <div className='flex gap-2 border-t border-t-gray-600/40 pt-3'>
            <button
            onClick={()=>{
              props.toggleCompare(rec._id);
            }}
            className={`button_border flex-1 border rounded-[7px] px-2.5 py-1.5 hover:bg-gray-700 transition-all duration-200 ${
              props.selected ? 'border-cyan-400 text-cyan-400' : 'border-white/20 text-white'
            }`}>{props.selected ? 'Selected' : 'Compare'}</button>
            <button
            onClick={()=>{
              setConfirming(true);
            }}
            className='button_border flex-1 flex justify-center items-center gap-1 border border-green-400/40 text-green-400 rounded-[7px] px-2.5 py-1.5 hover:bg-gray-700 transition-all duration-200'><Plus size={14}/>Add to Library</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default RecommendationCard
