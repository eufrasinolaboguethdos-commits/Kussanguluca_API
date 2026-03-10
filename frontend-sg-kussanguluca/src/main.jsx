import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
//import { AuthProvider } from './contexts/AuthContext.jsx'
import { AuthProvider } from "./contexts/AuthProvider";


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider> {/* Embrulhamos a App aqui */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
