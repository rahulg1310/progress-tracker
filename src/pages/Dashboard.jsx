import React from 'react'
import Sidebar from '../components/Sidebar'
import DashContent from '../components/DashContent'

const Dashboard = (props) => {
  return (
    <div className='flex min-h-screen bg-[#080c10]'>
      <DashContent profile_stats={props.profile_stats} game_card={props.game_card} library_status={props.library_status} genre_breakdown={props.genre_breakdown} top_by_playtime={props.top_by_playtime}/>
    </div>
  )
}

export default Dashboard
