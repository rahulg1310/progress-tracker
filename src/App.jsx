  import React from 'react'
  import Dashboard from './pages/Dashboard'
  import Sidebar from './components/Sidebar'
  import SignIn from './pages/SignIn'
  import SignUp from './pages/SignUp'
  import { Routes, Route } from 'react-router-dom'

  const App = () => {
    
    return (
      <div className='flex h-screen overflow-hidden'>
        {/*<SignIn />
        <Sidebar />
        <div className='flex-1 overflow-y-auto'>
          <Dashboard profile_stats={profile_stats} game_card={game_card} library_status={library_status} genre_breakdown={genre_breakdown} top_by_playtime={top_by_playtime} />
        </div>*/}
        <Routes>
          <Route path="/" element={<SignIn /> }/>
          <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    )
  }

  export default App
