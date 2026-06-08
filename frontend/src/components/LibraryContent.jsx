import React, { useState } from 'react'
import { Search } from 'lucide-react'
import LibraryModal from './LibraryModal';
import LibraryGameCard from './LibraryGameCard';

const LibraryContent = () => {
  const [searchGame, setSearchGame] = useState('');
  const [editIndex, setEditIndex] = useState(null);
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
  
  const filteredGames = games.filter((elem)=>{
    return (result==="All" || elem.status===result) && elem.title.toLowerCase().includes(searchGame.toLowerCase());
  })
  const sortedGames = [...filteredGames];
  if(sortBy==="Title"){
    sortedGames.sort((a,b)=>a.title.localeCompare(b.title));
  }
  if(sortBy==="Playtime"){
    sortedGames.sort((a,b)=>b.playtime-a.playtime);
  }
  if(sortBy==="Progress"){
    sortedGames.sort((a,b)=>b.progress-a.progress)
  }
  if(sortBy==="Rating"){
    sortedGames.sort((a,b)=>b.rating-a.rating)
  }
  const totalGames = sortedGames.length;

  const deleteGame = (id)=>{
    const updatedGames = games.filter((elem)=>{
      return id!==elem.id;
    });
    setGames(updatedGames);
    localStorage.setItem('games',JSON.stringify(updatedGames));
  }
  const editGame = (id)=>{
    const game=games.find(function(elem){
      return elem.id===id;
    })
    setTitle(game.title);
    setGenre(game.genre);
    setPlatform(game.platform);
    setStatus(game.status);
    setProgress(game.progress);
    setPlayime(game.playtime);
    setRating(game.rating);
    setColorAccent(game.colorAccent);
    setAchievementsEarned(game.achievementsEarned);
    setTotalAchievements(game.totalAchievements);
    setNotes(game.notes);
    setEditIndex(id);
    setModal(true);
  }

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
                setEditIndex(null);
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
        <div className='flex flex-wrap gap-4'>
            {
                sortedGames.length === 0 ? (
                  <div className='flex w-full justify-center items-center'>
                  <div className='p-8 text-center'>
                    <h1 className='font-bold text-xl text-[#8a9bb0]'>
                      No Games Found
                    </h1>
                  <p className='body text-sm text-[#4a5568] mt-2'>
                    Add your first game to get started.
                  </p>
                  </div>
                  </div>
                )
                :
                sortedGames.map(function(elem,idx){
                    return <LibraryGameCard key={idx} id={elem.id} index={idx} title={elem.title} genre={elem.genre} platform={elem.platform} status={elem.status} progress={elem.progress} playtime={elem.playtime} rating={elem.rating} colorAccent={elem.colorAccent} achievementsEarned={elem.achievementsEarned} totalAchievements={elem.totalAchievements} notes={elem.notes} deleteGame={deleteGame} editGame={editGame}  />
                })
            }
        </div>
      </div>
      {modal && (
        <LibraryModal modal={modal} setModal={setModal} title={title} setTitle={setTitle} genre={genre} setGenre={setGenre} platform={platform} setPlatform={setPlatform} status={status} setStatus={setStatus} progress={progress} setProgress={setProgress} playtime={playtime} setPlaytime={setPlayime} rating={rating} setRating={setRating} colorAccent={colorAccent} setColorAccent={setColorAccent} achievementsEarned={achievementsEarned} setAchievementsEarned={setAchievementsEarned} totalAchievements={totalAchievements} setTotalAchievements={setTotalAchievements} notes={notes} setNotes={setNotes} games={games} setGames={setGames} editIndex={editIndex} setEditIndex={setEditIndex} />
      )}
    </div>
  )
}

export default LibraryContent
