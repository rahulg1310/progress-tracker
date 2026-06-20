import axios from 'axios'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { UserData } from './UserContext';

export const SessionData = createContext();

const SessionContext = ({children}) => {
  const {user} = useContext(UserData);
  const [sessions, setSessions] = useState([]);
  useEffect(()=>{
    if(!user) return;
    const fetchSessions = async ()=>{
        try{
            const token=JSON.parse(localStorage.getItem("token"));
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/sessions`,{
                headers:{
                    Authorization : `Bearer ${token}`
                }
            })
            setSessions(res.data.existingSessions);
        }
        catch(error){
            console.log(error)
        }
        
    }
    fetchSessions();
  },[user])
  return (
    <div>
      <SessionData.Provider value={{sessions,setSessions}}>
        {children}
      </SessionData.Provider>
    </div>
  )
}

export default SessionContext
