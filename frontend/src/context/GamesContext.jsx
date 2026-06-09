import React, { createContext, useState } from 'react'

export const GamesData = createContext();

const GamesContext = ({children}) => {
  const [games,setGames] = useState(()=>{
    const storedGames=localStorage.getItem('games')
    if(storedGames){
        return JSON.parse(storedGames);
    }
    return [];
  })
  return (
    <div>
      <GamesData.Provider value={{games,setGames}}>
        {children}
      </GamesData.Provider >
    </div>
  )
}

export default GamesContext
