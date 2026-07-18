import React, { useEffect, useMemo, useState } from 'react'
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
    TextField,
    CircularProgress,
    Alert,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EmailIcon from '@mui/icons-material/Email'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import StarIcon from '@mui/icons-material/Star'
import SendIcon from '@mui/icons-material/Send'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import StatusBadge from '../components/StatusBadge'
import { getAdminUser, type AdminUserResponse } from '../services/api/adminApi'

const EV_GREEN = "#03cd8c";

export default function AgentDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [agent, setAgent] = useState<AdminUserResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [chatOpen, setChatOpen] = React.useState(false);
    const [chatMessage, setChatMessage] = React.useState('');
    const [messages, setMessages] = React.useState<{ sender: string, text: string }[]>([
        { sender: 'System', text: 'Chat session started.' }
    ]);

    useEffect(() => {
        if (!id) return;
        let active = true;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const user = await getAdminUser(id);
                if (!active) return;
                setAgent(user);
            } catch (err) {
                if (!active) return;
                setError((err as Error)?.message || "Failed to load agent details");
            } finally {
                if (active) setLoading(false);
            }
        };
        void load();
        return () => { active = false; };
    }, [id]);

    const avatarColor = useMemo(() => {
        const colors = [EV_GREEN, "#f77f00", "#3b82f6", "#ef4444"];
        if (!agent?.id) return colors[0];
        return colors[agent.id.charCodeAt(0) % colors.length];
    }, [agent?.id]);

    const handleSendChat = () => {
        if (!chatMessage.trim() || !agent) return;
        setMessages([...messages, { sender: 'You', text: chatMessage }]);
        setChatMessage('');
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !agent) {
        return (
            <Box>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/agents')} sx={{ color: 'text.secondary', textTransform: 'none' }}>
                    Back to Agents
                </Button>
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error || "Agent not found"}
                </Alert>
            </Box>
        );
    }

    const lastLogin = agent.lastLogin ? new Date(agent.lastLogin).toLocaleString() : "—";
    const team = agent.roles?.[0] || "Admin";
    const roles = agent.roles?.join(", ") || "—";

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
                                    bgcolor: avatarColor,
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
                                {roles} • {team} Team
                            </Typography>
                            <Box sx={{ mt: 1, mb: 3 }}>
                                <StatusBadge status={agent.status.toLowerCase()} />
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                    <VerifiedUserIcon color="primary" fontSize="small" />
                                    <Box>
                                        <Typography variant="body2" fontWeight={600}>Identity</Typography>
                                        <Typography variant="caption" color="text.secondary">Backend user</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                    <EmailIcon color="action" fontSize="small" />
                                    <Typography variant="body2">{agent.email}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                    <AccessTimeIcon color="action" fontSize="small" />
                                    <Box>
                                        <Typography variant="body2">Last Login</Typography>
                                        <Typography variant="caption" color="text.secondary">{lastLogin}</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
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
                                        <Typography variant="h5" fontWeight={700}>N/A</Typography>
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
                                        <Typography variant="h5" fontWeight={700}>N/A</Typography>
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
                                        <Typography variant="h5" fontWeight={700}>N/A</Typography>
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
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Activity logs are not exposed by the backend yet.
                            </Alert>
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
                                        <TableRow>
                                            <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                                No activity records available.
                                            </TableCell>
                                        </TableRow>
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
                                    variant="contained"
                                    startIcon={<SendIcon />}
                                    onClick={() => setChatOpen(true)}
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
                    <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: 'action.hover' }}>
                        {messages.map((msg, idx) => (
                            <Box key={idx} sx={{
                                display: 'flex',
                                justifyContent: msg.sender === 'You' ? 'flex-end' : 'flex-start',
                                mb: 1
                            }}>
                                <Box sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: msg.sender === 'You' ? '#03cd8c' : 'background.paper',
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
