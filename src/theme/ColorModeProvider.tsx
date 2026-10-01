import React, { useMemo, useState } from 'react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { ColorMode, ColorModeContext, makeEvzoneTheme } from './evzoneTheme'

export default function ColorModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ColorMode>('light')

  const api = useMemo(
    () => ({
      mode,
      setMode: (m: ColorMode) => {
        setMode(m)
      },
      toggle: () => {
        const next: ColorMode = mode === 'light' ? 'dark' : 'light'
        setMode(next)
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
