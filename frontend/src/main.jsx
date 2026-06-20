import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import UserContext from './context/UserContext.jsx'
import GamesContext from './context/GamesContext.jsx'
import SessionContext from './context/SessionContext.jsx'
import { GoogleOAuthProvider } from "@react-oauth/google";

createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId = {import.meta.env.VITE_GOOGLE_CLIENT_ID}>
  <UserContext>
    <GamesContext>
      <BrowserRouter>
        <SessionContext>
          <App />
        </SessionContext>
      </BrowserRouter>
    </GamesContext>
  </UserContext>
  </GoogleOAuthProvider>
)
