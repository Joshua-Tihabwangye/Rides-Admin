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
  resolve: {
    alias: [
      // Use the ESM builds of MUI icons so Vite does not wrap the CJS
      // default export in a broken namespace object (Rides-Admin would
      // otherwise render a blank page because every icon becomes an
      // invalid React element type).
      { find: /^@mui\/icons-material\/(.+)$/, replacement: '@mui/icons-material/esm/$1' },
      { find: /^@mui\/icons-material$/, replacement: '@mui/icons-material/esm/index.js' },
    ],
  },
  optimizeDeps: {
    force: true,
    include: ['@mui/material', '@mui/icons-material'],
  },
  server: {
    port: 5176,
    strictPort: true,
  },
})
