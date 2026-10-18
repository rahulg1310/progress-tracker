import React, { createContext, useContext, useEffect, useState } from 'react'
import { UserData } from './UserContext';
import { GamesData } from './GamesContext';
import { mockDelay } from '../mock/aiMockData';
import { mockConversations, mockMessages, mockMemories, mockCoachReply, mockActionFollowUp, newConversationTitle } from '../mock/coachMock';

export const CoachData = createContext();

const CoachContext = ({children}) => {
  const {user} = useContext(UserData);
  const {games} = useContext(GamesData);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [memories, setMemories] = useState([]);
  const [sending, setSending] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(()=>{
    if(!user) return;
    setHistoryLoading(true);
    const fetchHistory = async ()=>{
      try{
        // MOCK: Phase 2 replaces this with GET /ai/conversations and GET /ai/memories
        await mockDelay(400);
        setConversations(mockConversations);
        setMessages(mockMessages);
        setMemories(mockMemories);
      }
      catch(error){
        console.log(error);
      }
      finally{
        setHistoryLoading(false);
      }
    }
    fetchHistory();
  },[user])

  const appendMessage = (conversationId, message)=>{
    setMessages((prevMessages)=>({
      ...prevMessages,
      [conversationId] : [...(prevMessages[conversationId] || []), message]
    }));
    setConversations((prevConversations)=>{
      return prevConversations.map((elem)=>{
        return elem._id===conversationId ? {...elem, lastMessageAt : message.createdAt} : elem;
      }).sort((a,b)=>new Date(b.lastMessageAt)-new Date(a.lastMessageAt));
    });
  }

  const sendMessage = async (text)=>{
    const trimmed = text.trim();
    if(!trimmed || sending) return;

    let conversationId = activeId;
    if(!conversationId){
      conversationId = `conv-${Date.now()}`;
      setConversations((prevConversations)=>[
        {_id : conversationId, title : newConversationTitle(trimmed), lastMessageAt : new Date().toISOString()},
        ...prevConversations
      ]);
      setActiveId(conversationId);
    }

    appendMessage(conversationId, {
      _id : `m-${Date.now()}`,
      role : 'user',
      text : trimmed,
      createdAt : new Date().toISOString()
    });

    setSending(true);
    try{
      // MOCK: Phase 2 replaces this with POST /ai/chat {conversationId, message}
      await mockDelay(900);
      const reply = mockCoachReply(trimmed, games);
      appendMessage(conversationId, reply);
    }
    catch(error){
      console.log(error);
      appendMessage(conversationId, {
        _id : `m-${Date.now()}`,
        role : 'assistant',
        error : true,
        retryText : trimmed,
        text : 'Coach could not respond right now. Please try again.',
        createdAt : new Date().toISOString()
      });
    }
    finally{
      setSending(false);
    }
  }

  const retryMessage = (messageId, retryText)=>{
    setMessages((prevMessages)=>({
      ...prevMessages,
      [activeId] : (prevMessages[activeId] || []).filter((elem)=>elem._id!==messageId)
    }));
    sendMessage(retryText.replace('#fail', ''));
  }

  // status: 'confirmed' | 'cancelled' | 'undone'
  const updateAction = async (messageId, actionId, status)=>{
    const message = (messages[activeId] || []).find((elem)=>elem._id===messageId);
    const target = message?.actions?.find((action)=>action._id===actionId);
    if(!target) return;

    setMessages((prevMessages)=>({
      ...prevMessages,
      [activeId] : (prevMessages[activeId] || []).map((elem)=>{
        if(elem._id!==messageId) return elem;
        return {
          ...elem,
          actions : elem.actions.map((action)=>{
            if(action._id!==actionId) return action;
            return {...action, status : status==='confirmed' ? 'executing' : status};
          })
        }
      })
    }));

    // MOCK: Phase 3 calls POST /ai/actions/:id/confirm | /cancel | /undo
    await mockDelay(status==='confirmed' ? 700 : 300);

    if(status==='confirmed'){
      setMessages((prevMessages)=>({
        ...prevMessages,
        [activeId] : (prevMessages[activeId] || []).map((elem)=>{
          if(elem._id!==messageId) return elem;
          return {
            ...elem,
            actions : elem.actions.map((action)=>action._id===actionId ? {...action, status : 'confirmed'} : action)
          }
        })
      }));
    }
    appendMessage(activeId, mockActionFollowUp(target, status));
  }

  const startNewConversation = ()=>{
    setActiveId(null);
  }

  const deleteConversation = (id)=>{
    // MOCK: Phase 2 calls DELETE /ai/conversations/:id
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

  const deleteMemory = (id)=>{
    // MOCK: Phase 2 calls DELETE /ai/memories/:id
    setMemories((prevMemories)=>prevMemories.filter((elem)=>elem._id!==id));
  }

  const activeMessages = activeId ? (messages[activeId] || []) : [];

  return (
    <div>
      <CoachData.Provider value={{conversations, activeId, setActiveId, activeMessages, memories, sending, historyLoading, sendMessage, retryMessage, updateAction, startNewConversation, deleteConversation, deleteMemory}}>
        {children}
      </CoachData.Provider>
    </div>
  )
}

export default CoachContext
