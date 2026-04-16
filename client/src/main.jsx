import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppContextProvider } from './context/AppContext.jsx'
import {HashRouter} from 'react-router-dom'

createRoot(document.getElementById('root')).render(
 <HashRouter>
 
 <AppContextProvider>
    <App />
  </AppContextProvider>
 </HashRouter>
)
