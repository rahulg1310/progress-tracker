import React, { useState } from 'react'
import SessionContentCard from './SessionContentCard'
import SessionGameButton from './SessionGameButton'

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
  const [session, setSession] = useState([]);
  const [duration, setDuration] = useState(0);
  const [kills, setKills] = useState(0);
  const [deaths, setDeaths] = useState(0);
  const [assists, setAssists] = useState(0);
  const ratio = deaths === 0 ? kills : (kills / deaths).toFixed(2);
  const [game, setGame] = useState("Valorant");
  const [brank, setBrank] = useState(ranks[game][0]);
  const [arank, setArank] = useState(ranks[game][0]);
  const [selectedGame, setSelectedGame] = useState("All");
  const [result,setResult] = useState("All");
  const [sessionResult,setSessionResult] = useState("");
  const [mood,setMood] = useState("");
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
                setBrank(ranks["Valorant"][0]);
                setArank(ranks["Valorant"][0]);
                setSessionResult("");
                setMood("");
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
                className={`button_border text-[14px] rounded-full px-3 border hover:bg-gray-700 transition:all duration-200 ${
                  "All"===result ? "border-cyan-400 text-cyan-400" : "border-white/25 text-white"
                }`}>All</button>
                <button 
                onClick={()=>{
                  setResult("Win");
                }}
                className={`button_border text-[14px] rounded-full px-3 border hover:bg-gray-700 transition:all duration-200 ${
                  "Win"===result ? "border-green-400 text-green-400" : "border-white/25 text-white"
                } `}>Win</button>
                <button 
                onClick={()=>{
                  setResult("Loss");
                }}
                className={`button_border text-[14px] rounded-full px-3 border hover:bg-gray-700 transition:all duration-200 ${
                  "Loss"===result ? "border-red-400 text-red-400" : "border-white/25 text-white"
                } `}>Loss</button>
                <button 
                onClick={()=>{
                  setResult("Draw");
                }}
                className={`button_border text-[14px] rounded-full px-3 border hover:bg-gray-700 transition:all duration-200 ${
                  "Draw"===result ? "border-yellow-400 text-yellow-400" : "border-white/25 text-white"
                } `}>Draw</button>
            </div>
        </div>
      </div>
      {modal && (
        <div className='fixed inset-0 bg-black/70 flex justify-center items-center p-4 z-50'>
          <div className='bg-[#111820] w-[35%] rounded-2xl border border-gray-400/20 flex flex-col gap-5 p-6'>
            <div className='flex justify-between items-center '>
              <h1 className='font-bold text-xl tracking-wider'>Log Gaming Session</h1>
              <button 
              onClick={()=>{
                setModal(false);
              }}
              className='body hover:bg-gray-700 transition:all duration-200 py-1 px-2 rounded '>X</button>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Game</span>
                <select 
                onChange={(e)=>{
                  setGame(e.target.value);
                  setBrank(ranks[e.target.value][0]);
                  setArank(ranks[e.target.value][0]);

                }}
                value={game} className='bg-[#080c10] p-1 rounded-[6px] body text-[15px] border border-white/15 focus:border-green-400 transition:all duration-200'>
                  {Object.keys(ranks).map((elem)=>{
                    return <option key={elem}>{elem}</option>
                  })}
                </select>
              </div>
              <div className='flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Date</span>
                <input type="date" className='bg-[#080c10] p-1 rounded-[6px] text-[15px] body border outline-none border-white/15 focus:border-green-400 transition:all duration-200'/>
              </div>
            </div>
            <div className='w-full flex flex-col gap-1'>
              <h1 className='body text-[#8a9bb0] text-[12px] font-semibold'>Duration :  <span className='text-green-500'>{duration}h</span></h1>
              <input 
              onChange={(e)=>{
                setDuration(e.target.value);
              }}
              type="range" min='0' max='100' value={duration} className='accent-[#00f5a0]' />
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Kills</span>
                <input 
                onChange={(e)=>{
                  if(e.target.value>=0){
                    setKills(Number(e.target.value));
                  }
                }}
                type="number" value={kills} className='bg-[#080c10] p-1 rounded-[6px] text-[15px] body border outline-none border-white/15 focus:border-green-400 transition:all duration-200'/>
              </div>
              <div className='flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Deaths</span>
                <input 
                onChange={(e)=>{
                  if(e.target.value>=0){
                    setDeaths(Number(e.target.value));
                  }
                }}
                type="number" value={deaths} className='bg-[#080c10] p-1 rounded-[6px] text-[15px] body border outline-none border-white/15 focus:border-green-400 transition:all duration-200'/>
              </div>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Assists</span>
                <input 
                onChange={(e)=>{
                  if(e.target.value>=0){
                    setAssists(Number(e.target.value));
                  }
                }}
                type="number" value={assists} className='bg-[#080c10] p-1 rounded-[6px] text-[15px] body border outline-none border-white/15 focus:border-green-400 transition:all duration-200'/>
              </div>
              <div className='flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>K/D</span>
                <input 
                type="text" value={ratio} readOnly className='bg-[#080c10] p-1 rounded-[6px] text-[15px] body border outline-none border-white/15 focus:border-cyan-400 transition:all duration-200 bg-gray-900 text-cyan-400'/>
              </div>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Rank Before</span>
                <select 
                onChange={(e)=>{
                  setBrank(e.target.value);
                }}
                value={brank} className='bg-[#080c10] p-1 rounded-[6px] body text-[15px] border border-white/15 focus:border-green-400 transition:all duration-200'>
                  {ranks[game].map(function(elem,idx){
                    return <option key={idx}>{elem}</option>
                  })}
                </select>
              </div>
              <div className='flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Rank After</span>
                <select 
                onChange={(e)=>{
                  setArank(e.target.value);
                }}
                value={arank} className='bg-[#080c10] p-1 rounded-[6px] body text-[15px] border border-white/15 focus:border-green-400 transition:all duration-200'>
                  {ranks[game].map(function(elem){
                    return <option key={elem}>{elem}</option>
                  })}
                </select>
              </div>
            </div>
            <div className='flex flex-col gap-1'>
              <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Result</span>
              <div className='flex gap-3'>
                <button 
                onClick={()=>{
                  setSessionResult("Win");
                }}
                className={`button_border text-[16px] rounded-[7px] px-3 border hover:bg-gray-700 transition:all duration-200 ${
                  "Win"===sessionResult ? "border-green-400 text-green-400" : "border-white/25 text-white"
                } `}>Win</button>
                <button 
                onClick={()=>{
                  setSessionResult("Loss");
                }}
                className={`button_border text-[16px] rounded-[7px] px-3 border hover:bg-gray-700 transition:all duration-200 ${
                  "Loss"===sessionResult ? "border-red-400 text-red-400" : "border-white/25 text-white"
                } `}>Loss</button>
                <button 
                onClick={()=>{
                  setSessionResult("Draw");
                }}
                className={`button_border text-[16px] rounded-[7px] px-3 border hover:bg-gray-700 transition:all duration-200 ${
                  "Draw"===sessionResult ? "border-yellow-400 text-yellow-400" : "border-white/25 text-white"
                } `}>Draw</button>
              </div>
            </div>
            <div className='flex flex-col gap-1'>
              <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Mood</span>
              <div className='flex gap-3'>
                <button 
                onClick={()=>{
                  setMood("Focused");
                }}
                className={`button_border text-[16px] rounded-[7px] px-3 border hover:bg-gray-700 transition:all duration-200 ${
                  "Focused"===mood ? "border-cyan-400 text-cyan-400" : "border-white/25 text-white"
                } `}>Focused</button>
                <button 
                onClick={()=>{
                  setMood("Tilted");
                }}
                className={`button_border text-[16px] rounded-[7px] px-3 border hover:bg-gray-700 transition:all duration-200 ${
                  "Tilted"===mood ? "border-red-400 text-red-400" : "border-white/25 text-white"
                } `}>Tilted</button>
                <button 
                onClick={()=>{
                  setMood("Relaxed");
                }}
                className={`button_border text-[16px] rounded-[7px] px-3 border hover:bg-gray-700 transition:all duration-200 ${
                  "Relaxed"===mood ? "border-blue-400 text-blue-400" : "border-white/25 text-white"
                } `}>Relaxed</button>
                <button 
                onClick={()=>{
                  setMood("Tryhard");
                }}
                className={`button_border text-[16px] rounded-[7px] px-3 border hover:bg-gray-700 transition:all duration-200 ${
                  "Tryhard"===mood ? "border-green-400 text-green-400" : "border-white/25 text-white"
                } `}>Tryhard</button>
                <button 
                onClick={()=>{
                  setMood("Casual");
                }}
                className={`button_border text-[16px] rounded-[7px] px-3 border hover:bg-gray-700 transition:all duration-200 ${
                  "Casual"===mood ? "border-yellow-400 text-yellow-400" : "border-white/25 text-white"
                } `}>Casual</button>
              </div>
            </div>
            <div className='flex justify-end gap-8 border-t border-t-gray-600/70 pt-5'>
                <button 
                onClick={()=>{
                  setModal(false);
                }}
                className='font-bold tracking-wider text-white bg-linear-to-r bg-[#080c10] rounded-[7px] py-1.5 hover:opacity-60 transition-all duration-200 px-3'>Cancel</button>
                <button 
                onClick={()=>{
                  setModal(false);
                }}
                className='font-bold tracking-wider text-black bg-linear-to-r from-green-400 to-cyan-400 rounded-[7px] py-1.5 hover:opacity-60 transition-all duration-200 px-3'>Log Session</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SessionContent
