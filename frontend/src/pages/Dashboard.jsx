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
  const backlogGames = games.filter((elem)=>{
    return elem.status==="Backlog";
  }).length
  const droppedGames = games.filter((elem)=>{
    return elem.status==="Dropped";
  }).length
  const totalDays = (totalPlayTime/24).toFixed(0);
  const completionRate = totalGames===0 ? 0 : games.reduce((sum,elem)=>{
    return sum+elem.progress;
  },0)/totalGames;
  const avgRating = totalGames===0 ? 0 : games.reduce((sum,elem)=>{
    return sum+elem.rating;
  },0)/totalGames;
  const gamesPlaying = games.filter((elem)=>{
    return elem.status==="Playing";
  }).length;

  const recentGames = games.slice(0,5);

  const gamesByPlaytime = [...recentGames].sort((a,b)=>b.playtime-a.playtime);

  const genreCount = {};

  games.forEach((elem)=>{
    if(genreCount[elem.genre]){
      genreCount[elem.genre]++;
    }
    else{
      genreCount[elem.genre] = 1;
    }
  })

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
          num : gamesPlaying,
          cg : 'conic-gradient(#00f5a0 '+(gamesPlaying/totalGames)*100+'%,#1a2332 0)',
          color2 : 'text-[#00f5a0]',
          status : 'Playing'
        },
        {
          num : completedGames,
          cg : 'conic-gradient(#0aa5ff '+(completedGames/totalGames)*100+'%,#1a2332 0)',
          color2 : 'text-[#0aa5ff]',
          status : 'Completed'
        },
        {
          num : backlogGames,
          cg : 'conic-gradient(#6200ff '+(backlogGames/totalGames)*100+'%,#1a2332 0)',
          color2 : 'text-[#6200ff]',
          status : 'Backlog'
        },
        {
          num : droppedGames,
          cg : 'conic-gradient(#f50000 '+(droppedGames/totalGames)*100+'%,#1a2332 0)',
          color2 : 'text=[#f50000]',
          status : 'Dropped'
        }
  ]

    let genre_breakdown = Object.entries(genreCount).map(([genre,count])=>{
      return{
        genre ,
        num : count,
        progress : `${(count/totalGames)*100}%`
      }
    })

    let top_by_playtime = gamesByPlaytime.map(function(elem){
      return{
        name : elem.title,
        progress : (elem.progress ?? 0) + '%',
        color : elem.colorAccent,
        hours : elem.playtime+'h'
      }
    })


  return (
    <div className='flex flex-col md:flex-row h-screen w-full bg-[#080c10]'>
      <Sidebar />
      <div className='flex-1 h-full overflow-y-auto'>
        <DashContent profile_stats={profile_stats} game_card={game_card} library_status={library_status} genre_breakdown={genre_breakdown} top_by_playtime={top_by_playtime} totalPlaytime={totalPlayTime}/>
      </div>
    </div>
  )
}

export default Dashboard
