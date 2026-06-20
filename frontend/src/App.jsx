    import React from 'react'
    import Dashboard from './pages/Dashboard'
    import Sidebar from './components/Sidebar'
    import SignIn from './pages/SignIn'
    import SignUp from './pages/SignUp'
    import Sessions from './pages/Sessions'
    import Library from './pages/Library'
    import Profile from './pages/Profile'
    import Landing from './pages/Landing'
    import { Routes, Route } from 'react-router-dom'

    const App = () => {
      
      return (
        <div className='flex h-screen overflow-hidden'>
          <Routes>
            <Route path="/" element={<Landing /> }/>
            <Route path="/signin" element={<SignIn /> }/>
            <Route path="/signup" element={<SignUp />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/library" element={<Library />} />\
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
      )
    }

    export default App
