import React from 'react'
import { Trash2 } from 'lucide-react'
import { formatRelativeDay } from '../utils/formatTime'

const kindConfig = {
  preference: 'text-cyan-400 bg-cyan-400/10',
  context:    'text-purple-400 bg-purple-400/10',
  struggle:   'text-red-400 bg-red-400/10',
  goal:       'text-green-400 bg-green-400/10',
}

const MemoryModal = (props) => {
  return (
    <div className='fixed inset-0 bg-black/70 flex justify-center items-start md:items-center px-4 md:px-8 pt-12 py-4 z-50 overflow-auto'>
      <div className='bg-[#111820] max-w-2xl w-full rounded-2xl border border-gray-400/20 flex flex-col gap-4 p-6'>
        <div className='flex justify-between items-center'>
          <h1 className='font-bold text-xl tracking-wider'>What Coach Remembers</h1>
          <button
          onClick={()=>{
            props.setMemoryModal(false);
          }}
          className='body hover:bg-gray-700 transition-all duration-200 py-1 px-2 rounded'>X</button>
        </div>
        <p className='body text-[13px] text-[#8a9bb0]'>Coach uses these notes to personalise advice across conversations. Delete anything you don't want it to remember.</p>
        <div className='flex flex-col gap-2 max-h-[60vh] overflow-y-auto'>
          {props.memories.length===0 ? (
            <div className='p-8 text-center'>
              <h1 className='font-bold text-xl text-[#8a9bb0]'>Nothing Remembered Yet</h1>
              <p className='body text-sm text-[#4a5568] mt-2'>Useful details from your chats will appear here.</p>
            </div>
          ) : (
            props.memories.map(function(elem){
              return (
                <div key={elem._id} className='flex items-start justify-between gap-3 bg-[#0d1117] border border-white/5 rounded-xl px-4 py-3'>
                  <div className='flex flex-col gap-1.5 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <span className={`body text-[11px] font-semibold capitalize px-2 py-0.5 rounded-xl ${kindConfig[elem.kind] || kindConfig['context']}`}>{elem.kind}</span>
                      <span className='body text-[11px] text-[#4a5568]'>{formatRelativeDay(elem.createdAt)}</span>
                    </div>
                    <p className='body text-[14px] wrap-break-word'>{elem.text}</p>
                  </div>
                  <button
                  onClick={()=>{
                    props.deleteMemory(elem._id);
                  }}
                  className='body hover:bg-gray-700 transition-all duration-200 p-[5px] rounded-[8px] shrink-0' title='Forget this'><Trash2 size={18} color='#948f8f'/></button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default MemoryModal
