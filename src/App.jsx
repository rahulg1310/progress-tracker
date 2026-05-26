import React from 'react'
import Dashboard from './pages/Dashboard'
import Sidebar from './components/Sidebar'

const App = () => {
  return (
    <div className='flex h-screen overflow-hidden'>
      <Sidebar />
      <div className='flex-1 overflow-y-auto'>
        <Dashboard />
      </div>
    </div>
  )
}

export default App
