import React, { useState } from 'react'
import { Search } from 'lucide-react'
import LibraryModal from './LibraryModal';
import LibraryGameCard from './LibraryGameCard';

const LibraryContent = () => {
  const [searchGame, setSearchGame] = useState('');
  const [result, setResult] = useState('All');
  const [sortBy, setSortBy] = useState('Last Played');
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [platform, setPlatform] = useState('PC');
  const [status, setStatus] = useState('Playing');
  const [progress, setProgress] = useState(0);
  const [playtime,setPlayime] = useState(0);
  const [rating,setRating] = useState(null);
  const [colorAccent,setColorAccent] = useState('#FFFFFF');
  const [achievementsEarned,setAchievementsEarned] = useState(0);
  const [totalAchievements,setTotalAchievements] = useState(0);
  const [notes,setNotes] = useState('');
  const [games, setGames] = useState(()=>{
    const savedGames = localStorage.getItem('games');
    if(savedGames){
        return JSON.parse(savedGames);
    }
    return [];
  });
  const totalGames = games.length;
  return (
    <div className='w-full py-5 px-12 flex flex-col gap-6'>
      <div className='w-full flex justify-between'>
        <div className='flex flex-col'>
            <h1 className='font-bold text-4xl tracking-wider'>Game Library</h1>
        </div>
        <div>
            <button 
            onClick={()=>{
                setTitle('');
                setGenre('');
                setPlatform('PC');
                setStatus('Playing');
                setProgress(0);
                setPlayime(0);
                setRating(0);
                setColorAccent('#FFFFFF');
                setAchievementsEarned(0);
                setTotalAchievements(0);
                setNotes('');
                setModal(true);
            }}
            className='font-bold tracking-wider text-black w-full bg-linear-to-r from-green-400 to-cyan-400 rounded-[7px] py-1.5 hover:-translate-y-0.5 hover:opacity-80 transition-all duration-200 px-3'>+ Add Game</button>
        </div>
      </div>
      <div className='w-full flex flex-col gap-3'>
        <div className='flex md:w-1/3 w-full items-center py-1 px-2 bg-[#111820] rounded-[10px] border border-white/10 focus-within:border-cyan-400 transition-all duration-200'>
            <Search size={18} className='mr-2' color='#4a5568' />
            <input 
            onChange={(e)=>{
                setSearchGame(e.target.value);
            }}
            type="text" value={searchGame} placeholder='Search games...' className='w-full body outline-none placeholder:text-[#4a5568] font-normal'/>
        </div>
        <div className='flex gap-2 items-center'>
            <button 
            onClick={()=>{
              setResult("All");
            }}
            className={`button_border text-[14px] rounded-full px-3 border hover:bg-gray-700 transition-all duration-200 ${
              "All"===result ? "border-cyan-400 text-cyan-400" : "border-white/25 text-white"
            }`}>All</button>
            <button 
            onClick={()=>{
              setResult("Playing");
            }}
            className={`button_border text-[14px] rounded-full px-3 border hover:bg-gray-700 transition-all duration-200 ${
              "Playing"===result ? "border-green-400 text-green-400" : "border-white/25 text-white"
            } `}>Playing</button>
            <button 
            onClick={()=>{
              setResult("Completed");
            }}
            className={`button_border text-[14px] rounded-full px-3 border hover:bg-gray-700 transition-all duration-200 ${
              "Completed"===result ? "border-blue-400 text-blue-400" : "border-white/25 text-white"
            } `}>Completed</button>
            <button 
            onClick={()=>{
              setResult("Backlog");
            }}
            className={`button_border text-[14px] rounded-full px-3 border hover:bg-gray-700 transition-all duration-200 ${
              "Backlog"===result ? "border-yellow-400 text-yellow-400" : "border-white/25 text-white"
            } `}>Backlog</button>
            <button 
            onClick={()=>{
              setResult("Dropped");
            }}
            className={`button_border text-[14px] rounded-full px-3 border hover:bg-gray-700 transition-all duration-200 ${
              "Dropped"===result ? "border-red-400 text-red-400" : "border-white/25 text-white"
            } `}>Dropped</button>
        </div>
        <div className='py-1 px-2 bg-[#111820] rounded-[10px] border border-white/10 w-fit'>
            <select 
            onChange={(e)=>{
                setSortBy(e.target.value);
            }}
            value={sortBy} className='body outline-none text-[13px] text-white bg-[#111820]'>
                <option>Last Played</option>
                <option>Title</option>
                <option>Playtime</option>
                <option>Progress</option>
                <option>Rating</option>
            </select>
        </div>
      </div>
      <div className='flex flex-col gap-3'>
        <h1 className='text-[#4a5568] text-[13px] font-semibold'>{totalGames} Games</h1>
        <div className='flex flex-wrap gap-3'>
            {
                games.map(function(elem,idx){
                    return <LibraryGameCard />
                })
            }
        </div>
      </div>
      {modal && (
        <LibraryModal modal={modal} setModal={setModal} title={title} setTitle={setTitle} genre={genre} setGenre={setGenre} platform={platform} setPlatform={setPlatform} status={status} setStatus={setStatus} progress={progress} setProgress={setProgress} playtime={playtime} setPlaytime={setPlayime} rating={rating} setRating={setRating} colorAccent={colorAccent} setColorAccent={setColorAccent} achievementsEarned={achievementsEarned} setAchievementsEarned={setAchievementsEarned} totalAchievements={totalAchievements} setTotalAchievements={setTotalAchievements} notes={notes} setNotes={setNotes} games={games} setGames={setGames} />
      )}
    </div>
  )
}

export default LibraryContent
