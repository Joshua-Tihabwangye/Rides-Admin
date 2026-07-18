import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Grid, Card, CardContent, Typography, Avatar, Divider, Button, Tab, Tabs, CircularProgress, Alert } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import StatusBadge from '../components/StatusBadge'
import ReviewActionPanel, { ReviewStatus } from '../components/ReviewActionPanel'
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler'
import { getAdminRider, patchAdminRider } from '../services/api/adminApi'
import type { AdminRiderResponse } from '../services/api/adminApi'

interface TabPanelProps {
    children?: React.ReactNode
    index: number
    value: number
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    )
}

function formatRating(value: unknown): string {
    const numericValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
    return Number.isFinite(numericValue) ? numericValue.toFixed(1) : 'N/A'
}

export default function RiderDetail() {
    const { id } = useParams() // id is backend user ID (string)
    const navigate = useNavigate()
    const [tabValue, setTabValue] = useState(0)
    const [primaryStatus, setPrimaryStatus] = useState<'approved' | 'under_review' | 'suspended'>('under_review')
    const [activityStatus, setActivityStatus] = useState<'active' | 'inactive'>('inactive')
    const [rider, setRider] = useState<AdminRiderResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!id) return
        const loadRider = async () => {
            setLoading(true)
            try {
                const data = await getAdminRider(id as string)
                setRider(data)
                const mappedPrimary: 'approved' | 'under_review' | 'suspended' = data.status === 'active' ? 'approved' : 'suspended'
                setPrimaryStatus(mappedPrimary)
                setActivityStatus(data.status === 'active' ? 'active' : 'inactive')
            } catch (e: any) {
                setError(e?.message ?? 'Failed to load rider')
            } finally {
                setLoading(false)
            }
        }
        loadRider()
    }, [id])

    const handleStatusUpdate = async (newStatus: ReviewStatus) => {
        if (!rider) return
        const mapped: 'approved' | 'under_review' | 'suspended' =
            newStatus === 'approved'
                ? 'approved'
                : newStatus === 'rejected'
                    ? 'suspended'
                    : 'under_review'
        setPrimaryStatus(mapped)
        try {
            const backendStatus = mapped === 'approved' ? 'active' : mapped === 'suspended' ? 'deleted' : 'active' // adjust as needed
            await patchAdminRider(rider.userId, { status: backendStatus })
            // Refetch rider
            if (id) {
                const updated = await getAdminRider(id as string)
                setRider(updated)
            }
        } catch (e) {
            // handle error
        }
    }

    const toggleActivity = async () => {
        if (!rider) return
        const next: 'active' | 'inactive' = activityStatus === 'active' ? 'inactive' : 'active'
        setActivityStatus(next)
        try {
            const backendStatus = next === 'active' ? 'active' : 'deleted' // or 'suspended'?
            await patchAdminRider(rider.userId, { status: backendStatus })
            if (id) {
                const updated = await getAdminRider(id as string)
                setRider(updated)
            }
        } catch (e) {
            // handle
        }
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        )
    }

    if (error || !rider) {
        return <Alert severity="error">{error || 'Rider not found'}</Alert>
    }

    const displayName = rider.fullName || `${rider.firstName || ''} ${rider.lastName || ''}`.trim() || 'Unknown'
    const phone = rider.phone || '—'
    const city = rider.city || 'Unknown'
    const trips = rider.totalTrips ?? 0
    const rating = formatRating(rider.rating)

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/admin/riders')}
                    sx={{ color: 'text.secondary' }}
                >
                    Back to Riders
                </Button>
            </Box>

            <Grid container spacing={3}>
                {/* Left Column: Profile Card */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center', pt: 4 }}>
                            <Avatar
                                sx={{ width: 100, height: 100, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: 32 }}
                            >
                                <TwoWheelerIcon />
                            </Avatar>
                            <Typography variant="h6" fontWeight={700} gutterBottom>
                                Rider #{id}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
                                <StatusBadge status={primaryStatus} />
                                <StatusBadge status={activityStatus === 'active' ? 'active' : 'inactive'} />
                            </Box>

                            <Box sx={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <EmailIcon color="action" fontSize="small" />
                                    <Typography variant="body2">{rider.email || '—'}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <PhoneIcon color="action" fontSize="small" />
                                    <Typography variant="body2">{phone}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <LocationOnIcon color="action" fontSize="small" />
                                    <Typography variant="body2">{city}</Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">Total Trips</Typography>
                                <Typography variant="body2" fontWeight={600}>{trips}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">Rating</Typography>
                                <Typography variant="body2" fontWeight={600}>{rating} ★</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">Join Date</Typography>
                                <Typography variant="body2" fontWeight={600}>—</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Column: Details & Actions */}
                <Grid item xs={12} md={8}>

                    <ReviewActionPanel status={primaryStatus} onUpdateStatus={handleStatusUpdate} />

                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={toggleActivity}
                            sx={{ textTransform: 'none', borderRadius: 999 }}
                        >
                            Set as {activityStatus === 'active' ? 'In-active' : 'Active'}
                        </Button>
                    </Box>

                    <Card sx={{ minHeight: 400 }}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                                <Tab label="Trip History" />
                                <Tab label="Payments" />
                                <Tab label="Documents" />
                            </Tabs>
                        </Box>

                        <CardContent>
                            <CustomTabPanel value={tabValue} index={0}>
                                <Typography color="text.secondary">No trip data available.</Typography>
                            </CustomTabPanel>
                            <CustomTabPanel value={tabValue} index={1}>
                                <Typography color="text.secondary">No payment data available.</Typography>
                            </CustomTabPanel>
                            <CustomTabPanel value={tabValue} index={2}>
                                <Typography color="text.secondary">No documents available.</Typography>
                            </CustomTabPanel>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    )
}
