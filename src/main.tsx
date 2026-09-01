import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/tailwind.css'
import ColorModeProvider from './theme/ColorModeProvider'
import App from './App'
import { registerWebPush } from './services/webPushRegistration'
import { ADMIN_BACKEND_ACCESS_TOKEN_KEY } from './services/api/adminApi'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ColorModeProvider>
      <App />
    </ColorModeProvider>
  </React.StrictMode>
)

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  try {
    const token = localStorage.getItem(ADMIN_BACKEND_ACCESS_TOKEN_KEY)
    if (token) {
      void registerWebPush(token)
    }
  } catch {
    // no-op
  }
}
