import React from 'react'

const SessionModal = (props) => {
  return (
        <div className='fixed inset-0 bg-black/70 flex justify-center items-center p-4 z-50'>
          <div className='bg-[#111820] max-w-3xl w-full rounded-2xl border border-gray-400/20 flex flex-col gap-5 p-6'>
            <div className='flex justify-between items-center '>
              <h1 className='font-bold text-xl tracking-wider'>Log Gaming Session</h1>
              <button 
              onClick={()=>{
                props.setModal(false);
              }}
              className='body hover:bg-gray-700 transition-all duration-200 py-1 px-2 rounded '>X</button>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Game</span>
                <select 
                onChange={(e)=>{
                  props.setGame(e.target.value);
                  props.setBrank(props.ranks[e.target.value][0]);
                  props.setArank(props.ranks[e.target.value][0]);

                }}
                value={props.game} className='bg-[#080c10] p-1 rounded-[6px] body text-[15px] border border-white/15 focus:border-green-400 transition-all duration-200'>
                  {Object.keys(props.ranks).map((elem)=>{
                    return <option key={elem}>{elem}</option>
                  })}
                </select>
              </div>
              <div className='flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Date</span>
                <input 
                onChange={(e)=>{
                    props.setDate(e.target.value);
                }}
                type="date" value={props.date} className='bg-[#080c10] p-1 rounded-[6px] text-[15px] body border outline-none border-white/15 focus:border-green-400 transition-all duration-200'/>
              </div>
            </div>
            <div className='w-full flex flex-col gap-1'>
              <h1 className='body text-[#8a9bb0] text-[12px] font-semibold'>Duration :  <span className='text-green-500'>{props.duration}m</span></h1>
              <input 
              onChange={(e)=>{
                props.setDuration(e.target.value);
              }}
              type="range" min='0' max='480' value={props.duration} className='accent-[#00f5a0]' />
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Kills</span>
                <input 
                onChange={(e)=>{
                  if(e.target.value>=0){
                    props.setKills(Number(e.target.value));
                  }
                }}
                type="number" value={props.kills} className='bg-[#080c10] p-1 rounded-[6px] text-[15px] body border outline-none border-white/15 focus:border-green-400 transition-all duration-200'/>
              </div>
              <div className='flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Deaths</span>
                <input 
                onChange={(e)=>{
                  if(e.target.value>=0){
                    props.setDeaths(Number(e.target.value));
                  }
                }}
                type="number" value={props.deaths} className='bg-[#080c10] p-1 rounded-[6px] text-[15px] body border outline-none border-white/15 focus:border-green-400 transition-all duration-200'/>
              </div>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Assists</span>
                <input 
                onChange={(e)=>{
                  if(e.target.value>=0){
                    props.setAssists(Number(e.target.value));
                  }
                }}
                type="number" value={props.assists} className='bg-[#080c10] p-1 rounded-[6px] text-[15px] body border outline-none border-white/15 focus:border-green-400 transition-all duration-200'/>
              </div>
              <div className='flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>K/D</span>
                <input 
                type="text" value={props.ratio} readOnly className='bg-[#080c10] p-1 rounded-[6px] text-[15px] body border outline-none border-white/15 focus:border-cyan-400 transition-all duration-200 bg-gray-900 text-cyan-400'/>
              </div>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Rank Before</span>
                <select 
                onChange={(e)=>{
                  props.setBrank(e.target.value);
                }}
                value={props.brank} className='bg-[#080c10] p-1 rounded-[6px] body text-[15px] border border-white/15 focus:border-green-400 transition-all duration-200'>
                  {props.ranks[props.game].map(function(elem,idx){
                    return <option key={idx}>{elem}</option>
                  })}
                </select>
              </div>
              <div className='flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Rank After</span>
                <select 
                onChange={(e)=>{
                  props.setArank(e.target.value);
                }}
                value={props.arank} className='bg-[#080c10] p-1 rounded-[6px] body text-[15px] border border-white/15 focus:border-green-400 transition-all duration-200'>
                  {props.ranks[props.game].map(function(elem){
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
                  props.setSessionResult("Win");
                }}
                className={`button_border text-[16px] rounded-[7px] px-3 border hover:bg-gray-700 transition-all duration-200 ${
                  "Win"===props.sessionResult ? "border-green-400 text-green-400" : "border-white/25 text-white"
                } `}>Win</button>
                <button 
                onClick={()=>{
                  props.setSessionResult("Loss");
                }}
                className={`button_border text-[16px] rounded-[7px] px-3 border hover:bg-gray-700 transition-all duration-200 ${
                  "Loss"===props.sessionResult ? "border-red-400 text-red-400" : "border-white/25 text-white"
                } `}>Loss</button>
                <button 
                onClick={()=>{
                  props.setSessionResult("Draw");
                }}
                className={`button_border text-[16px] rounded-[7px] px-3 border hover:bg-gray-700 transition-all duration-200 ${
                  "Draw"===props.sessionResult ? "border-yellow-400 text-yellow-400" : "border-white/25 text-white"
                } `}>Draw</button>
              </div>
            </div>
            <div className='flex flex-col gap-1'>
              <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Mood</span>
              <div className='flex gap-3'>
                <button 
                onClick={()=>{
                  props.setMood("Focused");
                }}
                className={`button_border text-[16px] rounded-[7px] px-3 border hover:bg-gray-700 transition-all duration-200 ${
                  "Focused"===props.mood ? "border-cyan-400 text-cyan-400" : "border-white/25 text-white"
                } `}>Focused</button>
                <button 
                onClick={()=>{
                  props.setMood("Tilted");
                }}
                className={`button_border text-[16px] rounded-[7px] px-3 border hover:bg-gray-700 transition-all duration-200 ${
                  "Tilted"===props.mood ? "border-red-400 text-red-400" : "border-white/25 text-white"
                } `}>Tilted</button>
                <button 
                onClick={()=>{
                  props.setMood("Relaxed");
                }}
                className={`button_border text-[16px] rounded-[7px] px-3 border hover:bg-gray-700 transition-all duration-200 ${
                  "Relaxed"===props.mood ? "border-blue-400 text-blue-400" : "border-white/25 text-white"
                } `}>Relaxed</button>
                <button 
                onClick={()=>{
                  props.setMood("Tryhard");
                }}
                className={`button_border text-[16px] rounded-[7px] px-3 border hover:bg-gray-700 transition-all duration-200 ${
                  "Tryhard"===props.mood ? "border-green-400 text-green-400" : "border-white/25 text-white"
                } `}>Tryhard</button>
                <button 
                onClick={()=>{
                  props.setMood("Casual");
                }}
                className={`button_border text-[16px] rounded-[7px] px-3 border hover:bg-gray-700 transition-all duration-200 ${
                  "Casual"===props.mood ? "border-yellow-400 text-yellow-400" : "border-white/25 text-white"
                } `}>Casual</button>
              </div>
            </div>
            <div className='flex justify-end gap-8 border-t border-t-gray-600/70 pt-5'>
                <button 
                onClick={()=>{
                  props.setModal(false);
                }}
                className='font-bold tracking-wider text-white bg-linear-to-r bg-[#080c10] rounded-[7px] py-1.5 hover:opacity-60 transition-all duration-200 px-3'>Cancel</button>
                <button 
                onClick={()=>{
                  const newSession = {
                    game : props.game,
                    duration : props.duration,
                    kills : props.kills,
                    deaths : props.deaths,
                    assists : props.assists,
                    ratio : props.ratio,
                    rankBefore : props.brank,
                    rankAfter : props.arank,
                    result : props.result,
                    date : props.date,
                    mood : props.mood
                  };
                  const updatedSessions = [...props.sessions,newSession];
                  props.setSessions(updatedSessions);
                  localStorage.setItem('sessions',JSON.stringify(updatedSessions));
                  props.setModal(false);
                }}
                className='font-bold tracking-wider text-black bg-linear-to-r from-green-400 to-cyan-400 rounded-[7px] py-1.5 hover:opacity-60 transition-all duration-200 px-3'>Log Session</button>
            </div>
          </div>
        </div>
    )
}

export default SessionModal
