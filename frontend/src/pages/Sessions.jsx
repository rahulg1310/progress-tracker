import React from 'react'
import Sidebar from '../components/Sidebar'
import SessionContent from '../components/SessionContent'
SessionContent

const Sessions = () => {

  const game_button = [
    {
        name : 'All'
    },
    {
        name : 'Valorant'
    },
    {
        name : 'League Of Legends'
    },
    {
        name : 'Fortnite'
    },
    {
        name : 'Counter Strike : 2'
    },
    {
        name : 'Apex Legends'
    },
    {
        name : 'Overwatch 2'
    },
    {
        name : 'Rainbow Six Siege'
    },
    {
        name : 'Call Of Duty'
    }
  ]
  return (
    <div className='flex min-h-screen w-full bg-[#080c10]'>
        <Sidebar />
        <div className='flex-1 overflow-y-auto'>
            <SessionContent game_button={game_button}/>
        </div>
    </div>
  )
}

export default Sessions
