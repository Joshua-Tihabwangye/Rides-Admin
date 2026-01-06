// @ts-nocheck
import React, { useState } from 'react'
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Popover,
} from '@mui/material'
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

export default function PeriodSelector({
  value,
  onChange,
  customStart,
  customEnd,
}: PeriodSelectorProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [tempStart, setTempStart] = useState<Dayjs | null>(customStart || dayjs().subtract(7, 'day'))
  const [tempEnd, setTempEnd] = useState<Dayjs | null>(customEnd || dayjs())

  const handleChange = (event: any) => {
    const newValue = event.target.value as PeriodOption
    if (newValue === 'custom') {
      onChange(newValue)
    } else {
      onChange(newValue)
    }
  }

  const handleCustomClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleCustomClose = () => {
    setAnchorEl(null)
  }

  const handleApplyCustom = () => {
    if (tempStart && tempEnd) {
      onChange('custom', { start: tempStart, end: tempEnd })
    }
    handleCustomClose()
  }

  const open = Boolean(anchorEl)

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="period-select-label" sx={{ fontSize: 12 }}>
            Period
          </InputLabel>
          <Select
            labelId="period-select-label"
            value={value}
            label="Period"
            onChange={handleChange}
            sx={{ fontSize: 12, borderRadius: 2 }}
          >
            {Object.entries(PERIOD_LABELS).map(([key, label]) => (
              <MenuItem key={key} value={key} sx={{ fontSize: 12 }}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {value === 'custom' && (
          <>
            <Button
              size="small"
              variant="outlined"
              onClick={handleCustomClick}
              sx={{ textTransform: 'none', fontSize: 11, borderRadius: 999 }}
            >
              {tempStart?.format('MMM D')} - {tempEnd?.format('MMM D, YYYY')}
            </Button>
            <Popover
              open={open}
              anchorEl={anchorEl}
              onClose={handleCustomClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
              <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <DatePicker
                  label="Start date"
                  value={tempStart}
                  onChange={(newValue) => setTempStart(newValue)}
                  slotProps={{ textField: { size: 'small' } }}
                />
                <DatePicker
                  label="End date"
                  value={tempEnd}
                  onChange={(newValue) => setTempEnd(newValue)}
                  slotProps={{ textField: { size: 'small' } }}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleApplyCustom}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 999,
                    bgcolor: '#03cd8c',
                    '&:hover': { bgcolor: '#0fb589' },
                  }}
                >
                  Apply
                </Button>
              </Box>
            </Popover>
          </>
        )}
      </Box>
    </LocalizationProvider>
  )
}
