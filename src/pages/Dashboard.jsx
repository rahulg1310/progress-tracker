import React from 'react'
import Sidebar from '../components/Sidebar'
import DashContent from '../components/DashContent'

const Dashboard = (props) => {
  return (
    <div className='flex min-h-screen bg-[#080c10]'>
      <DashContent profile_stats={props.profile_stats} game_card={props.game_card}/>
    </div>
  )
}

export default Dashboard
