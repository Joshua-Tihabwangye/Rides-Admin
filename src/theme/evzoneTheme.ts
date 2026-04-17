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
        primary: isDark ? '#f1f5f9' : '#0f172a',
        secondary: isDark ? '#cbd5e1' : '#475569',
      },
      divider: isDark ? 'rgba(148,163,184,0.18)' : 'rgba(15,23,42,0.10)',
    },
    shape: { borderRadius: 4 },
    typography: {
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial,"Apple Color Emoji","Segoe UI Emoji"',
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
            color: isDark ? '#f1f5f9' : '#0f172a',
            boxShadow: isDark
              ? '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)'
              : '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025), 0 0 0 1px rgba(0,0,0,0.03)',
          },
        },
      },
      MuiTable: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-root': {
              color: isDark ? '#f1f5f9' : '#0f172a',
            },
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            color: isDark ? '#f1f5f9' : undefined,
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
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? 'rgba(148,163,184,0.08)' : '#f3f4f6',
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          ':root': {
            '--ev-bg': isDark ? '#020617' : '#f8fafc',
            '--ev-paper': isDark ? '#0b1220' : '#ffffff',
            '--ev-text': isDark ? '#f1f5f9' : '#0f172a',
            '--ev-text-secondary': isDark ? '#cbd5e1' : '#64748b',
            '--ev-border': isDark ? '#334155' : '#e2e8f0',
            '--ev-input-bg': isDark ? '#0b1220' : '#ffffff',
            '--ev-input-bg-error': isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
            '--ev-light-gray': isDark ? '#0b1220' : '#f8fafc',
            '--ev-card-shadow': isDark
              ? '0 4px 24px rgba(0,0,0,0.3)'
              : '0 4px 24px rgba(0,0,0,0.06)',
            '--ev-hero-footer-bg': isDark
              ? 'rgba(11,18,32,0.95)'
              : 'rgba(255,255,255,0.95)',
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
