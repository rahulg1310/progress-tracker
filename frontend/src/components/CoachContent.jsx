import React, { useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bot, Brain, History, Plus, Sparkles, LoaderCircle } from 'lucide-react'
import { CoachData } from '../context/CoachContext'
import { UserData } from '../context/UserContext'
import ConversationList from './ConversationList'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import MemoryModal from './MemoryModal'

const suggestedPrompts = [
  "I'm stuck on a boss. What should I do?",
  'How can I improve my aim in shooters?',
  'Give me tips for my first Soulslike',
  'What makes a good gaming routine?',
];

const CoachContent = () => {
  const {user} = useContext(UserData);
  const {conversations, activeId, setActiveId, activeMessages, memories, sending, historyLoading, messagesLoading, historyError, sendMessage, retryMessage, updateAction, startNewConversation, deleteConversation, deleteMemory} = useContext(CoachData);
  const location = useLocation();
  const navigate = useNavigate();
  const [input, setInput] = useState(location.state?.prompt || '');
  const [historyModal, setHistoryModal] = useState(false);
  const [memoryModal, setMemoryModal] = useState(false);
  const [slowReply, setSlowReply] = useState(false);
  const bottomRef = useRef(null);

  useEffect(()=>{
    // Clear the prompt passed from the dashboard briefing so a refresh doesn't refill it
    if(location.state?.prompt){
      navigate(location.pathname, {replace : true, state : null});
    }
  },[location, navigate])

  useEffect(()=>{
    bottomRef.current?.scrollIntoView({behavior : 'smooth'});
  },[activeMessages.length, sending])

  // The free AI host sleeps when idle; tell the user if the first reply is slow
  useEffect(()=>{
    if(!sending) return;
    const timer = setTimeout(()=>{
      setSlowReply(true);
    },8000);
    return ()=>{
      clearTimeout(timer);
      setSlowReply(false);
    }
  },[sending])

  const handleSend = (text)=>{
    sendMessage(text);
    setInput('');
  }

  const activeConversation = conversations.find((elem)=>elem._id===activeId);
  const lastAssistantId = [...activeMessages].reverse().find((elem)=>elem.role==='assistant')?._id;

  return (
    <div className='h-full w-full flex'>
      <div className='hidden md:flex w-64 shrink-0 border-r border-r-gray-400/10 bg-[#0b1015]'>
        <ConversationList conversations={conversations} activeId={activeId} loading={historyLoading}
        onSelect={(id)=>{
          setActiveId(id);
        }}
        onNew={()=>{
          startNewConversation();
        }}
        onDelete={deleteConversation} />
      </div>

      {historyModal && (
        <div
        onClick={()=>{
          setHistoryModal(false);
        }}
        className='md:hidden fixed inset-0 bg-black/70 z-50 flex'>
          <div
          onClick={(e)=>{
            e.stopPropagation();
          }}
          className='w-[80%] max-w-xs h-full bg-[#0d1117] border-r border-gray-700'>
            <ConversationList conversations={conversations} activeId={activeId} loading={historyLoading}
            onSelect={(id)=>{
              setActiveId(id);
              setHistoryModal(false);
            }}
            onNew={()=>{
              startNewConversation();
              setHistoryModal(false);
            }}
            onDelete={deleteConversation} />
          </div>
        </div>
      )}

      <div className='flex-1 min-w-0 h-full flex flex-col'>
        <div className='flex justify-between items-center gap-3 px-4 md:px-8 py-4 border-b border-b-gray-400/10'>
          <div className='flex items-center gap-3 min-w-0'>
            <button
            onClick={()=>{
              setHistoryModal(true);
            }}
            className='md:hidden hover:bg-gray-800 p-1.5 rounded-[7px] transition-all duration-200'><History size={20} color='#8a9bb0'/></button>
            <div className='min-w-0'>
              <h1 className='font-bold text-2xl md:text-3xl tracking-wider truncate'>{activeConversation ? activeConversation.title : 'AI Coach'}</h1>
              <h4 className='body text-[12px] text-[#4a5568]'>Coaching, logging, insights and planning from your real data</h4>
            </div>
          </div>
          <div className='flex gap-2 shrink-0'>
            <button
            onClick={()=>{
              setMemoryModal(true);
            }}
            className='button_border flex items-center gap-1.5 border border-white/15 rounded-[7px] px-2.5 py-1.5 hover:bg-gray-700 transition-all duration-200 text-[#8a9bb0]'><Brain size={15}/><span className='hidden sm:inline'>Memory</span></button>
            <button
            onClick={()=>{
              startNewConversation();
            }}
            className='font-bold tracking-wider text-black bg-linear-to-r from-green-400 to-cyan-400 rounded-[7px] py-1.5 px-3 hover:opacity-80 transition-all duration-200 flex items-center gap-1'><Plus size={16}/><span className='hidden sm:inline'>New Chat</span></button>
          </div>
        </div>

        {historyError && (
          <div className='mx-4 md:mx-8 mt-3 body text-[12px] text-red-300 bg-red-500/5 border border-red-500/20 rounded-xl px-3 py-2'>{historyError}</div>
        )}

        <div className='flex-1 min-h-0 overflow-y-auto px-4 md:px-8 py-5'>
          {messagesLoading ? (
            <div className='h-full flex justify-center items-center'><LoaderCircle className='animate-spin' size={22} color='#8a9bb0'/></div>
          ) : activeMessages.length===0 ? (
            <div className='h-full flex flex-col justify-center items-center text-center gap-6 max-w-2xl mx-auto'>
              <div className='bg-green-400/10 border border-green-400/20 p-4 rounded-2xl'>
                <Bot size={32} color='#00f5a0'/>
              </div>
              <div>
                <h1 className='font-bold text-3xl tracking-wider'>Hey <span className='mono text-[#00f5a0]'>{user?.username}</span>, ready to level up?</h1>
                <p className='body text-[13px] text-[#8a9bb0] mt-2'>Ask for help with a tough boss, log a session in plain English, or get a recap of your progress.</p>
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 w-full'>
                {suggestedPrompts.map(function(elem,idx){
                  return (
                    <button key={idx}
                    onClick={()=>{
                      handleSend(elem);
                    }}
                    className='body text-left text-[13px] bg-[#111620] border border-gray-400/15 rounded-xl px-4 py-3 hover:border-green-400/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2'>
                      <Sparkles size={14} color='#00f5a0' className='shrink-0'/>{elem}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className='flex flex-col gap-5 max-w-3xl mx-auto'>
              {activeMessages.map(function(elem){
                return <ChatMessage key={elem._id} message={elem} isLatest={elem._id===lastAssistantId} sending={sending}
                onQuickReply={handleSend}
                onRetry={retryMessage}
                onAction={updateAction} />
              })}
              {sending && (
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 shrink-0 rounded-[8px] bg-green-400/10 border border-green-400/20 flex justify-center items-center'><Bot size={16} color='#00f5a0'/></div>
                  <div className='flex gap-1.5 bg-[#111620] border border-gray-400/15 rounded-2xl px-4 py-3'>
                    <span className='w-1.5 h-1.5 rounded-full bg-[#8a9bb0] animate-bounce'></span>
                    <span className='w-1.5 h-1.5 rounded-full bg-[#8a9bb0] animate-bounce [animation-delay:150ms]'></span>
                    <span className='w-1.5 h-1.5 rounded-full bg-[#8a9bb0] animate-bounce [animation-delay:300ms]'></span>
                  </div>
                  {slowReply && (
                    <span className='body text-[11px] text-[#4a5568]'>Waking Coach up. The first reply can take up to a minute.</span>
                  )}
                </div>
              )}
              <div ref={bottomRef}></div>
            </div>
          )}
        </div>

        <ChatInput input={input} setInput={setInput} sending={sending} onSend={handleSend} />
      </div>

      {memoryModal && (
        <MemoryModal memories={memories} setMemoryModal={setMemoryModal} deleteMemory={deleteMemory} />
      )}
    </div>
  )
}

export default CoachContent
