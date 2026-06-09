import React, { useContext } from 'react'
import Sidebar from '../components/Sidebar'
import DashContent from '../components/DashContent'
import { Hexagon, Clock, Trophy, Check, Star } from 'lucide-react'
import { GamesData } from '../context/GamesContext'
const Dashboard = () => {
  const {games} = useContext(GamesData);
  const totalGames = games.length;
  const totalPlayTime = games.reduce((sum,elem)=>{
    return sum+elem.playtime;
  },0)
  const totalAchievements=games.reduce((sum,elem)=>{
    return sum+elem.achievementsEarned;
  },0)
  const completedGames = games.filter((elem)=>{
    return elem.status==="Completed";
  }).length
  const totalDays = (totalPlayTime/24).toFixed(0);
  const completionRate = games.reduce((sum,elem)=>{
    return sum+elem.progress;
  },0)/totalGames;
  const avgRating = games.reduce((sum,elem)=>{
    return sum+elem.rating;
  },0)/totalGames;
  const gamesPlaying = games.filter((elem)=>{
    return elem.status==="Playing";
  }).length;

  const recentGames = games.slice(0,5);

  let profile_stats =[
        {
          num : totalGames,
          title : 'Games Played',
          stats : completedGames+' Completed',
          icon: <Hexagon size={20} color='#47b60c' />,
          color1 : 'bg-green-400/15'
        },
        {
          num : totalPlayTime+'h',
          title : 'Total Playtime',
          stats : '~'+totalDays+' Days',
          icon: <Clock size={20} color='#5fc9ec'/>,
          color1 : 'bg-blue-400/15'
        },
        {
          num : totalAchievements,
          title : 'Achievements',
          stats : 'Unlocked',
          icon: <Trophy size={20} color='#d127e7'/>,
          color1 : 'bg-purple-700/15'
        },
        {
          num : completionRate.toFixed(0)+'%',
          title : 'Completion Rate',
          stats : gamesPlaying+' Still Playing',
          icon: <Check size={20} color='#e7b427'/>,
          color1 : 'bg-orange-500/15'
        },
        {
          num : avgRating.toFixed(1),
          title : 'Avg Rating',
          stats : 'Across Rated Games',
          icon: <Star size={20} color='#e70d0d'/>,
          color1 : 'bg-red-500/15'
        }
  ]

    const game_card = recentGames.map((elem)=>{
      return{name : elem.title,
        genre: elem.genre,
        hours: elem.playtime + 'h',
        color1: elem.colorAccent,
        initial: elem.title[0],
        progress: elem.progress + '%',
        color2: elem.colorAccent,
        status: elem.status.toUpperCase()}
    });

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
    <div className='flex min-h-screen w-full bg-[#080c10]'>
      <Sidebar />
      <div className='flex-1 overflow-y-auto'>
        <DashContent profile_stats={profile_stats} game_card={game_card} library_status={library_status} genre_breakdown={genre_breakdown} top_by_playtime={top_by_playtime}/>
      </div>
    </div>
  )
}

export default Dashboard
