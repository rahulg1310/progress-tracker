import React from 'react'
import Sidebar from '../components/Sidebar'
import DashContent from '../components/DashContent'
import { Hexagon, Clock, Trophy, Check, Star } from 'lucide-react'

const Dashboard = () => {
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

    let library_status = [
        {
          num : '3',
          cg : 'conic-gradient(#00f5a0 35%,#1a2332 0)',
          color2 : 'text-[#00f5a0]',
          status : 'Playing'
        },
        {
          num : '3',
          cg : 'conic-gradient(#0aa5ff 35%,#1a2332 0)',
          color2 : 'text-[#0aa5ff]',
          status : 'Completed'
        },
        {
          num : '1',
          cg : 'conic-gradient(#6200ff 15%,#1a2332 0)',
          color2 : 'text-[#6200ff]',
          status : 'Backlog'
        },
        {
          num : '1',
          cg : 'conic-gradient(#f50000 15%,#1a2332 0)',
          color2 : 'text=[#f50000]',
          status : 'Dropped'
        }
  ]

    let genre_breakdown = [
        {
          num : '2',
          genre : 'Action RPG',
          progress : '100%'
        },
        {
          num : '1',
          genre : 'Metroidvania',
          progress : '50%'
        },
        {
          num : '1',
          genre : 'Action Adventure',
          progress : '50%'
        },
        {
          num : '1',
          genre : 'Roguelike',
          progress : '50%'
        },
        {
          num : '1',
          genre : 'RPG',
          progress : '50%'
        },
        {
          num : '1',
          genre : 'Action',
          progress : '50%'
        }
  ]

    let top_by_playtime = [
        {
          name : 'Sekiro',
          progress : 'w-[100%]',
          color : 'bg-amber-400',
          hours : '210h'
        },
        {
          name : 'Cyberpunk 2077',
          progress : 'w-[30%]',
          color : 'bg-blue-400',
          hours : '42h'
        },
        {
          name : 'Stardew Valley',
          progress : 'w-[27%]',
          color : 'bg-green-400',
          hours : '21h'
        },
        {
          name : 'God Of War',
          progress : 'w-[80%]',
          color : 'bg-red-400',
          hours : '64h'
        },
        {
          name : 'Elden Ring',
          progress : 'w-[85%]',
          color : 'bg-yellow-400',
          hours : '190h'
        }
  ]


  return (
    <div className='flex min-h-screen bg-[#080c10]'>
      <Sidebar />
      <div className='flex-1 overflow-y-auto'>
        <DashContent profile_stats={profile_stats} game_card={game_card} library_status={library_status} genre_breakdown={genre_breakdown} top_by_playtime={top_by_playtime}/>
      </div>
    </div>
  )
}

export default Dashboard
