import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, Grid, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import StatusBadge from '../components/StatusBadge'
import ReviewActionPanel, { ReviewStatus } from '../components/ReviewActionPanel'
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler'
import { getAdminRidePayments, getAdminRider, listAdminRiderServices, listAdminRides, patchAdminRider } from '../services/api/adminApi'
import type { AdminRideListItemResponse, AdminRidePaymentResponse, AdminRiderResponse, AdminRiderServiceResponse } from '../services/api/adminApi'

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

function formatMoney(value: unknown, currency = 'UGX'): string {
    const numericValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
    if (!Number.isFinite(numericValue)) return '—'
    return `${currency} ${numericValue.toLocaleString('en-UG')}`
}

function formatDate(value: string | number | undefined | null): string {
    if (!value) return '—'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('en-UG', { dateStyle: 'medium', timeStyle: 'short' })
}

function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback
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
    const [actionError, setActionError] = useState<string | null>(null)
    const [actionLoading, setActionLoading] = useState(false)
    const [rides, setRides] = useState<AdminRideListItemResponse[]>([])
    const [payments, setPayments] = useState<AdminRidePaymentResponse[]>([])
    const [services, setServices] = useState<AdminRiderServiceResponse[]>([])
    const [detailsLoading, setDetailsLoading] = useState(false)
    const [detailsError, setDetailsError] = useState<string | null>(null)

    useEffect(() => {
        if (!id) return
        const loadRider = async () => {
            setLoading(true)
            setError(null)
            setDetailsError(null)
            try {
                const data = await getAdminRider(id)
                setRider(data)
                const mappedPrimary: 'approved' | 'under_review' | 'suspended' = data.status === 'active' ? 'approved' : 'suspended'
                setPrimaryStatus(mappedPrimary)
                setActivityStatus(data.status === 'active' ? 'active' : 'inactive')
                const riderId = data.riderId || data.userId || id
                setDetailsLoading(true)
                try {
                    const [rideResponse, serviceResponse] = await Promise.all([
                        listAdminRides({ riderId, limit: 10 }),
                        listAdminRiderServices({ riderId }),
                    ])
                    setRides(rideResponse.items ?? [])
                    setServices(serviceResponse ?? [])
                    const ridePayments = await Promise.all(
                        (rideResponse.items ?? []).slice(0, 8).map(async (ride) => {
                            try {
                                const response = await getAdminRidePayments(ride.id)
                                return response.payments ?? []
                            } catch {
                                return []
                            }
                        }),
                    )
                    setPayments(ridePayments.flat())
                } catch (detailsLoadError) {
                    setDetailsError(getErrorMessage(detailsLoadError, 'Failed to load rider history and service records'))
                }
            } catch (e) {
                setError(getErrorMessage(e, 'Failed to load rider'))
            } finally {
                setLoading(false)
                setDetailsLoading(false)
            }
        }
        void loadRider()
    }, [id])

    const handleStatusUpdate = async (newStatus: ReviewStatus) => {
        if (!rider) return
        const mapped: 'approved' | 'under_review' | 'suspended' =
            newStatus === 'approved'
                ? 'approved'
                : newStatus === 'rejected'
                    ? 'suspended'
                    : 'under_review'
        setActionLoading(true)
        setActionError(null)
        try {
            const backendStatus = mapped === 'approved' ? 'active' : mapped === 'suspended' ? 'deleted' : 'active' // adjust as needed
            await patchAdminRider(rider.userId, { status: backendStatus })
            if (id) {
                const updated = await getAdminRider(id)
                setRider(updated)
                setPrimaryStatus(updated.status === 'active' ? 'approved' : 'suspended')
                setActivityStatus(updated.status === 'active' ? 'active' : 'inactive')
            }
        } catch (e) {
            setActionError(getErrorMessage(e, 'Failed to update rider status'))
        } finally {
            setActionLoading(false)
        }
    }

    const toggleActivity = async () => {
        if (!rider) return
        const next: 'active' | 'inactive' = activityStatus === 'active' ? 'inactive' : 'active'
        setActionLoading(true)
        setActionError(null)
        try {
            const backendStatus = next === 'active' ? 'active' : 'deleted' // or 'suspended'?
            await patchAdminRider(rider.userId, { status: backendStatus })
            if (id) {
                const updated = await getAdminRider(id)
                setRider(updated)
                setPrimaryStatus(updated.status === 'active' ? 'approved' : 'suspended')
                setActivityStatus(updated.status === 'active' ? 'active' : 'inactive')
            }
        } catch (e) {
            setActionError(getErrorMessage(e, 'Failed to update rider activity'))
        } finally {
            setActionLoading(false)
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
                                {displayName}
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

                    {actionError ? <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert> : null}

                    <ReviewActionPanel status={primaryStatus} onUpdateStatus={handleStatusUpdate} />

                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={toggleActivity}
                            disabled={actionLoading}
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
                            {detailsError ? <Alert severity="error" sx={{ mb: 2 }}>{detailsError}</Alert> : null}
                            {detailsLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                    <CircularProgress size={28} />
                                </Box>
                            ) : null}
                            <CustomTabPanel value={tabValue} index={0}>
                                {rides.length === 0 ? (
                                    <Typography color="text.secondary">No backend ride history returned for this rider.</Typography>
                                ) : (
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Ride</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Driver</TableCell>
                                                <TableCell align="right">Fare</TableCell>
                                                <TableCell>Created</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {rides.map((ride) => (
                                                <TableRow key={ride.id} hover onClick={() => navigate(`/admin/rides/${ride.id}`)} sx={{ cursor: 'pointer' }}>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={600}>#{ride.id.slice(0, 8)}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{ride.tripType || ride.mode || ride.category || 'Ride'}</Typography>
                                                    </TableCell>
                                                    <TableCell><Chip size="small" label={ride.status} /></TableCell>
                                                    <TableCell>{ride.driverName || ride.driverId || '—'}</TableCell>
                                                    <TableCell align="right">{formatMoney(ride.finalFare ?? ride.estimatedFare, ride.currency)}</TableCell>
                                                    <TableCell>{formatDate(ride.createdAt ?? ride.scheduledAt)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CustomTabPanel>
                            <CustomTabPanel value={tabValue} index={1}>
                                {payments.length === 0 ? (
                                    <Typography color="text.secondary">No persisted ride payments returned for this rider.</Typography>
                                ) : (
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Reference</TableCell>
                                                <TableCell>Provider</TableCell>
                                                <TableCell>Method</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell align="right">Amount</TableCell>
                                                <TableCell>Paid</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {payments.map((payment) => (
                                                <TableRow key={payment.id}>
                                                    <TableCell>{payment.reference || payment.providerReference || payment.id}</TableCell>
                                                    <TableCell>{payment.provider}</TableCell>
                                                    <TableCell>{payment.method}</TableCell>
                                                    <TableCell><Chip size="small" label={payment.status} /></TableCell>
                                                    <TableCell align="right">{formatMoney(payment.amount, payment.currency)}</TableCell>
                                                    <TableCell>{formatDate(payment.paidAt)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CustomTabPanel>
                            <CustomTabPanel value={tabValue} index={2}>
                                {services.length === 0 ? (
                                    <Alert severity="info">No rental, tour, or ambulance service requests returned for this rider. Rider document endpoints are not exposed by the current admin backend contract.</Alert>
                                ) : (
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Request</TableCell>
                                                <TableCell>Service</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Driver</TableCell>
                                                <TableCell>Updated</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {services.map((service) => (
                                                <TableRow key={service.id} hover>
                                                    <TableCell>{service.id}</TableCell>
                                                    <TableCell>{service.serviceType}</TableCell>
                                                    <TableCell><Chip size="small" label={service.status} /></TableCell>
                                                    <TableCell>{service.driverId || '—'}</TableCell>
                                                    <TableCell>{formatDate(service.updatedAt || service.createdAt)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CustomTabPanel>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    )
}
