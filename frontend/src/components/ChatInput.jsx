import React, { useEffect, useRef } from 'react'
import { SendHorizontal, LoaderCircle } from 'lucide-react'

const MAX_LENGTH = 1000;

const ChatInput = (props) => {
  const textareaRef = useRef(null);

  // Grow the textarea with its content, up to ~6 lines
  useEffect(()=>{
    const el = textareaRef.current;
    if(!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  },[props.input])

  const canSend = props.input.trim()!=='' && !props.sending;

  return (
    <div className='px-4 md:px-8 pb-4 pt-2'>
      <div className='max-w-3xl mx-auto flex items-end gap-2 bg-[#111820] rounded-2xl border border-white/10 focus-within:border-green-400 transition-all duration-200 px-3 py-2'>
        <textarea ref={textareaRef} rows={1} maxLength={MAX_LENGTH}
        onChange={(e)=>{
          props.setInput(e.target.value);
        }}
        onKeyDown={(e)=>{
          if(e.key==='Enter' && !e.shiftKey){
            e.preventDefault();
            if(canSend) props.onSend(props.input);
          }
        }}
        value={props.input} placeholder='Ask Coach about a game, a boss or your build...' className='flex-1 resize-none bg-transparent body text-[14px] outline-none placeholder:text-[#4a5568] py-1.5 max-h-40'/>
        <button disabled={!canSend}
        onClick={()=>{
          props.onSend(props.input);
        }}
        className='shrink-0 text-black bg-linear-to-r from-green-400 to-cyan-400 rounded-[9px] p-2 hover:opacity-80 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed' title='Send'>
          {props.sending ? <LoaderCircle size={18} className='animate-spin'/> : <SendHorizontal size={18}/>}
        </button>
      </div>
      <div className='max-w-3xl mx-auto flex justify-between mt-1.5 px-1'>
        <span className='body text-[10px] text-[#4a5568]'>Enter to send, Shift+Enter for a new line. Updates and deletes always ask first.</span>
        {props.input.length>MAX_LENGTH*0.8 && (
          <span className='body text-[10px] text-[#4a5568]'>{props.input.length}/{MAX_LENGTH}</span>
        )}
      </div>
    </div>
  )
}

export default ChatInput
