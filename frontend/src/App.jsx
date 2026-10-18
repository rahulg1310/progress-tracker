    import React, { useContext } from 'react'
    import Dashboard from './pages/Dashboard'
    import Sidebar from './components/Sidebar'
    import SignIn from './pages/SignIn'
    import SignUp from './pages/SignUp'
    import Sessions from './pages/Sessions'
    import Library from './pages/Library'
    import Profile from './pages/Profile'
    import Landing from './pages/Landing'
    import Coach from './pages/Coach'
    import Insights from './pages/Insights'
    import Goals from './pages/Goals'
    import Discover from './pages/Discover'
    import { Routes, Route } from 'react-router-dom'
    import { Navigate } from 'react-router-dom'
    import { UserData } from './context/UserContext'

    const App = () => {
      const {user} = useContext(UserData);
      return (
        <div className='flex h-screen overflow-hidden'>
          <Routes>
            <Route path="/" element={user ? <Navigate to='/dashboard' /> : <Landing /> }/>
            <Route path="/signin" element={<SignIn /> }/>
            <Route path="/signup" element={<SignUp />} />
            <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to='/signin'/>} />
            <Route path="/sessions" element={user ? <Sessions /> : <Navigate to='/signin'/>} />
            <Route path="/library" element={user ? <Library /> : <Navigate to='/signin'/>} />\
            <Route path="/profile" element={user ? <Profile /> : <Navigate to='/signin'/>} />
            <Route path="/coach" element={user ? <Coach /> : <Navigate to='/signin'/>} />
            <Route path="/insights" element={user ? <Insights /> : <Navigate to='/signin'/>} />
            <Route path="/goals" element={user ? <Goals /> : <Navigate to='/signin'/>} />
            <Route path="/discover" element={user ? <Discover /> : <Navigate to='/signin'/>} />
          </Routes>
        </div>
      )
    }

    export default App
