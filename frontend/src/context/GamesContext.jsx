import React, { createContext, useEffect, useState } from 'react'
import { useContext } from 'react';
import { UserData } from './UserContext';
import axios from 'axios';
import LoadModal from '../components/LoadModal';


export const GamesData = createContext();

const GamesContext = ({children}) => {
  const [loadModal, setLoadModal] = useState(false);
  const [games,setGames] = useState([]);
  const {user} = useContext(UserData);
  useEffect(()=>{
    if(!user) return;
    setLoadModal(true);
    const fetchGames = async ()=>{
      try{
        const token=JSON.parse(localStorage.getItem("token"));
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/games`,{
          headers : {
            Authorization : `Bearer ${token}`
          }
        });
        setGames(res.data.existingGames);
      }
      catch(error){
        console.log(error);
      }
      finally{
        setLoadModal(false);
      }
    }
    fetchGames();
  },[user])
  
  return (
    <div>
      <GamesData.Provider value={{games,setGames}}>
        {children}
      </GamesData.Provider >
      {
        loadModal && (<LoadModal />)
      }
    </div>
  )
}

export default GamesContext
