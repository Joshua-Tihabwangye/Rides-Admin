import React, { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Grid, Card, CardContent, Typography, Avatar, Divider, Button, Tab, Tabs, CircularProgress, Alert, Table, TableBody, TableCell, TableHead, TableRow, Chip } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import StatusBadge from '../components/StatusBadge'
import ReviewActionPanel, { ReviewStatus } from '../components/ReviewActionPanel'
import {
    getAdminDriver,
    patchAdminDriver,
    getAdminDriverEarnings,
    getAdminDriverEarningsSummary,
    getAdminDriverEarningsStatement,
    createAdminSocket,
    isAdminBackendEnabled,
} from '../services/api/adminApi'
import type {
    AdminDriverResponse,
    AdminDriverEarningEntry,
    AdminDriverEarningsSummary,
    AdminDriverEarningsStatement,
} from '../services/api/adminApi'

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

function formatMoney(value: unknown, currency = 'UGX'): string {
    const numericValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
    if (!Number.isFinite(numericValue)) return '—'
    return `${currency} ${numericValue.toLocaleString('en-UG')}`
}

function formatDate(value: string | undefined | null): string {
    if (!value) return '—'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-UG', { dateStyle: 'medium', timeStyle: 'short' })
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
    const [earnings, setEarnings] = useState<AdminDriverEarningEntry[]>([])
    const [earningsSummary, setEarningsSummary] = useState<AdminDriverEarningsSummary | null>(null)
    const [statement, setStatement] = useState<AdminDriverEarningsStatement | null>(null)
    const [earningsLoading, setEarningsLoading] = useState(false)
    const [earningsError, setEarningsError] = useState<string | null>(null)

    const loadEarnings = useCallback(async () => {
        const driverId = driver?.driverId || id
        if (!driverId) return
        setEarningsLoading(true)
        setEarningsError(null)
        try {
            const [entries, summary, stmt] = await Promise.all([
                getAdminDriverEarnings(driverId),
                getAdminDriverEarningsSummary(driverId),
                getAdminDriverEarningsStatement(driverId),
            ])
            setEarnings(entries ?? [])
            setEarningsSummary(summary ?? null)
            setStatement(stmt ?? null)
        } catch (e: any) {
            setEarningsError(e?.message ?? 'Failed to load earnings')
        } finally {
            setEarningsLoading(false)
        }
    }, [driver, id])

    useEffect(() => {
        if (tabValue === 3) {
            void loadEarnings()
        }
    }, [tabValue, loadEarnings])

    // Refresh the earnings tab in realtime when ledger/payment events land.
    useEffect(() => {
        if (tabValue !== 3 || !isAdminBackendEnabled()) return
        const socket = createAdminSocket()
        const onRealtimeEvent = () => {
            void loadEarnings()
        }
        socket.on('domain.event', onRealtimeEvent)
        socket.on('operations.service.updated', onRealtimeEvent)
        socket.connect()
        return () => {
            socket.off('domain.event', onRealtimeEvent)
            socket.off('operations.service.updated', onRealtimeEvent)
            socket.disconnect()
        }
    }, [tabValue, loadEarnings])

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
    const phone = driver.phone || '—'
    const city = driver.city || 'Unknown'
    const trips = driver.totalTrips ?? 0
    const rating = formatRating(driver.rating)
    const vehicle = [driver.vehicleType, driver.model, driver.licensePlate].filter(Boolean).join(' · ') || '—'

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
                                    <Typography variant="body2">{driver.email || '—'}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <DirectionsCarIcon color="action" fontSize="small" />
                                    <Typography variant="body2">{city}</Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">Vehicle</Typography>
                                <Typography variant="body2" fontWeight={600}>{vehicle}</Typography>
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
                                <Tab label="Earnings" />
                            </Tabs>
                        </Box>

                        <CardContent>
                            <CustomTabPanel value={tabValue} index={0}>
                                <Typography color="text.secondary">No documents available.</Typography>
                            </CustomTabPanel>

                            <CustomTabPanel value={tabValue} index={1}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Typography variant="h6">{vehicle}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Vehicle details from backend records.
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">Vehicle Type</Typography>
                                            <Typography variant="body2">{driver.vehicleType || '—'}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">Model</Typography>
                                            <Typography variant="body2">{driver.model || '—'}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">License Plate</Typography>
                                            <Typography variant="body2">{driver.licensePlate || '—'}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">City</Typography>
                                            <Typography variant="body2">{driver.city || '—'}</Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </CustomTabPanel>

                            <CustomTabPanel value={tabValue} index={2}>
                                <Typography color="text.secondary">No trip data available.</Typography>
                            </CustomTabPanel>

                            <CustomTabPanel value={tabValue} index={3}>
                                {earningsError ? (
                                    <Alert severity="error" sx={{ mb: 2 }}>{earningsError}</Alert>
                                ) : null}
                                {earningsLoading && earnings.length === 0 ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                        <CircularProgress size={28} />
                                    </Box>
                                ) : (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={6} sm={3}>
                                                <Card variant="outlined">
                                                    <CardContent>
                                                        <Typography variant="caption" color="text.secondary">Total earned</Typography>
                                                        <Typography variant="h6" fontWeight={800}>
                                                            {formatMoney(earningsSummary?.total ?? statement?.totalGross ?? 0, earningsSummary?.currency ?? statement?.currency ?? 'UGX')}
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                            <Grid item xs={6} sm={3}>
                                                <Card variant="outlined">
                                                    <CardContent>
                                                        <Typography variant="caption" color="text.secondary">Pending</Typography>
                                                        <Typography variant="h6" fontWeight={800} color="warning.main">
                                                            {formatMoney(earningsSummary?.pending ?? 0, earningsSummary?.currency ?? 'UGX')}
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                            <Grid item xs={6} sm={3}>
                                                <Card variant="outlined">
                                                    <CardContent>
                                                        <Typography variant="caption" color="text.secondary">Settled</Typography>
                                                        <Typography variant="h6" fontWeight={800} color="success.main">
                                                            {formatMoney(earningsSummary?.settled ?? 0, earningsSummary?.currency ?? 'UGX')}
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                            <Grid item xs={6} sm={3}>
                                                <Card variant="outlined">
                                                    <CardContent>
                                                        <Typography variant="caption" color="text.secondary">Payments</Typography>
                                                        <Typography variant="h6" fontWeight={800}>{earningsSummary?.count ?? earnings.length}</Typography>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        </Grid>

                                        <Box>
                                            <Typography variant="h6" sx={{ mb: 1 }}>Earnings</Typography>
                                            {earnings.length === 0 ? (
                                                <Typography color="text.secondary">No earnings recorded yet.</Typography>
                                            ) : (
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell>Order</TableCell>
                                                            <TableCell align="right">Amount</TableCell>
                                                            <TableCell>Status</TableCell>
                                                            <TableCell>Date</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {earnings.map((entry) => (
                                                            <TableRow key={entry.id}>
                                                                <TableCell>
                                                                    <Typography variant="body2" fontWeight={600}>#{entry.orderId}</Typography>
                                                                    {entry.bonus || entry.tip ? (
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {entry.bonus ? `bonus ${formatMoney(entry.bonus, entry.currency)}` : ''}
                                                                            {entry.bonus && entry.tip ? ' · ' : ''}
                                                                            {entry.tip ? `tip ${formatMoney(entry.tip, entry.currency)}` : ''}
                                                                        </Typography>
                                                                    ) : null}
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    <Typography variant="body2" fontWeight={700}>{formatMoney(entry.amount, entry.currency)}</Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Chip
                                                                        size="small"
                                                                        label={entry.status}
                                                                        color={entry.status === 'SETTLED' ? 'success' : entry.status === 'PENDING' ? 'warning' : 'default'}
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant="body2" color="text.secondary">{formatDate(entry.settledAt ?? entry.createdAt)}</Typography>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            )}
                                        </Box>

                                        <Box>
                                            <Typography variant="h6" sx={{ mb: 1 }}>Ledger statement</Typography>
                                            {!statement || statement.entries.length === 0 ? (
                                                <Typography color="text.secondary">No ledger entries recorded yet.</Typography>
                                            ) : (
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell>Account</TableCell>
                                                            <TableCell>Order</TableCell>
                                                            <TableCell align="right">Debit</TableCell>
                                                            <TableCell align="right">Credit</TableCell>
                                                            <TableCell align="right">Gross</TableCell>
                                                            <TableCell>Date</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {statement.entries.map((entry) => (
                                                            <TableRow key={entry.id}>
                                                                <TableCell>
                                                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 11 }}>{entry.accountCode}</Typography>
                                                                    {entry.description ? <Typography variant="caption" color="text.secondary">{entry.description}</Typography> : null}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant="body2">{entry.orderId ? `#${entry.orderId}` : '—'}</Typography>
                                                                </TableCell>
                                                                <TableCell align="right">{formatMoney(entry.debit, entry.currency)}</TableCell>
                                                                <TableCell align="right" sx={{ color: 'success.main', fontWeight: 700 }}>{formatMoney(entry.credit, entry.currency)}</TableCell>
                                                                <TableCell align="right">{formatMoney(entry.grossAmount, entry.currency)}</TableCell>
                                                                <TableCell>
                                                                    <Typography variant="body2" color="text.secondary">{formatDate(entry.createdAt)}</Typography>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            )}
                                        </Box>
                                    </Box>
                                )}
                            </CustomTabPanel>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    )
}
