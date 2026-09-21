import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/tailwind.css'
import ColorModeProvider from './theme/ColorModeProvider'
import App from './App'
import { registerWebPush } from './services/webPushRegistration'
import { ADMIN_BACKEND_ACCESS_TOKEN_KEY } from './services/api/adminApi'

const STYLE_RELOAD_KEY = 'evzone-admin-style-reload-attempt'

function tailwindUtilitiesAreActive() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return true
  }

  const probe = document.createElement('div')
  probe.className = 'hidden'
  probe.setAttribute('aria-hidden', 'true')
  document.body.appendChild(probe)
  const isHidden = window.getComputedStyle(probe).display === 'none'
  probe.remove()
  return isHidden
}

function ensureAdminStylesLoaded() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }

  window.setTimeout(() => {
    if (tailwindUtilitiesAreActive()) {
      sessionStorage.removeItem(STYLE_RELOAD_KEY)
      return
    }

    const reloadAttemptKey = `${window.location.pathname}:${__APP_VERSION__}`
    if (sessionStorage.getItem(STYLE_RELOAD_KEY) === reloadAttemptKey) {
      console.warn('Admin stylesheet did not become active after automatic reload.')
      return
    }

    const stylesheet = document.querySelector<HTMLLinkElement>('link[data-evzone-admin-css="tailwind"]')
    if (stylesheet) {
      const href = new URL(stylesheet.href, window.location.href)
      href.searchParams.set('v', `${Date.now()}`)
      stylesheet.href = href.toString()
    }

    sessionStorage.setItem(STYLE_RELOAD_KEY, reloadAttemptKey)
    window.setTimeout(() => {
      if (!tailwindUtilitiesAreActive()) {
        window.location.reload()
      }
    }, 250)
  }, 300)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ColorModeProvider>
      <App />
    </ColorModeProvider>
  </React.StrictMode>
)

ensureAdminStylesLoaded()

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
