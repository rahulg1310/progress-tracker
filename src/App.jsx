import React from 'react'
import Dashboard from './pages/Dashboard'
import Sidebar from './components/Sidebar'
import { Hexagon, Clock, Trophy, Check, Star } from 'lucide-react'

const App = () => {
  let profile_stats =[
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

  let game_card = [
      {
        name : 'Elden Ring',
        genre : 'Action RPG',
        hours : '94h',
        color1 : 'bg-green-500',
        initial : 'E',
        progress : '67%',
        color2 : 'text-green-400',
        status : 'PLAYING'
      },
      {
        name : 'Stardew Valley',
        genre : 'Simulation',
        hours : '210h',
        color1 : 'bg-green-500',
        initial : 'S',
        progress : '55%',
        color2 : 'text-green-400',
        status : 'PLAYING'
      },
      {
        name : 'Hollow Knight',
        genre : 'Metroidvania',
        hours : '8h',
        color1 : 'bg-green-500',
        initial : 'H',
        progress : '28%',
        color2 : 'text-green-400',
        status : 'PLAYING'
      },
      {
        name : 'Cyberpunk 2077',
        genre : 'Action',
        hours : '42h',
        color1 : 'bg-red-700',
        initial : 'C',
        progress : '27%',
        color2 : 'text-red-700',
        status : 'DROPPED'
      },
      {
        name : "Sekiro : Shadow's Die Twice",
        genre : 'Action RPG',
        hours : '564h',
        color1 : 'bg-blue-500',
        initial : 'S',
        progress : '100%',
        color2 : 'text-blue-400',
        status : 'COMPLETED'
      },
  ]

  return (
    <div className='flex h-screen overflow-hidden'>
      <Sidebar />
      <div className='flex-1 overflow-y-auto'>
        <Dashboard profile_stats={profile_stats} game_card={game_card} />
      </div>
    </div>
  )
}

export default App
