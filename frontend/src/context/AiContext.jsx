import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios';
import { UserData } from './UserContext';
import { GamesData } from './GamesContext';
import { SessionData } from './SessionContext';
import { aiHeaders, errorMessage } from '../utils/aiRequest';

export const AiData = createContext();

const AiContext = ({children}) => {
  const {user} = useContext(UserData);
  const {games} = useContext(GamesData);
  const {sessions} = useContext(SessionData);
  const [briefing, setBriefing] = useState(null);
  const [insights, setInsights] = useState(null);
  const [goals, setGoals] = useState([]);
  const [plans, setPlans] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [plansError, setPlansError] = useState('');

  const refreshPlans = async ()=>{
    try{
      setPlansError('');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/ai/plans`,{headers : aiHeaders()});
      setPlans(res.data.plans);
    }
    catch(error){
      console.log(error);
      setPlansError('Could not load your quest plans.');
    }
  }

  // One batched request: the server loads your sessions once and returns everything
  const refreshAiData = async ()=>{
    try{
      setAiError('');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/ai/overview`,{headers : aiHeaders()});
      setInsights(res.data.insights);
      setGoals(res.data.goals);
      setBriefing(res.data.briefing);
      setPlans(res.data.plans);
      setPlansError('');
    }
    catch(error){
      console.log(error);
      setAiError(errorMessage(error, 'Could not load your progress data. Please try again.'));
    }
    finally{
      setAiLoading(false);
    }
  }

  useEffect(()=>{
    if(!user) return;
    setAiLoading(true);
  },[user])

  // Recalculate whenever sessions or games change anywhere in the app (Sessions page, Library, or Coach).
  // The short delay batches the burst of updates that happens on first load.
  useEffect(()=>{
    if(!user) return;
    const timer = setTimeout(()=>{
      refreshAiData();
    },400);
    return ()=>clearTimeout(timer);
  },[user, sessions, games])

  return (
    <div>
      <AiData.Provider value={{briefing, insights, goals, setGoals, plans, setPlans, refreshPlans, refreshAiData, plansError, aiLoading, aiError}}>
        {children}
      </AiData.Provider>
    </div>
  )
}

export default AiContext
