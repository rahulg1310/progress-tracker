import React from 'react'
import { MessageSquare, Plus, Trash2, LoaderCircle } from 'lucide-react'
import { formatRelativeDay } from '../utils/formatTime'

const ConversationList = (props) => {
  return (
    <div className='w-full h-full flex flex-col'>
      <div className='flex justify-between items-center px-4 py-5'>
        <h1 className='font-bold tracking-wider text-[#8a9bb0]'>CHAT HISTORY</h1>
        <button
        onClick={()=>{
          props.onNew();
        }}
        className='hover:bg-gray-800 p-1 rounded-[7px] transition-all duration-200' title='New chat'><Plus size={18} color='#8a9bb0'/></button>
      </div>
      <div className='flex-1 overflow-y-auto px-2 flex flex-col gap-1 pb-4'>
        {props.loading ? (
          <div className='flex justify-center py-6'><LoaderCircle className='animate-spin' size={18} color='#8a9bb0'/></div>
        ) : props.conversations.length===0 ? (
          <p className='body text-[12px] text-[#4a5568] text-center px-4 py-6'>No conversations yet. Start one and it will show up here.</p>
        ) : (
          props.conversations.map(function(elem){
            const isActive = elem._id===props.activeId;
            return (
              <div key={elem._id}
              onClick={()=>{
                props.onSelect(elem._id);
              }}
              className={`group flex items-center gap-2 px-3 py-2 rounded-[8px] cursor-pointer transition-all duration-200 ${
                isActive ? 'bg-gray-800 text-white' : 'text-[#8a9bb0] hover:bg-gray-800/60'
              }`}>
                <MessageSquare size={14} className='shrink-0'/>
                <div className='flex-1 min-w-0'>
                  <h1 className='body text-[13px] truncate'>{elem.title}</h1>
                  <span className='body text-[11px] text-[#4a5568]'>{formatRelativeDay(elem.lastMessageAt)}</span>
                </div>
                <button
                onClick={(e)=>{
                  e.stopPropagation();
                  props.onDelete(elem._id);
                }}
                className='md:opacity-0 md:group-hover:opacity-100 hover:bg-gray-700 p-1 rounded-[6px] transition-all duration-200' title='Delete chat'><Trash2 size={14} color='#948f8f'/></button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default ConversationList
