import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios';
import { UserData } from './UserContext';
import { mockDelay } from '../mock/aiMockData';
import { mockActionFollowUp } from '../mock/coachMock';

export const CoachData = createContext();

// Messages typed before the first reply arrives belong to a conversation that doesn't exist yet
const DRAFT = 'draft';

const aiHeaders = ()=>{
  const token = JSON.parse(localStorage.getItem("token"));
  return {
    Authorization : `Bearer ${token}`,
    'X-Timezone' : Intl.DateTimeFormat().resolvedOptions().timeZone
  }
}

const errorMessage = (error, fallback)=>{
  return error.response?.data?.message || fallback;
}

const CoachContext = ({children}) => {
  const {user} = useContext(UserData);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [memories, setMemories] = useState([]);
  const [sending, setSending] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  useEffect(()=>{
    if(!user) return;
    setHistoryLoading(true);
    const fetchHistory = async ()=>{
      try{
        setHistoryError('');
        const [conversationRes, memoryRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/ai/conversations`,{headers : aiHeaders()}),
          axios.get(`${import.meta.env.VITE_API_URL}/ai/memories`,{headers : aiHeaders()})
        ]);
        setConversations(conversationRes.data.conversations);
        setMemories(memoryRes.data.memories);
      }
      catch(error){
        console.log(error);
        setHistoryError(errorMessage(error, 'Could not load your chat history.'));
      }
      finally{
        setHistoryLoading(false);
      }
    }
    fetchHistory();
  },[user])

  const openConversation = async (id)=>{
    setActiveId(id);
    if(!id || messages[id]) return;
    setMessagesLoading(true);
    try{
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/ai/conversations/${id}/messages`,{headers : aiHeaders()});
      setMessages((prevMessages)=>({...prevMessages, [id] : res.data.messages}));
    }
    catch(error){
      console.log(error);
      if(error.response?.status===404){
        setConversations((prevConversations)=>prevConversations.filter((elem)=>elem._id!==id));
        setActiveId(null);
      }
    }
    finally{
      setMessagesLoading(false);
    }
  }

  const sendMessage = async (text)=>{
    const trimmed = text.trim();
    if(!trimmed || sending) return;

    const conversationId = activeId;
    const key = conversationId || DRAFT;
    const pendingMessage = {
      _id : `local-${Date.now()}`,
      role : 'user',
      text : trimmed,
      createdAt : new Date().toISOString()
    };
    setMessages((prevMessages)=>({...prevMessages, [key] : [...(prevMessages[key] || []), pendingMessage]}));
    setSending(true);

    try{
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/ai/chat`,
        conversationId ? {message : trimmed, conversationId} : {message : trimmed},
        {headers : aiHeaders()}
      );
      const {conversation, userMessage, assistantMessage} = res.data;
      setMessages((prevMessages)=>{
        const copy = {...prevMessages};
        const previous = key===DRAFT ? [] : (copy[key] || []).filter((elem)=>elem._id!==pendingMessage._id);
        delete copy[DRAFT];
        copy[conversation._id] = [...previous, userMessage, assistantMessage];
        return copy;
      });
      setConversations((prevConversations)=>[
        conversation, ...prevConversations.filter((elem)=>elem._id!==conversation._id)
      ]);
      if(!conversationId){
        setActiveId(conversation._id);
      }
    }
    catch(error){
      console.log(error);
      setMessages((prevMessages)=>({
        ...prevMessages,
        [key] : [...(prevMessages[key] || []), {
          _id : `error-${Date.now()}`,
          role : 'assistant',
          error : true,
          retryText : trimmed,
          failedMessageId : pendingMessage._id,
          text : errorMessage(error, 'Coach could not respond right now. Please try again.'),
          createdAt : new Date().toISOString()
        }]
      }));
    }
    finally{
      setSending(false);
    }
  }

  const retryMessage = (messageId, retryText)=>{
    const key = activeId || DRAFT;
    const failed = (messages[key] || []).find((elem)=>elem._id===messageId);
    setMessages((prevMessages)=>({
      ...prevMessages,
      [key] : (prevMessages[key] || []).filter((elem)=>elem._id!==messageId && elem._id!==failed?.failedMessageId)
    }));
    sendMessage(retryText);
  }

  // MOCK until Phase 3: the agent doesn't return action cards yet.
  // Phase 3 calls POST /ai/actions/:id/confirm | /cancel | /undo here.
  const updateAction = async (messageId, actionId, status)=>{
    const key = activeId || DRAFT;
    const message = (messages[key] || []).find((elem)=>elem._id===messageId);
    const target = message?.actions?.find((action)=>action._id===actionId);
    if(!target) return;
    const setStatus = (value)=>{
      setMessages((prevMessages)=>({
        ...prevMessages,
        [key] : (prevMessages[key] || []).map((elem)=>{
          if(elem._id!==messageId) return elem;
          return {...elem, actions : elem.actions.map((action)=>action._id===actionId ? {...action, status : value} : action)};
        })
      }));
    }
    setStatus(status==='confirmed' ? 'executing' : status);
    await mockDelay(status==='confirmed' ? 700 : 300);
    if(status==='confirmed') setStatus('confirmed');
    setMessages((prevMessages)=>({...prevMessages, [key] : [...(prevMessages[key] || []), mockActionFollowUp(target, status)]}));
  }

  const startNewConversation = ()=>{
    setActiveId(null);
    setMessages((prevMessages)=>{
      const copy = {...prevMessages};
      delete copy[DRAFT];
      return copy;
    });
  }

  const deleteConversation = async (id)=>{
    try{
      await axios.delete(`${import.meta.env.VITE_API_URL}/ai/conversations/${id}`,{headers : aiHeaders()});
      setConversations((prevConversations)=>prevConversations.filter((elem)=>elem._id!==id));
      setMessages((prevMessages)=>{
        const copy = {...prevMessages};
        delete copy[id];
        return copy;
      });
      if(activeId===id){
        setActiveId(null);
      }
    }
    catch(error){
      console.log(error);
    }
  }

  const deleteMemory = async (id)=>{
    try{
      await axios.delete(`${import.meta.env.VITE_API_URL}/ai/memories/${id}`,{headers : aiHeaders()});
      setMemories((prevMemories)=>prevMemories.filter((elem)=>elem._id!==id));
    }
    catch(error){
      console.log(error);
    }
  }

  const activeMessages = messages[activeId || DRAFT] || [];

  return (
    <div>
      <CoachData.Provider value={{conversations, activeId, setActiveId : openConversation, activeMessages, memories, sending, historyLoading, messagesLoading, historyError, sendMessage, retryMessage, updateAction, startNewConversation, deleteConversation, deleteMemory}}>
        {children}
      </CoachData.Provider>
    </div>
  )
}

export default CoachContext
