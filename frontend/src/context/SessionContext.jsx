import axios from 'axios'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { UserData } from './UserContext';
import LoadModal from '../components/LoadModal';

export const SessionData = createContext();

const SessionContext = ({children}) => {
  const {user} = useContext(UserData);
  const [sessions, setSessions] = useState([]);
  const [loadModal, setLoadModal] = useState(false);
  useEffect(()=>{
    if(!user) return;
    setLoadModal(true);
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
        finally{
          setLoadModal(false);
        }
    }
    fetchSessions();
  },[user])
  return (
    <div>
      <SessionData.Provider value={{sessions,setSessions}}>
        {children}
      </SessionData.Provider>
      {
        loadModal && (<LoadModal />)
      }
    </div>
  )
}

export default SessionContext
