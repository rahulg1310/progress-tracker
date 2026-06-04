import React from 'react'

const SessionGameButton = (props) => {
  return (
    <>
        <button 
        onClick={()=>{
          props.setSelectedGame(props.name);
        }}
        className={`button_border text-[14px] rounded-full px-3 border transition:all duration-200 ${
          props.selectedGame === props.name ? "border-green-400 text-green-400" : "border-white/25 text-white"
        } `}>{props.name}</button>
    </>
  )
}

export default SessionGameButton
