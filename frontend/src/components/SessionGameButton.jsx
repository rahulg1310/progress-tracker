import React from 'react'

const SessionGameButton = (props) => {
  return (
    <>
        <button className='button_border text-[14px] rounded-full px-3 border border-white/25 hover:bg-gray-700 transition:all duration-200 '>{props.name}</button>
    </>
  )
}

export default SessionGameButton
