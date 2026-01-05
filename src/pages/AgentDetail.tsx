import React, { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Avatar,
    Divider,
    Button,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TableContainer,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import ChatIcon from '@mui/icons-material/Chat'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import StarIcon from '@mui/icons-material/Star'
import SendIcon from '@mui/icons-material/Send'
import StatusBadge from '../components/StatusBadge'

// Consistent with AgentManagement data
const AGENTS_DATA = [
    {
        id: 1,
        name: "Alice Support",
        email: "alice.support@evzone.com",
        phone: "+250 788 111 222",
        team: "Support",
        roles: "Support Agent",
        status: "active",
        lastLogin: "2025-11-20 09:24",
        avatarColor: "#03cd8c",
        kpa: {
            ticketsResolved: 142,
            avgResponseTime: "4m 30s",
            csatScore: 4.8
        }
    },
    {
        id: 2,
        name: "Brian Onboard",
        email: "brian.onboard@evzone.com",
        phone: "+250 788 333 444",
        team: "Onboarding",
        roles: "Onboarding Agent",
        status: "active",
        lastLogin: "2025-11-25 08:02",
        avatarColor: "#f77f00",
        kpa: {
            ticketsResolved: 89,
            avgResponseTime: "12m 10s",
            csatScore: 4.5
        }
    },
    {
        id: 3,
        name: "Carol Dispatch",
        email: "carol.dispatch@evzone.com",
        phone: "+250 788 555 666",
        team: "Dispatch",
        roles: "Dispatch Agent",
        status: "away",
        lastLogin: "2025-11-24 22:41",
        avatarColor: "#3b82f6",
        kpa: {
            ticketsResolved: 310,
            avgResponseTime: "1m 45s",
            csatScore: 4.9
        }
    },
    {
        id: 4,
        name: "David Safety",
        email: "david.safety@evzone.com",
        phone: "+250 788 777 888",
        team: "Safety",
        roles: "Safety Agent",
        status: "suspended",
        lastLogin: "2025-11-22 16:10",
        avatarColor: "#ef4444",
        kpa: {
            ticketsResolved: 45,
            avgResponseTime: "8m 00s",
            csatScore: 3.2
        }
    },
]

const ACTIVITY_LOG = [
    { id: 1, action: "Logged in", time: "2025-11-25 09:00", details: "IP: 192.168.1.1" },
    { id: 2, action: "Resolved Ticket #1023", time: "2025-11-25 09:15", details: "Refund processed" },
    { id: 3, action: "Updated Rider Profile", time: "2025-11-25 10:30", details: "Updated ID doc" },
    { id: 4, action: "Initiated Call", time: "2025-11-25 11:05", details: "Outbound to Driver #442" },
]

export default function AgentDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [chatOpen, setChatOpen] = React.useState(false);
    const [chatMessage, setChatMessage] = React.useState('');
    const [messages, setMessages] = React.useState<{ sender: string, text: string }[]>([
        { sender: 'System', text: 'Chat session started.' }
    ]);

    const agentId = id ? parseInt(id, 10) : 1
    const agent = useMemo(() => AGENTS_DATA.find(a => a.id === agentId) || AGENTS_DATA[0], [agentId])

    const handleCommunication = (method: string) => {
        if (method === 'WhatsApp') {
            window.open(`https://wa.me/?text=Hello ${agent.name}`, '_blank');
        } else if (method === 'WeChat') {
            // Mock WeChat link
            alert(`Opening WeChat for ${agent.name}...`);
        } else if (method === 'In-System Chat') {
            setChatOpen(true);
        }
    }

    const handleSendChat = () => {
        if (!chatMessage.trim()) return;
        setMessages([...messages, { sender: 'You', text: chatMessage }]);
        setChatMessage('');
        // Simulate reply
        setTimeout(() => {
            setMessages(prev => [...prev, { sender: agent.name.split(' ')[0], text: 'Thanks for the message. I am looking into it.' }]);
        }, 1000);
    };

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
                {/* Left Column: Agent Profile */}
                <Grid item xs={12} md={4}>
                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ textAlign: 'center', pt: 4 }}>
                            <Avatar
                                sx={{
                                    width: 100,
                                    height: 100,
                                    mx: 'auto',
                                    mb: 2,
                                    bgcolor: agent.avatarColor,
                                    fontSize: 32,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                            >
                                {agent.name.charAt(0)}
                            </Avatar>
                            <Typography variant="h6" fontWeight={700} gutterBottom>
                                {agent.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {agent.roles} • {agent.team} Team
                            </Typography>
                            <Box sx={{ mt: 1, mb: 3 }}>
                                <StatusBadge status={agent.status} />
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                    <VerifiedUserIcon color="primary" fontSize="small" />
                                    <Box>
                                        <Typography variant="body2" fontWeight={600}>Identity Verified</Typography>
                                        <Typography variant="caption" color="text.secondary">KYC Complete</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                    <EmailIcon color="action" fontSize="small" />
                                    <Typography variant="body2">{agent.email}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                    <PhoneIcon color="action" fontSize="small" />
                                    <Typography variant="body2">{agent.phone}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                    <AccessTimeIcon color="action" fontSize="small" />
                                    <Box>
                                        <Typography variant="body2">Last Login</Typography>
                                        <Typography variant="caption" color="text.secondary">{agent.lastLogin}</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Quick Actions Removed */}
                </Grid>

                {/* Right Column: Performance & Data */}
                <Grid item xs={12} md={8}>

                    {/* Key Metrics */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={4}>
                            <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, '&:last-child': { pb: 2 } }}>
                                    <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main' }}>
                                        <AssignmentTurnedInIcon />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h5" fontWeight={700}>{agent.kpa.ticketsResolved}</Typography>
                                        <Typography variant="caption" color="text.secondary">Tickets Resolved</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, '&:last-child': { pb: 2 } }}>
                                    <Avatar sx={{ bgcolor: 'info.light', color: 'info.main' }}>
                                        <AccessTimeIcon />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h5" fontWeight={700}>{agent.kpa.avgResponseTime}</Typography>
                                        <Typography variant="caption" color="text.secondary">Avg Response Time</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, '&:last-child': { pb: 2 } }}>
                                    <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main' }}>
                                        <StarIcon />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h5" fontWeight={700}>{agent.kpa.csatScore}</Typography>
                                        <Typography variant="caption" color="text.secondary">CSAT Score</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Activity Log */}
                    <Card elevation={2} sx={{ borderRadius: 2, mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                                Recent Activity
                            </Typography>
                            <TableContainer component={Paper} elevation={0} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'background.default' }}>
                                            <TableCell>Action</TableCell>
                                            <TableCell>Date & Time</TableCell>
                                            <TableCell>Details</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {ACTIVITY_LOG.map((row) => (
                                            <TableRow key={row.id} hover>
                                                <TableCell sx={{ fontWeight: 500 }}>{row.action}</TableCell>
                                                <TableCell>{row.time}</TableCell>
                                                <TableCell sx={{ color: 'text.secondary' }}>{row.details}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>

                    {/* Communication */}
                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={700} gutterBottom>
                                Communication
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Reach out to {agent.name.split(' ')[0]} directly via integrated channels.
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <Button
                                    variant="outlined"
                                    color="success"
                                    startIcon={<WhatsAppIcon />}
                                    onClick={() => handleCommunication('WhatsApp')}
                                    sx={{ borderRadius: 2, textTransform: 'none' }}
                                >
                                    WhatsApp
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="info"
                                    startIcon={<ChatIcon />}
                                    onClick={() => handleCommunication('WeChat')}
                                    sx={{ borderRadius: 2, textTransform: 'none' }}
                                >
                                    WeChat
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<ChatIcon />}
                                    onClick={() => handleCommunication('In-System Chat')}
                                    sx={{ bgcolor: '#03cd8c', '&:hover': { bgcolor: '#02a16e' }, borderRadius: 2, textTransform: 'none', color: '#fff' }}
                                >
                                    Internal Chat
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>

                </Grid>
            </Grid>

            {/* Chat Dialog */}
            <Dialog open={chatOpen} onClose={() => setChatOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    Chat with {agent.name}
                </DialogTitle>
                <DialogContent sx={{ height: 400, display: 'flex', flexDirection: 'column', p: 0 }}>
                    <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#f1f5f9' }}>
                        {messages.map((msg, idx) => (
                            <Box key={idx} sx={{
                                display: 'flex',
                                justifyContent: msg.sender === 'You' ? 'flex-end' : 'flex-start',
                                mb: 1
                            }}>
                                <Box sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: msg.sender === 'You' ? '#03cd8c' : 'white',
                                    color: msg.sender === 'You' ? 'white' : 'text.primary',
                                    boxShadow: 1,
                                    maxWidth: '70%'
                                }}>
                                    <Typography variant="caption" display="block" sx={{ mb: 0.5, opacity: 0.8 }}>
                                        {msg.sender}
                                    </Typography>
                                    <Typography variant="body2">{msg.text}</Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                    <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Type a message..."
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                        />
                        <Button variant="contained" onClick={handleSendChat} sx={{ bgcolor: '#03cd8c' }}>
                            <SendIcon />
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    )
}
