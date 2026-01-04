import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Grid, Card, CardContent, Typography, Avatar, Divider, Button, Tab, Tabs, Chip } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
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
    const [status, setStatus] = useState<string>('under_review')

    const handleStatusUpdate = (newStatus: ReviewStatus) => {
        setStatus(newStatus)
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
                                D{id?.slice(0, 2)}
                            </Avatar>
                            <Typography variant="h6" fontWeight={700} gutterBottom>
                                Driver #{id}
                            </Typography>
                            <StatusBadge status={status} sx={{ mb: 3 }} />

                            <Box sx={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <VerifiedUserIcon color="primary" fontSize="small" />
                                    <Typography variant="body2" fontWeight={600}>Identity Verified</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <EmailIcon color="action" fontSize="small" />
                                    <Typography variant="body2">driver.{id}@evzone.app</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <PhoneIcon color="action" fontSize="small" />
                                    <Typography variant="body2">+250 788 999 000</Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">Vehicle</Typography>
                                <Typography variant="body2" fontWeight={600}>Toyota RAV4 EV</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">Plate</Typography>
                                <Typography variant="body2" fontWeight={600}>RAB 123 D</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">Service</Typography>
                                <Chip label="Rides" size="small" sx={{ height: 20, fontSize: 10 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Column: Review & Content */}
                <Grid item xs={12} md={8}>

                    <ReviewActionPanel status={status} onUpdateStatus={handleStatusUpdate} />

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
                                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, mb: 2, border: '1px dashed grey' }}>
                                    Preview of License.pdf
                                </Box>

                                <Typography variant="subtitle2" gutterBottom>Insurance</Typography>
                                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px dashed grey' }}>
                                    Preview of Insurance.pdf
                                </Box>
                            </CustomTabPanel>

                            <CustomTabPanel value={tabValue} index={1}>
                                <Typography color="text.secondary">Vehicle details and photos would appear here.</Typography>
                            </CustomTabPanel>

                            <CustomTabPanel value={tabValue} index={2}>
                                <Typography color="text.secondary">No trips completed yet.</Typography>
                            </CustomTabPanel>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    )
}
