import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { version as appVersion } from './package.json'
import { execSync } from 'node:child_process'

function gitSha() {
  try {
    return execSync('git rev-parse HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __GIT_SHA__: JSON.stringify(gitSha()),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [react()],
  server: {
    port: 5176,
    strictPort: true,
  },
})
