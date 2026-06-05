import React, { useState } from 'react'
import SessionContentCard from './SessionContentCard'
import SessionGameButton from './SessionGameButton'
import SessionModal from './SessionModal'
import StatsCard from './StatsCard'

const SessionContent = (props) => {
  const ranks = {
  Valorant: [
    "Iron 1",
    "Iron 2",
    "Iron 3",
    "Bronze 1",
    "Bronze 2",
    "Bronze 3",
    "Silver 1",
    "Silver 2",
    "Silver 3",
    "Gold 1",
    "Gold 2",
    "Gold 3",
    "Platinum 1",
    "Platinum 2",
    "Platinum 3",
    "Diamond 1",
    "Diamond 2",
    "Diamond 3",
    "Ascendant 1",
    "Ascendant 2",
    "Ascendant 3",
    "Immortal 1",
    "Immortal 2",
    "Immortal 3",
    "Radiant"
  ],

  "League Of Legends": [
    "Iron",
    "Bronze",
    "Silver",
    "Gold",
    "Platinum",
    "Emerald",
    "Diamond",
    "Master",
    "Grandmaster",
    "Challenger"
  ],

  Fortnite: [
    "Bronze",
    "Silver",
    "Gold",
    "Platinum",
    "Diamond",
    "Elite",
    "Champion",
    "Unreal"
  ],

  "Counter Strike : 2": [
    "Silver I",
    "Silver II",
    "Silver III",
    "Silver IV",
    "Silver Elite",
    "Silver Elite Master",
    "Gold Nova I",
    "Gold Nova II",
    "Gold Nova III",
    "Gold Nova Master",
    "Master Guardian I",
    "Master Guardian II",
    "Master Guardian Elite",
    "Distinguished Master Guardian",
    "Legendary Eagle",
    "Legendary Eagle Master",
    "Supreme Master First Class",
    "Global Elite"
  ],

  "Apex Legends": [
    "Rookie",
    "Bronze",
    "Silver",
    "Gold",
    "Platinum",
    "Diamond",
    "Master",
    "Predator"
  ],

  "Overwatch 2": [
    "Bronze",
    "Silver",
    "Gold",
    "Platinum",
    "Diamond",
    "Master",
    "Grandmaster",
    "Champion"
  ],

  "Rainbow Six Siege": [
    "Copper",
    "Bronze",
    "Silver",
    "Gold",
    "Platinum",
    "Emerald",
    "Diamond",
    "Champion"
  ],

  "Call Of Duty": [
    "Bronze",
    "Silver",
    "Gold",
    "Platinum",
    "Diamond",
    "Crimson",
    "Iridescent",
    "Top 250"
  ]
  };
  
  const [modal, setModal] = useState(false);
  const [sessions, setSessions] = useState(()=>{
    const savedSessions=localStorage.getItem("sessions");
    if(savedSessions){
      return JSON.parse(savedSessions);
    }
    return [];
  });
  const deleteSession = (index) =>{
    const updatedSession = sessions.filter((_,idx)=>{
      return idx!==index;
    });
    setSessions(updatedSession);
    localStorage.setItem('sessions',JSON.stringify(updatedSession));
  }
  const [duration, setDuration] = useState(0);
  const [kills, setKills] = useState(0);
  const [deaths, setDeaths] = useState(0);
  const [assists, setAssists] = useState(0);
  const ratio = deaths === 0 ? kills : (kills / deaths).toFixed(2);
  const [game, setGame] = useState("Valorant");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [brank, setBrank] = useState(ranks[game][0]);
  const [arank, setArank] = useState(ranks[game][0]);
  const [selectedGame, setSelectedGame] = useState("All");
  const [result,setResult] = useState("All");
  const [sessionResult,setSessionResult] = useState("Win");
  const [mood,setMood] = useState("Focused");
  const filteredSessions = sessions.filter(function(elem){
    return ((selectedGame === 'All' || selectedGame===elem.game) && (result === 'All' || result===elem.result))
  });
  return (
    <div className='w-full py-5 px-12 flex flex-col gap-6'>
      <div className='w-full flex justify-between'>
        <div className='flex flex-col'>
            <h1 className='font-bold text-4xl tracking-wider'>Session Tracker</h1>
            <h4 className='body text-[13px] text-[#8a9bb0]'>{props.session_card.data} Sessions Logged</h4>
        </div>
        <div>
            <button 
            onClick={()=>{
                setDuration(0);
                setDeaths(0);
                setKills(0);
                setAssists(0);
                setGame("Valorant");
                setDate(new Date().toISOString().split("T")[0]);
                setBrank(ranks["Valorant"][0]);
                setArank(ranks["Valorant"][0]);
                setSessionResult("Win");
                setMood("Focused");
                setModal(true);
            }}
            className='font-bold tracking-wider text-black w-full bg-linear-to-r from-green-400 to-cyan-400 rounded-[7px] py-1.5 hover:-translate-y-0.5 hover:opacity-80 transition-all duration-200 px-3'>+ Log Session</button>
        </div>
      </div>
      <div className='flex gap-3 '>
        {props.session_card.map(function(elem,idx){
            return <SessionContentCard key={idx} data={elem.data} title={elem.title} color={elem.color} />
        })}
      </div>
      <div className='flex flex-col gap-2'>
        <div className='flex gap-2 items-center'>
            <h1 className='body text-[#4a5568] text-[12px]'>Game:</h1>
            <div className='flex gap-2'>
                {props.game_button.map(function(elem,idx){
                    return <SessionGameButton key={idx} name={elem.name} setSelectedGame={setSelectedGame} selectedGame={selectedGame} />
                })}
            </div>
        </div>
        <div className='flex gap-2 items-center'>
            <h1 className='body text-[#4a5568] text-[12px]'>Result:</h1>
            <div className='flex gap-2'>
                <button 
                onClick={()=>{
                  setResult("All");
                }}
                className={`button_border text-[14px] rounded-full px-3 border hover:bg-gray-700 transition-all duration-200 ${
                  "All"===result ? "border-cyan-400 text-cyan-400" : "border-white/25 text-white"
                }`}>All</button>
                <button 
                onClick={()=>{
                  setResult("Win");
                }}
                className={`button_border text-[14px] rounded-full px-3 border hover:bg-gray-700 transition-all duration-200 ${
                  "Win"===result ? "border-green-400 text-green-400" : "border-white/25 text-white"
                } `}>Win</button>
                <button 
                onClick={()=>{
                  setResult("Loss");
                }}
                className={`button_border text-[14px] rounded-full px-3 border hover:bg-gray-700 transition-all duration-200 ${
                  "Loss"===result ? "border-red-400 text-red-400" : "border-white/25 text-white"
                } `}>Loss</button>
                <button 
                onClick={()=>{
                  setResult("Draw");
                }}
                className={`button_border text-[14px] rounded-full px-3 border hover:bg-gray-700 transition-all duration-200 ${
                  "Draw"===result ? "border-yellow-400 text-yellow-400" : "border-white/25 text-white"
                } `}>Draw</button>
            </div>
        </div>
      </div>
      {modal && (
        <SessionModal modal={modal} setModal={setModal} sessions={sessions} setSessions={setSessions} kills={kills} setKills={setKills} deaths={deaths} setDeaths={setDeaths} assists={assists} setAssists={setAssists} ratio={ratio} game={game} setGame={setGame} brank={brank} setBrank={setBrank} arank={arank} setArank={setArank} selectedGame={selectedGame} setSelectedGame={setSelectedGame} sessionResult={sessionResult} setSessionResult={setSessionResult} mood={mood} setMood={setMood} duration={duration} setDuration={setDuration} ranks={ranks} date={date} setDate={setDate} />
      )}
      <div className='flex flex-col gap-2.5'>
        {
          filteredSessions.length === 0 ? (
            <div className='p-8 text-center'>
              <h1 className='font-bold text-xl text-[#8a9bb0]'>
                No Sessions Found
              </h1>
              <p className='body text-sm text-[#4a5568] mt-2'>
                Log your first gaming session to get started.
              </p>
            </div>
          ) :
          (filteredSessions.map(function(elem,idx){
            return <StatsCard key={idx} index={idx} game={elem.game} duration={elem.duration} kills={elem.kills} deaths={elem.deaths} assists={elem.assists} ratio={elem.ratio} rankBefore={elem.rankBefore} rankAfter={elem.rankAfter} result={elem.result} date={elem.date} mood={elem.mood} deleteSession={deleteSession} />
          }))
        }
      </div>
    </div>
    
  )
}

export default SessionContent