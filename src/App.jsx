import React from 'react'
import Dashboard from './pages/Dashboard'
import Sidebar from './components/Sidebar'
import { Hexagon, Clock, Trophy, Check, Star } from 'lucide-react'

const App = () => {
  const profile_stats =[
      {
        num : '8',
        title : 'Games Played',
        stats : '3 Completed',
        icon: <Hexagon size={20} color='#47b60c' />,
        color1 : 'bg-green-400/15'
      },
      {
        num : '557h',
        title : 'Total Playtime',
        stats : '~24 Days',
        icon: <Clock size={20} color='#5fc9ec'/>,
        color1 : 'bg-blue-400/15'
      },
      {
        num : '209',
        title : 'Achievements',
        stats : 'Unlocked',
        icon: <Trophy size={20} color='#d127e7'/>,
        color1 : 'bg-purple-700/15'
      },
      {
        num : '38%',
        title : 'Completion Rate',
        stats : '3 Still Playing',
        icon: <Check size={20} color='#e7b427'/>,
        color1 : 'bg-orange-500/15'
      },
      {
        num : '9.3',
        title : 'Avg Rating',
        stats : 'Across Rated Games',
        icon: <Star size={20} color='#e70d0d'/>,
        color1 : 'bg-red-500/15'
      }
    ]
  return (
    <div className='flex h-screen overflow-hidden'>
      <Sidebar />
      <div className='flex-1 overflow-y-auto'>
        <Dashboard profile_stats={profile_stats}/>
      </div>
    </div>
  )
}

export default App
