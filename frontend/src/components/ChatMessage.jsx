import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, ArrowRight, RotateCcw, TriangleAlert } from 'lucide-react'
import ActionCard from './ActionCard'
import { formatClock } from '../utils/formatTime'

const ChatMessage = (props) => {
  const navigate = useNavigate();
  const message = props.message;

  if(message.role==='user'){
    return (
      <div className='flex flex-col items-end gap-1'>
        <div className='max-w-[85%] md:max-w-[75%] bg-[#1a2332] border border-white/10 rounded-2xl rounded-br-[6px] px-4 py-2.5'>
          <p className='body text-[14px] whitespace-pre-wrap wrap-break-word'>{message.text}</p>
        </div>
        <span className='body text-[10px] text-[#4a5568]'>{formatClock(message.createdAt)}</span>
      </div>
    )
  }

  return (
    <div className='flex gap-3 items-start'>
      <div className={`w-8 h-8 shrink-0 rounded-[8px] flex justify-center items-center border ${
        message.error ? 'bg-red-500/10 border-red-500/20' : 'bg-green-400/10 border-green-400/20'
      }`}>
        {message.error ? <TriangleAlert size={16} color='#f87171'/> : <Bot size={16} color='#00f5a0'/>}
      </div>
      <div className='flex-1 min-w-0 flex flex-col gap-3'>
        <div className={`w-fit max-w-full bg-[#111620] border rounded-2xl rounded-tl-[6px] px-4 py-3 ${
          message.error ? 'border-red-500/30' : 'border-gray-400/15'
        }`}>
          <p className={`body text-[14px] whitespace-pre-wrap wrap-break-word leading-relaxed ${message.error ? 'text-red-300' : ''}`}>{message.text}</p>
          {message.error && (
            <button
            onClick={()=>{
              props.onRetry(message._id, message.retryText);
            }}
            className='button_border mt-3 flex items-center gap-1.5 border border-red-400/40 text-red-300 rounded-[7px] px-2.5 py-1 hover:bg-gray-700 transition-all duration-200'><RotateCcw size={13}/>Retry</button>
          )}
        </div>

        {message.stats && message.stats.length>0 && (
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
            {message.stats.map(function(elem,idx){
              return (
                <div key={idx} className='bg-[#0d1117] border border-white/5 rounded-xl px-3 py-2'>
                  <h1 className='mono text-[16px] text-[#00f5a0]'>{elem.value}</h1>
                  <span className='body text-[11px] text-[#4a5568]'>{elem.label}</span>
                </div>
              )
            })}
          </div>
        )}

        {message.actions && message.actions.map(function(elem){
          return <ActionCard key={elem._id} action={elem}
          onConfirm={()=>{
            props.onAction(message._id, elem._id, 'confirmed');
          }}
          onCancel={()=>{
            props.onAction(message._id, elem._id, 'cancelled');
          }}
          onUndo={()=>{
            props.onAction(message._id, elem._id, 'undone');
          }} />
        })}

        {props.isLatest && message.quickReplies && message.quickReplies.length>0 && (
          <div className='flex gap-2 flex-wrap'>
            {message.quickReplies.map(function(elem,idx){
              return (
                <button key={idx} disabled={props.sending}
                onClick={()=>{
                  props.onQuickReply(elem);
                }}
                className='button_border text-[13px] rounded-full px-3 py-1 border border-cyan-400/40 text-cyan-300 hover:bg-gray-700 transition-all duration-200 disabled:opacity-40'>{elem}</button>
              )
            })}
          </div>
        )}

        {message.links && message.links.length>0 && (
          <div className='flex gap-2 flex-wrap'>
            {message.links.map(function(elem,idx){
              return (
                <button key={idx}
                onClick={()=>{
                  navigate(elem.to);
                }}
                className='button_border flex items-center gap-1 text-[13px] rounded-[7px] px-3 py-1 border border-white/15 text-[#8a9bb0] hover:bg-gray-700 transition-all duration-200'>{elem.label}<ArrowRight size={13}/></button>
              )
            })}
          </div>
        )}

        <span className='body text-[10px] text-[#4a5568]'>{formatClock(message.createdAt)}</span>
      </div>
    </div>
  )
}

export default ChatMessage
