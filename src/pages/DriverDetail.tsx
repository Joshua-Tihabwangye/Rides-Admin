import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Grid, Card, CardContent, Typography, Avatar, Divider, Button, Tab, Tabs, CircularProgress, Alert } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import StatusBadge from '../components/StatusBadge'
import ReviewActionPanel, { ReviewStatus } from '../components/ReviewActionPanel'
import { getAdminDriver, patchAdminDriver } from '../services/api/adminApi'
import type { AdminDriverResponse } from '../services/api/adminApi'

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
            id={`driver-tabpanel-${index}`}
            aria-labelledby={`driver-tab-${index}`}
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

export default function DriverDetail() {
    const { id } = useParams() // id is backend driver ID (string)
    const navigate = useNavigate()
    const [tabValue, setTabValue] = useState(0)
    const [primaryStatus, setPrimaryStatus] = useState<'approved' | 'under_review' | 'suspended'>('under_review')
    const [activityStatus, setActivityStatus] = useState<'active' | 'inactive'>('inactive')
    const [driver, setDriver] = useState<AdminDriverResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!id) return
        const loadDriver = async () => {
            setLoading(true)
            try {
                const data = await getAdminDriver(id as string)
                setDriver(data)
                const mappedPrimary: 'approved' | 'under_review' | 'suspended' = data.status === 'active' ? 'approved' : 'suspended'
                setPrimaryStatus(mappedPrimary)
                setActivityStatus(data.status === 'active' ? 'active' : 'inactive')
            } catch (e: any) {
                setError(e?.message ?? 'Failed to load driver')
            } finally {
                setLoading(false)
            }
        }
        loadDriver()
    }, [id])

    const handleStatusUpdate = async (newStatus: ReviewStatus) => {
        if (!driver) return
        const mapped: 'approved' | 'under_review' | 'suspended' =
            newStatus === 'approved'
                ? 'approved'
                : newStatus === 'rejected'
                    ? 'suspended'
                    : 'under_review'
        setPrimaryStatus(mapped)
        try {
            const backendStatus = mapped === 'approved' ? 'active' : mapped === 'suspended' ? 'deleted' : 'active'
            await patchAdminDriver(driver.driverId || driver.userId, { status: backendStatus })
            // Refetch driver
            if (id) {
                const updated = await getAdminDriver(id as string)
                setDriver(updated)
            }
        } catch (e) {
            // handle error
        }
    }

    const toggleActivity = async () => {
        if (!driver) return
        const next: 'active' | 'inactive' = activityStatus === 'active' ? 'inactive' : 'active'
        setActivityStatus(next)
        try {
            const backendStatus = next === 'active' ? 'active' : 'deleted'
            await patchAdminDriver(driver.driverId || driver.userId, { status: backendStatus })
            if (id) {
                const updated = await getAdminDriver(id as string)
                setDriver(updated)
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

    if (error || !driver) {
        return <Alert severity="error">{error || 'Driver not found'}</Alert>
    }

    const displayName = driver.fullName || `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || 'Unknown'
    const phone = driver.phone || '+256 700 000 000'
    const city = driver.city || 'Unknown'
    const trips = driver.totalTrips ?? 0
    const rating = formatRating(driver.rating)

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/admin/drivers')}
                    sx={{ color: 'text.secondary' }}
                >
                    Back to Drivers
                </Button>
            </Box>

            <Grid container spacing={3}>
                {/* Left Column: Driver Info */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center', pt: 4 }}>
                            <Avatar
                                sx={{ width: 100, height: 100, mx: 'auto', mb: 2, bgcolor: 'secondary.main', fontSize: 32 }}
                            >
                                <DirectionsCarIcon fontSize="large" />
                            </Avatar>
                            <Typography variant="h6" fontWeight={700} gutterBottom>
                                Driver #{id}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
                                <StatusBadge status={primaryStatus} />
                                <StatusBadge status={activityStatus === 'active' ? 'active' : 'inactive'} />
                            </Box>

                            <Box sx={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <PhoneIcon color="action" fontSize="small" />
                                    <Typography variant="body2">{phone}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <EmailIcon color="action" fontSize="small" />
                                    <Typography variant="body2">{driver.email || `driver.${id}@example.com`}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <DirectionsCarIcon color="action" fontSize="small" />
                                    <Typography variant="body2">{city}</Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">Vehicle</Typography>
                                <Typography variant="body2" fontWeight={600}>EV Car</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">Total Trips</Typography>
                                <Typography variant="body2" fontWeight={600}>{trips}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">Rating</Typography>
                                <Typography variant="body2" fontWeight={600}>{rating} ★</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Column: Review & Content */}
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
                                <Tab label="Documents" />
                                <Tab label="Vehicle Info" />
                                <Tab label="Trip History" />
                            </Tabs>
                        </Box>

                        <CardContent>
                            <CustomTabPanel value={tabValue} index={0}>
                                <Typography variant="subtitle2" gutterBottom>Driver License</Typography>
                                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, mb: 2, border: '1px dashed grey', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2">No file chosen</Typography>
                                </Box>
                                <Typography variant="subtitle2" gutterBottom>Insurance</Typography>
                                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px dashed grey', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2">No file chosen</Typography>
                                </Box>
                            </CustomTabPanel>

                            <CustomTabPanel value={tabValue} index={1}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Typography variant="h6">EV Car</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Vehicle status is compliant.
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">Make/Model</Typography>
                                            <Typography variant="body2">EV Vehicle</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">Year</Typography>
                                            <Typography variant="body2">2023</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">Color</Typography>
                                            <Typography variant="body2">White</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">Capacity</Typography>
                                            <Typography variant="body2">4 Passengers</Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </CustomTabPanel>

                            <CustomTabPanel value={tabValue} index={2}>
                                {[1, 2, 3].map((i) => (
                                    <Box key={i} sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="subtitle2">Trip #{3000 + i}</Typography>
                                            <StatusBadge status="completed" label="Completed" />
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', fontSize: 13 }}>
                                            <DirectionsCarIcon fontSize="small" />
                                            Standard Ride • $15.00 • 5.2 km
                                        </Box>
                                    </Box>
                                ))}
                                {trips === 0 && <Typography color="text.secondary">No trips completed yet.</Typography>}
                            </CustomTabPanel>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    )
}
