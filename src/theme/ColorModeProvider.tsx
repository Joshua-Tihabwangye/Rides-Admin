import React, { useMemo, useState } from 'react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { ColorMode, ColorModeContext, makeEvzoneTheme } from './evzoneTheme'

const STORAGE_KEY = 'evzone_admin_color_mode'

export default function ColorModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ColorMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'dark' || stored === 'light' ? stored : 'light'
  })

  const api = useMemo(
    () => ({
      mode,
      setMode: (m: ColorMode) => {
        setMode(m)
        localStorage.setItem(STORAGE_KEY, m)
      },
      toggle: () => {
        const next: ColorMode = mode === 'light' ? 'dark' : 'light'
        setMode(next)
        localStorage.setItem(STORAGE_KEY, next)
      },
    }),
    [mode]
  )

  const theme = useMemo(() => makeEvzoneTheme(mode), [mode])

  return (
    <ColorModeContext.Provider value={api}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}
