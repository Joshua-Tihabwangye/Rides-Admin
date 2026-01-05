import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Grid, Card, CardContent, Typography, Avatar, Divider, Button, Tab, Tabs, Chip, IconButton } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import StatusBadge from '../components/StatusBadge'
import ReviewActionPanel, { ReviewStatus } from '../components/ReviewActionPanel'
import { getDriver, upsertDriver, DriverRecord, PrimaryStatus, ActivityStatus } from '../lib/peopleStore'

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

export default function DriverDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [tabValue, setTabValue] = useState(0)
    const [driver, setDriver] = useState<DriverRecord | undefined>(undefined)
    const [licenseFile, setLicenseFile] = useState<File | null>(null)
    const [insuranceFile, setInsuranceFile] = useState<File | null>(null)

    const numericId = id ? parseInt(id, 10) : NaN

    useEffect(() => {
        if (!Number.isNaN(numericId)) {
            const found = getDriver(numericId)
            setDriver(found)
        }
    }, [numericId])

    const handleStatusUpdate = (newStatus: ReviewStatus) => {
        if (!driver) return

        const mapped: PrimaryStatus =
            newStatus === 'approved'
                ? 'approved'
                : newStatus === 'rejected'
                    ? 'suspended'
                    : 'under_review' // Default to under_review or keep mapping simple

        const updated = { ...driver, primaryStatus: mapped }
        setDriver(updated)
        upsertDriver(updated)
    }

    const toggleActivity = () => {
        if (!driver) return
        const next: ActivityStatus = driver.activityStatus === 'active' ? 'inactive' : 'active'
        const updated = { ...driver, activityStatus: next }
        setDriver(updated)
        upsertDriver(updated)
    }

    const handleFileUpload = (type: 'license' | 'insurance') => (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            if (type === 'license') setLicenseFile(event.target.files[0])
            else setInsuranceFile(event.target.files[0])
        }
    }

    if (!driver) {
        return <Box p={3}>Driver not found</Box>
    }

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
                                {driver.name}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
                                <StatusBadge status={driver.primaryStatus} />
                                <StatusBadge status={driver.activityStatus === 'active' ? 'active' : 'inactive'} />
                            </Box>

                            <Box sx={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <VerifiedUserIcon color="primary" fontSize="small" />
                                    <Typography variant="body2" fontWeight={600}>Identity Verified</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <EmailIcon color="action" fontSize="small" />
                                    <Typography variant="body2">driver.{driver.id}@evzone.app</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <PhoneIcon color="action" fontSize="small" />
                                    <Typography variant="body2">{driver.phone}</Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">Vehicle</Typography>
                                <Typography variant="body2" fontWeight={600}>{driver.vehicle.split('.')[0] || 'Unknown'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">Plate</Typography>
                                <Typography variant="body2" fontWeight={600}>{driver.vehicle.split('·')[1]?.trim() || 'N/A'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">Total Trips</Typography>
                                <Typography variant="body2" fontWeight={600}>{driver.trips}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Column: Review & Content */}
                <Grid item xs={12} md={8}>

                    <ReviewActionPanel status={driver.primaryStatus} onUpdateStatus={handleStatusUpdate} />

                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={toggleActivity}
                            sx={{ textTransform: 'none', borderRadius: 999 }}
                        >
                            Set as {driver.activityStatus === 'active' ? 'In-active' : 'Active'}
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
                                    <Typography variant="body2">{licenseFile ? licenseFile.name : 'No file chosen'}</Typography>
                                    <Button component="label" variant="text" startIcon={<UploadFileIcon />}>
                                        Upload
                                        <input type="file" hidden onChange={handleFileUpload('license')} />
                                    </Button>
                                </Box>

                                <Typography variant="subtitle2" gutterBottom>Insurance</Typography>
                                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px dashed grey', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2">{insuranceFile ? insuranceFile.name : 'No file chosen'}</Typography>
                                    <Button component="label" variant="text" startIcon={<UploadFileIcon />}>
                                        Upload
                                        <input type="file" hidden onChange={handleFileUpload('insurance')} />
                                    </Button>
                                </Box>
                            </CustomTabPanel>

                            <CustomTabPanel value={tabValue} index={1}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Typography variant="h6">{driver.vehicle}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Vehicle status is compliant. Last inspection was 2 weeks ago.
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">Make/Model</Typography>
                                            <Typography variant="body2">Toyota RAV4 EV</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">Year</Typography>
                                            <Typography variant="body2">2023</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">Color</Typography>
                                            <Typography variant="body2">Silver</Typography>
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
                                {driver.trips === 0 && <Typography color="text.secondary">No trips completed yet.</Typography>}
                            </CustomTabPanel>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    )
}
