import React, { useContext, useState } from 'react'
import { Sparkles, LoaderCircle, X, Compass } from 'lucide-react'
import { GamesData } from '../context/GamesContext'
import RecommendationCard from './RecommendationCard'
import CompareModal from './CompareModal'
import { mockDelay, getMockRecommendations } from '../mock/aiMockData'

const DiscoverContent = () => {
  const {games} = useContext(GamesData);
  const favourites = games
    .filter((elem)=>elem.status==='Completed' || elem.rating>=8)
    .slice(0,4)
    .map((elem)=>elem.title);

  // null = not edited yet, so follow the library (games load after first render)
  const [editedLiked, setLikedGames] = useState(null);
  const likedGames = editedLiked ?? (favourites.length>0 ? favourites : ['Sekiro', 'Black Myth: Wukong']);
  const [likedInput, setLikedInput] = useState('');
  const [mood, setMood] = useState('');
  const [platform, setPlatform] = useState('Any');
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [compareModal, setCompareModal] = useState(false);
  const [added, setAdded] = useState({});

  const addLiked = ()=>{
    const title = likedInput.trim();
    if(!title || likedGames.length>=6) return;
    if(!likedGames.some((elem)=>elem.toLowerCase()===title.toLowerCase())){
      setLikedGames([...likedGames, title]);
    }
    setLikedInput('');
  }

  const getRecommendations = async ()=>{
    if(likedGames.length===0 && mood.trim()===''){
      setError('Add at least one game you loved, or describe what you are in the mood for.');
      return;
    }
    try{
      setError('');
      setLoading(true);
      setCompareIds([]);
      // MOCK: Phase 4 replaces this with POST /ai/recommendations {likedGames, mood, platform}
      await mockDelay(1100);
      const results = getMockRecommendations(games.map((elem)=>elem.title)).filter((elem)=>{
        return platform==='Any' || elem.platforms.includes(platform);
      });
      setRecs(results);
      setHasSearched(true);
    }
    catch(error){
      console.log(error);
      setError('Could not get recommendations right now. Please try again.');
    }
    finally{
      setLoading(false);
    }
  }

  const toggleCompare = (id)=>{
    if(compareIds.includes(id)){
      setCompareIds(compareIds.filter((elem)=>elem!==id));
    }
    else if(compareIds.length<3){
      setCompareIds([...compareIds, id]);
    }
  }

  // MOCK: Phase 4 sends this through the agent's add_game action (POST /games via Express)
  const addGame = async (rec, status)=>{
    await mockDelay(600);
    setAdded((prev)=>({...prev, [rec._id] : status}));
  }

  return (
    <div className='w-full py-5 px-8 md:px-12 flex flex-col gap-6'>
      <div className='flex flex-col'>
        <h1 className='font-bold text-4xl tracking-wider'>Discover</h1>
        <h4 className='body text-[13px] text-[#8a9bb0]'>Recommendations based on your library and what you tell Coach</h4>
      </div>

      <div className='w-full bg-[#111620] py-5 px-6 rounded-2xl border border-gray-400/15 flex flex-col gap-4'>
        <div className='flex flex-col gap-2'>
          <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Games you loved</span>
          <div className='flex gap-2 flex-wrap items-center'>
            {likedGames.map(function(elem){
              return (
                <span key={elem} className='body text-[13px] flex items-center gap-1.5 border border-green-400/40 text-green-400 rounded-full pl-3 pr-1.5 py-0.5'>
                  {elem}
                  <button
                  onClick={()=>{
                    setLikedGames(likedGames.filter((title)=>title!==elem));
                  }}
                  className='hover:bg-gray-700 rounded-full p-0.5 transition-all duration-200'><X size={12}/></button>
                </span>
              )
            })}
            {likedGames.length<6 && (
              <input
              onChange={(e)=>{
                setLikedInput(e.target.value);
              }}
              onKeyDown={(e)=>{
                if(e.key==='Enter'){
                  e.preventDefault();
                  addLiked();
                }
              }}
              type="text" value={likedInput} placeholder='Type a game and press Enter' className='bg-[#080c10] py-1 px-2 rounded-[6px] text-[13px] body border outline-none border-white/15 focus:border-green-400 transition-all duration-200 placeholder:text-[#4a5568] w-56'/>
            )}
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-[1fr_180px] gap-4'>
          <div className='flex flex-col gap-1'>
            <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Anything specific? (optional)</span>
            <input
            onChange={(e)=>{
              setMood(e.target.value);
            }}
            type="text" maxLength={200} value={mood} placeholder='e.g. something shorter, under 20 hours, with great bosses' className='bg-[#080c10] py-1 px-2 rounded-[6px] text-[15px] body border outline-none border-white/15 focus:border-green-400 transition-all duration-200 placeholder:text-[#4a5568]'/>
          </div>
          <div className='flex flex-col gap-1'>
            <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Platform</span>
            <select
            onChange={(e)=>{
              setPlatform(e.target.value);
            }}
            value={platform} className='bg-[#080c10] py-1 px-2 rounded-[6px] body text-[15px] border border-white/15 focus:border-green-400 transition-all duration-200'>
              <option>Any</option>
              <option>PC</option>
              <option>PS5</option>
              <option>PS4</option>
              <option>Xbox</option>
              <option>Switch</option>
            </select>
          </div>
        </div>
        <span className='body text-[11px] text-[#ff2929]'>{error}</span>
        <div className='flex justify-end'>
          <button disabled={loading}
          onClick={()=>{
            getRecommendations();
          }}
          className='font-bold tracking-wider text-black bg-linear-to-r from-green-400 to-cyan-400 rounded-[7px] py-1.5 hover:-translate-y-0.5 hover:opacity-80 transition-all duration-200 px-3 flex items-center gap-2 disabled:opacity-50'>{loading ? <LoaderCircle size={16} className='animate-spin'/> : <Sparkles size={16}/>}Get Recommendations</button>
        </div>
      </div>

      {loading ? (
        <div className='flex flex-col items-center gap-3 py-12'>
          <LoaderCircle className='animate-spin' size={22} color='#8a9bb0'/>
          <p className='body text-[13px] text-[#4a5568]'>Matching games to your taste...</p>
        </div>
      ) : !hasSearched ? (
        <div className='flex w-full justify-center items-center'>
          <div className='p-8 text-center flex flex-col items-center gap-3'>
            <Compass size={32} color='#4a5568'/>
            <h1 className='font-bold text-xl text-[#8a9bb0]'>Find Your Next Game</h1>
            <p className='body text-sm text-[#4a5568]'>Games already in your library are never recommended.</p>
          </div>
        </div>
      ) : recs.length===0 ? (
        <div className='flex w-full justify-center items-center'>
          <div className='p-8 text-center'>
            <h1 className='font-bold text-xl text-[#8a9bb0]'>No Matches Found</h1>
            <p className='body text-sm text-[#4a5568] mt-2'>Try another platform or add more games you loved.</p>
          </div>
        </div>
      ) : (
        <div className='flex flex-col gap-3 mb-20'>
          <h1 className='text-[#4a5568] text-[13px] font-semibold'>{recs.length} Recommendations · select up to 3 to compare</h1>
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
            {recs.map(function(elem){
              return <RecommendationCard key={elem._id} rec={elem} likedGames={likedGames} selected={compareIds.includes(elem._id)} toggleCompare={toggleCompare} added={Boolean(added[elem._id])} addedStatus={added[elem._id]} addGame={addGame} />
            })}
          </div>
        </div>
      )}

      {compareIds.length>=2 && (
        <div className='fixed bottom-5 left-1/2 -translate-x-1/2 md:left-[calc(50%+120px)] z-40 bg-[#111820] border border-cyan-400/40 rounded-2xl px-4 py-2.5 flex items-center gap-4 shadow-lg'>
          <span className='body text-[13px] text-[#8a9bb0] whitespace-nowrap'>{compareIds.length} selected</span>
          <button
          onClick={()=>{
            setCompareModal(true);
          }}
          className='font-bold tracking-wider text-black bg-linear-to-r from-green-400 to-cyan-400 rounded-[7px] py-1 px-3 hover:opacity-80 transition-all duration-200 whitespace-nowrap'>Compare</button>
        </div>
      )}

      {compareModal && (
        <CompareModal recs={recs.filter((elem)=>compareIds.includes(elem._id))} setCompareModal={setCompareModal} />
      )}
    </div>
  )
}

export default DiscoverContent
