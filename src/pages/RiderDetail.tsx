import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Grid, Card, CardContent, Typography, Avatar, Divider, Button, Tab, Tabs } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import StatusBadge from '../components/StatusBadge'
import ReviewActionPanel, { ReviewStatus } from '../components/ReviewActionPanel'

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

export default function RiderDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [tabValue, setTabValue] = useState(0)
    const [status, setStatus] = useState<string>('pending')

    const handleStatusUpdate = (newStatus: ReviewStatus) => {
        setStatus(newStatus)
        // Here you would trigger an API call to update the rider's status
    }

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
                                R{id?.slice(0, 2)}
                            </Avatar>
                            <Typography variant="h6" fontWeight={700} gutterBottom>
                                Rider #{id}
                            </Typography>
                            <StatusBadge status={status} sx={{ mb: 3 }} />

                            <Box sx={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <EmailIcon color="action" fontSize="small" />
                                    <Typography variant="body2">rider.{id}@example.com</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <PhoneIcon color="action" fontSize="small" />
                                    <Typography variant="body2">+250 788 123 456</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <LocationOnIcon color="action" fontSize="small" />
                                    <Typography variant="body2">Kigali, Rwanda</Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">Total Trips</Typography>
                                <Typography variant="body2" fontWeight={600}>42</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">Rating</Typography>
                                <Typography variant="body2" fontWeight={600}>4.8 ★</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">Join Date</Typography>
                                <Typography variant="body2" fontWeight={600}>Oct 12, 2025</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Column: Details & Actions */}
                <Grid item xs={12} md={8}>

                    <ReviewActionPanel status={status} onUpdateStatus={handleStatusUpdate} />

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
                                {/* Mock Trip List */}
                                {[1, 2, 3].map((trip) => (
                                    <Box key={trip} sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="subtitle2">Trip #{2000 + trip}</Typography>
                                            <StatusBadge status="completed" label="Completed" />
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', fontSize: 13 }}>
                                            <DirectionsCarIcon fontSize="small" />
                                            Standard Ride • $12.50 • 4.2 km
                                        </Box>
                                    </Box>
                                ))}
                            </CustomTabPanel>

                            <CustomTabPanel value={tabValue} index={1}>
                                <Typography color="text.secondary">No payment history available.</Typography>
                            </CustomTabPanel>

                            <CustomTabPanel value={tabValue} index={2}>
                                <Typography color="text.secondary">No documents uploaded.</Typography>
                            </CustomTabPanel>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    )
}
