import React, { useState } from 'react'

const LibraryModal = (props) => {
  const isFormValid = props.title.trim() !== "" && props.genre.trim() !== "";
  const [titleError, setTitleError] = useState('');
  const [genreError, setGenreError] = useState('');
  const isValid = () =>{
    if(props.title.trim()===""){
        setTitleError("Please enter title");
        return false;
    }
    if(props.genre.trim()===""){
        setGenreError("Please enter genre");
        return false;
    }
    return true;
  }
  return (
    <div className='fixed inset-0 bg-black/70 flex justify-center items-center p-4 z-50'>
      <div className='bg-[#111820] max-w-3xl w-full rounded-2xl border border-gray-400/20 flex flex-col gap-5 p-6'>
        <div className='flex justify-between items-center'>
            <h1 className='font-bold text-xl tracking-wider'>Add New Game</h1>
            <button 
            onClick={()=>{
                setTitleError("");
                setGenreError("");
                props.setModal(false);
            }}
            className='body hover:bg-gray-700 transition-all duration-200 py-1 px-2 rounded'>X</button>
        </div>
        <div className='w-full flex flex-col gap-1'>
            <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Title</span>
            <input 
            onChange={(e)=>{
                props.setTitle(e.target.value);
                if(e.target.value.trim() !== ""){
                    setTitleError("");
                }
            }}
            type="text" value={props.title} placeholder='Game title...' className='bg-[#080c10] py-1 px-2 rounded-[6px] text-[15px] body border outline-none border-white/15 focus:border-green-400 transition-all duration-200 placeholder:text-[#4a5568]'/>
            <span className='body text-[11px] text-[#ff2929]'>{titleError}</span>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='w-full flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Genre</span>
                <input 
                onChange={(e)=>{
                    props.setGenre(e.target.value);
                    if(e.target.value.trim() !== ""){
                        setGenreError("");
                    }
                }}
                type="text" value={props.genre} placeholder='e.g. Action RPG' className='bg-[#080c10] py-1 px-2 rounded-[6px] text-[15px] body border outline-none border-white/15 focus:border-green-400 transition-all duration-200 placeholder:text-[#4a5568]'/>
                <span className='body text-[11px] text-[#ff2929]'>{genreError}</span>
            </div>
            <div className='w-full flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Platform</span>
                <select 
                onChange={(e)=>{
                  props.setPlatform(e.target.value);
                }}
                value={props.platform} className='bg-[#080c10] py-1 px-2 rounded-[6px] body text-[15px] border border-white/15 focus:border-green-400 transition-all duration-200'>
                    <option>PC</option>
                    <option>PS5</option>
                    <option>PS4</option>
                    <option>Xbox</option>
                    <option>Switch</option>
                    <option>Mobile</option>
                </select>
            </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='w-full flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Status</span>
                <select 
                onChange={(e)=>{
                  props.setStatus(e.target.value);
                }}
                value={props.status} className='bg-[#080c10] py-1 px-2 rounded-[6px] body text-[15px] border border-white/15 focus:border-green-400 transition-all duration-200'>
                    <option>Playing</option>
                    <option>Completed</option>
                    <option>Backlog</option>
                    <option>Dropped</option>
                </select>
            </div>
            <div className='w-full flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Progress ({props.progress}%)</span>
                <input 
                onChange={(e)=>{
                    props.setProgress(Number(e.target.value));
                }}
                type="range" value={props.progress} placeholder='e.g. Action RPG' className='accent-[#00f5a0]'/>
            </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='w-full flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Playtime (hours)</span>
                <input 
                onChange={(e)=>{
                    if(e.target.value>=0){
                        props.setPlaytime(Number(e.target.value));
                    }
                }}
                type="number" min={0} value={props.playtime} className='bg-[#080c10] py-1 px-2 rounded-[6px] text-[15px] body border outline-none border-white/15 focus:border-green-400 transition-all duration-200'/>
            </div>
            <div className='w-full flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Rating (1-10)</span>
                <input 
                onChange={(e)=>{
                    props.setRating(Number(e.target.value));
                }}
                type="number" min={0} max={10} value={props.rating} className='bg-[#080c10] py-1 px-2 rounded-[6px] text-[15px] body border outline-none border-white/15 focus:border-green-400 transition-all duration-200'/>
            </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='w-full flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Color Accent</span>
                <input 
                onChange={(e)=>{
                    props.setColorAccent(e.target.value);
                }}
                type="color" value={props.colorAccent} className='bg-[#080c10] rounded-[6px] text-[15px] body border outline-none border-white/15 focus:border-green-400 transition-all duration-200 w-full'/>
            </div>
            <div className='w-full flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Achievements Earned</span>
                <input 
                onChange={(e)=>{
                    props.setAchievementsEarned(Number(e.target.value));
                }}
                type="number" min={0} value={props.achievementsEarned} className='bg-[#080c10] py-1 px-2 rounded-[6px] text-[15px] body border outline-none border-white/15 focus:border-green-400 transition-all duration-200'/>
            </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='w-full flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Total Achievements</span>
                <input 
                onChange={(e)=>{
                    props.setTotalAchievements(Number(e.target.value));
                }}
                type="number" min={0} value={props.totalAchievements} className='bg-[#080c10] py-1 px-2 rounded-[6px] text-[15px] body border outline-none border-white/15 focus:border-green-400 transition-all duration-200'/>
            </div>
        </div>
        <div className='w-full flex flex-col gap-1'>
            <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Notes</span>
            <textarea
            onChange={(e)=>{
                props.setNotes(e.target.value);
            }} 
            value={props.notes} placeholder='Personal notes...' className='bg-[#080c10] h-30 py-1 px-2 rounded-[6px] text-[15px] body border outline-none border-white/15 focus:border-green-400 transition-all duration-200 placeholder:text-[#4a5568] placeholder:text-[#4a5568]'></textarea>
        </div>
        <div className='flex justify-end gap-8 border-t border-t-gray-600/70 pt-5'>
                <button 
                onClick={()=>{
                  setTitleError("");
                  setGenreError("");
                  props.setModal(false);
                }}
                className='font-bold tracking-wider text-white bg-linear-to-r bg-[#080c10] rounded-[7px] py-1.5 hover:opacity-60 transition-all duration-200 px-3'>Cancel</button>
                <button 
                onClick={()=>{
                 if(!isValid()) return;
                  const newGame = {
                    title : props.title,
                    genre : props.genre,
                    platform : props.platform,
                    status : props.status,
                    progress : props.progress,
                    playtime : props.playtime,
                    rating : props.rating,
                    colorAccent : props.colorAccent,
                    achievementsEarned : props.achievementsEarned,
                    totalAchievements : props.totalAchievements,
                    notes : props.notes
                  };
                  const updatedGames = [...props.games,newGame];
                  props.setGames(updatedGames);
                  localStorage.setItem('games',JSON.stringify(updatedGames));
                  setTitleError("");
                    setGenreError("");
                  props.setModal(false);
                }}
                className='font-bold tracking-wider text-black bg-linear-to-r from-green-400 to-cyan-400 rounded-[7px] py-1.5 hover:opacity-60 transition-all duration-200 px-3'>Add Game</button>
            </div>
      </div>
    </div>
  )
}

export default LibraryModal
