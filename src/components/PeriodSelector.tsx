import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Divider,
  Popover,
  Stack,
  Typography,
} from '@mui/material'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs, { Dayjs } from 'dayjs'

export type PeriodOption = 'today' | '7days' | 'thisMonth' | 'thisYear' | 'custom'

interface PeriodSelectorProps {
  value: PeriodOption
  onChange: (period: PeriodOption, customRange?: { start: Dayjs; end: Dayjs }) => void
  customStart?: Dayjs | null
  customEnd?: Dayjs | null
}

const PERIOD_LABELS: Record<PeriodOption, string> = {
  today: 'Today',
  '7days': 'Last 7 days',
  thisMonth: 'This month',
  thisYear: 'This year',
  custom: 'Custom range',
}

const PERIOD_OPTIONS: PeriodOption[] = ['today', '7days', 'thisMonth', 'thisYear', 'custom']

export default function PeriodSelector({
  value,
  onChange,
  customStart,
  customEnd,
}: PeriodSelectorProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [draftPeriod, setDraftPeriod] = useState<PeriodOption>(value)
  const [tempStart, setTempStart] = useState<Dayjs | null>(customStart ?? dayjs().subtract(7, 'day'))
  const [tempEnd, setTempEnd] = useState<Dayjs | null>(customEnd ?? dayjs())

  useEffect(() => {
    setDraftPeriod(value)
  }, [value])

  useEffect(() => {
    if (customStart) setTempStart(customStart)
    if (customEnd) setTempEnd(customEnd)
  }, [customEnd, customStart])

  const open = Boolean(anchorEl)
  const selectedLabel = value === 'custom' && customStart && customEnd
    ? `${customStart.format('MMM D')} - ${customEnd.format('MMM D, YYYY')}`
    : PERIOD_LABELS[value]

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setDraftPeriod(value)
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => setAnchorEl(null)

  const handlePickPeriod = (nextPeriod: PeriodOption) => {
    setDraftPeriod(nextPeriod)
    if (nextPeriod !== 'custom') {
      onChange(nextPeriod)
      handleClose()
    }
  }

  const handleApplyCustom = () => {
    if (!tempStart || !tempEnd) return
    const start = tempStart.isAfter(tempEnd) ? tempEnd : tempStart
    const end = tempStart.isAfter(tempEnd) ? tempStart : tempEnd
    onChange('custom', { start, end })
    handleClose()
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Button
          size="small"
          variant="outlined"
          startIcon={<CalendarTodayIcon fontSize="small" />}
          endIcon={<KeyboardArrowDownIcon fontSize="small" />}
          onClick={handleOpen}
          aria-haspopup="dialog"
          aria-expanded={open ? 'true' : undefined}
          sx={{
            minHeight: 40,
            px: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: 12,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            whiteSpace: 'nowrap',
          }}
        >
          {selectedLabel}
        </Button>
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          disableAutoFocus
          disableEnforceFocus
          PaperProps={{
            sx: {
              mt: 1,
              width: 320,
              maxWidth: 'calc(100vw - 32px)',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 18px 45px rgba(15,23,42,0.16)',
              overflow: 'hidden',
            },
          }}
        >
          <Box sx={{ p: 1 }}>
            <Stack spacing={0.5}>
              {PERIOD_OPTIONS.map((option) => {
                const selected = draftPeriod === option
                return (
                  <Button
                    key={option}
                    fullWidth
                    size="small"
                    variant={selected ? 'contained' : 'text'}
                    onClick={() => handlePickPeriod(option)}
                    sx={{
                      justifyContent: 'flex-start',
                      minHeight: 34,
                      borderRadius: 1.5,
                      textTransform: 'none',
                      fontSize: 12,
                      bgcolor: selected ? '#03cd8c' : 'transparent',
                      color: selected ? '#020617' : 'text.primary',
                      '&:hover': { bgcolor: selected ? '#0fb589' : 'action.hover' },
                    }}
                  >
                    {PERIOD_LABELS[option]}
                  </Button>
                )
              })}
            </Stack>

            {draftPeriod === 'custom' ? (
              <>
                <Divider sx={{ my: 1.25 }} />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 700 }}>
                  Custom dates
                </Typography>
                <Stack spacing={1.5}>
                  <DatePicker
                    label="Start date"
                    value={tempStart}
                    onChange={(newValue) => setTempStart(newValue)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                  <DatePicker
                    label="End date"
                    value={tempEnd}
                    onChange={(newValue) => setTempEnd(newValue)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleApplyCustom}
                    disabled={!tempStart || !tempEnd}
                    sx={{
                      textTransform: 'none',
                      borderRadius: 1.5,
                      bgcolor: '#03cd8c',
                      color: '#020617',
                      '&:hover': { bgcolor: '#0fb589' },
                    }}
                  >
                    Apply range
                  </Button>
                </Stack>
              </>
            ) : null}
          </Box>
        </Popover>
      </Box>
    </LocalizationProvider>
  )
}
