import React from 'react'
import { Chip, ChipProps } from '@mui/material'
import { useTheme } from '@mui/material/styles'

export type StatusType =
    | 'active'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'suspended'
    | 'under_review'
    | 'needs_info'
    | 'inactive'
    | 'new'

interface StatusBadgeProps extends Omit<ChipProps, 'color'> {
    status: string
    label?: string
}

const STATUS_CONFIG: Record<string, { color: string; label: string; bgColor?: string }> = {
    active: { color: '#10b981', label: 'Active', bgColor: 'rgba(16, 185, 129, 0.12)' },
    approved: { color: '#10b981', label: 'Approved', bgColor: 'rgba(16, 185, 129, 0.12)' },
    pending: { color: '#f59e0b', label: 'Pending', bgColor: 'rgba(245, 158, 11, 0.12)' },
    under_review: { color: '#3b82f6', label: 'Under Review', bgColor: 'rgba(59, 130, 246, 0.12)' },
    needs_info: { color: '#f97316', label: 'Needs Info', bgColor: 'rgba(249, 115, 22, 0.12)' },
    rejected: { color: '#ef4444', label: 'Rejected', bgColor: 'rgba(239, 68, 68, 0.12)' },
    suspended: { color: '#ef4444', label: 'Suspended', bgColor: 'rgba(239, 68, 68, 0.12)' },
    inactive: { color: '#64748b', label: 'Inactive', bgColor: 'rgba(100, 116, 139, 0.12)' },
    new: { color: '#8b5cf6', label: 'New', bgColor: 'rgba(139, 92, 246, 0.12)' },
}

export default function StatusBadge({ status, label, sx, ...props }: StatusBadgeProps) {
    const normalized = status.toLowerCase().replace(/\s+/g, '_')
    const config = STATUS_CONFIG[normalized] || { color: '#64748b', label: status, bgColor: 'rgba(100, 116, 139, 0.12)' }
    const theme = useTheme()
    const displayLabel = label || config.label

    return (
        <Chip
            size="small"
            label={displayLabel}
            sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24,
                color: config.color,
                backgroundColor: config.bgColor,
                borderRadius: '6px',
                border: `1px solid ${config.color}40`,
                ...sx,
            }}
            {...props}
        />
    )
}
