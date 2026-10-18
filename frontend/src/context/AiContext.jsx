import React, { createContext, useContext, useEffect, useState } from 'react'
import { UserData } from './UserContext';
import { mockDelay, mockBriefing, mockInsights, mockGoals, mockPlans, mockProgression } from '../mock/aiMockData';

export const AiData = createContext();

const AiContext = ({children}) => {
  const {user} = useContext(UserData);
  const [briefing, setBriefing] = useState(null);
  const [insights, setInsights] = useState(null);
  const [goals, setGoals] = useState([]);
  const [plans, setPlans] = useState([]);
  const [progression, setProgression] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(()=>{
    if(!user) return;
    setAiLoading(true);
    const fetchAiData = async ()=>{
      try{
        setAiError('');
        // MOCK: Phase 2 replaces this with axios calls to
        // GET /ai/briefing, /ai/insights, /ai/goals, /ai/plans, /ai/progression
        await mockDelay(600);
        setBriefing(mockBriefing);
        setInsights(mockInsights);
        setGoals(mockGoals);
        setPlans(mockPlans);
        setProgression(mockProgression);
      }
      catch(error){
        console.log(error);
        setAiError('Could not load your AI insights. Please try again.');
      }
      finally{
        setAiLoading(false);
      }
    }
    fetchAiData();
  },[user])

  return (
    <div>
      <AiData.Provider value={{briefing, setBriefing, insights, setInsights, goals, setGoals, plans, setPlans, progression, setProgression, aiLoading, aiError}}>
        {children}
      </AiData.Provider>
    </div>
  )
}

export default AiContext
