import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/tailwind.css'
import ColorModeProvider from './theme/ColorModeProvider'
import App from './App'
import { pushAuditEvent } from './lib/auditStore'

function setupAuditConsoleBridge() {
  const originalLog = console.log
  console.log = (...args: unknown[]) => {
    try {
      if (args.length >= 2 && args[0] === 'AuditLog:' && typeof args[1] === 'object' && args[1] !== null) {
        const evt = args[1] as Record<string, unknown>
        if (typeof evt.event === 'string' && typeof evt.at === 'string') {
          pushAuditEvent({ ...(evt as any) })
        }
      }
    } catch {
      // ignore
    }
    originalLog(...args)
  }
}

setupAuditConsoleBridge()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ColorModeProvider>
      <App />
    </ColorModeProvider>
  </React.StrictMode>
)
