import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/tailwind.css'
import ColorModeProvider from './theme/ColorModeProvider'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ColorModeProvider>
      <App />
    </ColorModeProvider>
  </React.StrictMode>
)
