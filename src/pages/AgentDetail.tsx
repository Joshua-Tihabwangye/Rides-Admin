
import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Grid, Card, CardContent, Typography, Avatar, Divider, Button, Chip } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import ChatIcon from '@mui/icons-material/Chat'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import StatusBadge from '../components/StatusBadge'

// Dummy data map with explicit typing
interface Agent {
    name: string;
    email: string;
    team: string;
    role: string;
    status: string;
}

const AGENT_DATA: Record<number, Agent> = {
    1: { name: "Alice Support", email: "alice.support@evzone.com", team: "Support", role: "Support Agent", status: "Active" },
    2: { name: "Brian Onboard", email: "brian.onboard@evzone.com", team: "Onboarding", role: "Onboarding Agent", status: "Active" },
    3: { name: "Carol Dispatch", email: "carol.dispatch@evzone.com", team: "Dispatch", role: "Dispatch Agent", status: "Away" },
    4: { name: "David Safety", email: "david.safety@evzone.com", team: "Safety", role: "Safety Agent", status: "Suspended" },
}

export default function AgentDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    // safe parsing of ID
    const agentId = id ? parseInt(id, 10) : 1
    const agent = AGENT_DATA[agentId] || AGENT_DATA[1] // Fallback to 1 if not found

    const handleCommunication = (method: string) => {
        console.log(`Initiating ${method} with agent ${agent.name}`)
    }

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/admin/agents')}
                    sx={{ color: 'text.secondary', textTransform: 'none' }}
                >
                    Back to Agents
                </Button>
            </Box>

            <Grid container spacing={3}>
                {/* Left Column: Agent Info */}
                <Grid item xs={12} md={4}>
                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ textAlign: 'center', pt: 4 }}>
                            <Avatar
                                sx={{ width: 100, height: 100, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: 32 }}
                            >
                                {agent.name.charAt(0)}
                            </Avatar>
                            <Typography variant="h6" fontWeight={700} gutterBottom>
                                {agent.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {agent.role}
                            </Typography>
                            <StatusBadge status={agent.status} sx={{ mb: 3 }} />

                            <Box sx={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <VerifiedUserIcon color="primary" fontSize="small" />
                                    <Typography variant="body2" fontWeight={600}>Identity Verified</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <EmailIcon color="action" fontSize="small" />
                                    <Typography variant="body2">{agent.email}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <PhoneIcon color="action" fontSize="small" />
                                    <Typography variant="body2">+250 788 000 000</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Column: Actions & Details */}
                <Grid item xs={12} md={8}>
                    <Card elevation={2} sx={{ borderRadius: 2, mb: 3 }}>
                        <CardContent>
                            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                Communication Options
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <Button
                                    variant="outlined"
                                    color="success"
                                    startIcon={<WhatsAppIcon />}
                                    onClick={() => handleCommunication('WhatsApp')}
                                >
                                    WhatsApp
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="info" // WeChat color approximation or just blue
                                    startIcon={<ChatIcon />} // Placeholder for WeChat
                                    onClick={() => handleCommunication('WeChat')}
                                >
                                    WeChat
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<ChatIcon />}
                                    onClick={() => handleCommunication('In-System Chat')}
                                    sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
                                >
                                    Internal Chat
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>

                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                Performance & Activity
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="body2" color="text.secondary">
                                Recent activity logs and performance metrics will be displayed here.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    )
}
