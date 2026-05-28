    import React from 'react'
    import Dashboard from './pages/Dashboard'
    import Sidebar from './components/Sidebar'
    import SignIn from './pages/SignIn'
    import SignUp from './pages/SignUp'
    import { Routes, Route } from 'react-router-dom'

    const App = () => {
      
      return (
        <div className='flex h-screen overflow-hidden'>
          <Routes>
            <Route path="/" element={<SignIn /> }/>
            <Route path="/signup" element={<SignUp />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </div>
      )
    }

    export default App
