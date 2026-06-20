import React, { createContext, useEffect, useState } from 'react'
import { useContext } from 'react';
import { UserData } from './UserContext';
import axios from 'axios';


export const GamesData = createContext();

const GamesContext = ({children}) => {
  const [games,setGames] = useState([]);
  const {user} = useContext(UserData);
  useEffect(()=>{
    if(!user) return;
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
    }
    fetchGames();
  },[user])
  
  return (
    <div>
      <GamesData.Provider value={{games,setGames}}>
        {children}
      </GamesData.Provider >
    </div>
  )
}

export default GamesContext
