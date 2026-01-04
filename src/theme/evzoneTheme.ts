import React from 'react'
import { createTheme, ThemeOptions } from '@mui/material/styles'

export const EV_COLORS = {
  primary: '#03CD8C',
  secondary: '#F77F00',
  dark: '#020617',
}

export type ColorMode = 'light' | 'dark'

export function makeEvzoneTheme(mode: ColorMode) {
  const isDark = mode === 'dark'

  const base: ThemeOptions = {
    palette: {
      mode,
      primary: { main: EV_COLORS.primary },
      secondary: { main: EV_COLORS.secondary },
      background: {
        default: isDark ? EV_COLORS.dark : '#f8fafc',
        paper: isDark ? '#0b1220' : '#ffffff',
      },
      text: {
        primary: isDark ? '#e5e7eb' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#475569',
      },
      divider: isDark ? 'rgba(148,163,184,0.18)' : 'rgba(15,23,42,0.10)',
    },
    shape: { borderRadius: 4 },
    typography: {
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { textTransform: 'none', borderRadius: 8, fontWeight: 600 },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            border: isDark
              ? '1px solid rgba(148,163,184,0.18)'
              : 'none',
            backgroundColor: isDark ? '#0b1220' : '#ffffff',
            boxShadow: isDark
              ? '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)'
              : '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025), 0 0 0 1px rgba(0,0,0,0.03)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  }

  return createTheme(base)
}

export const ColorModeContext = React.createContext<{
  mode: ColorMode
  setMode: (mode: ColorMode) => void
  toggle: () => void
}>({
  mode: 'light',
  setMode: () => { },
  toggle: () => { },
})
