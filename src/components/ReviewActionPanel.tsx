import React from 'react'
import { Box, Button, Typography, Paper } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import InfoIcon from '@mui/icons-material/Info'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import StatusBadge from './StatusBadge'

export type ReviewStatus = 'approved' | 'rejected' | 'under_review' | 'needs_info' | 'pending'

interface ReviewActionPanelProps {
    status: string
    onUpdateStatus: (newStatus: ReviewStatus) => void
    isSubmitting?: boolean
}

export default function ReviewActionPanel({ status, onUpdateStatus, isSubmitting = false }: ReviewActionPanelProps) {
    const isFinal = status === 'approved' || status === 'rejected'

    return (
        <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 700 }}>
                    Review Actions
                </Typography>
                <StatusBadge status={status} />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select an outcome for this review. This will update the status badge and notify the relevant parties.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                    variant={status === 'approved' ? 'contained' : 'outlined'}
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => onUpdateStatus('approved')}
                    disabled={isSubmitting}
                    sx={{ borderColor: 'success.main', color: status === 'approved' ? 'white' : 'success.main' }}
                >
                    Approve
                </Button>

                <Button
                    variant={status === 'needs_info' ? 'contained' : 'outlined'}
                    color="warning"
                    startIcon={<InfoIcon />}
                    onClick={() => onUpdateStatus('needs_info')}
                    disabled={isSubmitting}
                    sx={{ borderColor: 'warning.main', color: status === 'needs_info' ? 'white' : 'warning.main' }}
                >
                    Request Info
                </Button>

                <Button
                    variant={status === 'under_review' ? 'contained' : 'outlined'}
                    color="info"
                    startIcon={<HourglassEmptyIcon />}
                    onClick={() => onUpdateStatus('under_review')}
                    disabled={isSubmitting}
                    sx={{ borderColor: 'info.main', color: status === 'under_review' ? 'white' : 'info.main' }}
                >
                    Under Review
                </Button>

                <Button
                    variant={status === 'rejected' ? 'contained' : 'outlined'}
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => onUpdateStatus('rejected')}
                    disabled={isSubmitting}
                    sx={{ borderColor: 'error.main', color: status === 'rejected' ? 'white' : 'error.main' }}
                >
                    Reject
                </Button>
            </Box>
        </Paper>
    )
}
