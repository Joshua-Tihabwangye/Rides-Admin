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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TableContainer,
    Paper,
    CircularProgress,
    Alert,
    TextField,
    Chip,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EmailIcon from '@mui/icons-material/Email'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import StarIcon from '@mui/icons-material/Star'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import StatusBadge from '../components/StatusBadge'
import {
    getAdminAgent,
    getAdminAgentChat,
    patchAdminUser,
    sendAdminAgentChat,
    type AdminAgentChatMessage,
    type AdminAgentResponse,
} from '../services/api/adminApi'

const EV_GREEN = "#03cd8c";

export default function AgentDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [agent, setAgent] = useState<AdminAgentResponse | null>(null)
    const [messages, setMessages] = useState<AdminAgentChatMessage[]>([])
    const [messageBody, setMessageBody] = useState("")
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [sending, setSending] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [notice, setNotice] = useState<string | null>(null)

    useEffect(() => {
        if (!id) return;
        let active = true;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const [user, chat] = await Promise.all([
                    getAdminAgent(id),
                    getAdminAgentChat(id),
                ]);
                if (!active) return;
                setAgent(user);
                setMessages(chat.messages);
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

    const handleStatusChange = async (status: 'active' | 'suspended') => {
        if (!agent) return;
        setSaving(true);
        setError(null);
        setNotice(null);
        try {
            const updated = await patchAdminUser(agent.id, { status });
            const refreshed = await getAdminAgent(agent.id);
            setAgent(refreshed);
            setNotice(status === 'active' ? 'Agent account reactivated.' : 'Agent account suspended.');
        } catch (err) {
            setError((err as Error)?.message || "Failed to update agent status");
        } finally {
            setSaving(false);
        }
    };

    const handleSendMessage = async () => {
        if (!agent || !messageBody.trim()) return;
        setSending(true);
        setError(null);
        try {
            const message = await sendAdminAgentChat(agent.id, messageBody.trim());
            setMessages((current) => [...current, message]);
            setMessageBody("");
        } catch (err) {
            setError((err as Error)?.message || "Failed to send message");
        } finally {
            setSending(false);
        }
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
    const team = agent.team || agent.profile?.department || agent.roles?.[0] || "Agent";
    const roles = agent.roles?.join(", ") || "—";
    const isSuspended = agent.status === 'Suspended';
    const averageResolution = agent.metrics.averageResolutionMinutes == null
        ? "—"
        : `${agent.metrics.averageResolutionMinutes}m`;
    const qaScore = agent.metrics.qaScore == null ? "—" : agent.metrics.qaScore.toFixed(1);

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
            {notice ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {notice}
                </Alert>
            ) : null}
            {error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            ) : null}

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
                                        <Typography variant="caption" color="text.secondary">
                                            {agent.profile?.employeeCode || 'Backend user'}
                                        </Typography>
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
                                {agent.profile ? (
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        <Chip size="small" label={agent.profile.portalRole} />
                                        <Chip size="small" label={agent.profile.availabilityStatus} color="success" variant="outlined" />
                                    </Box>
                                ) : null}
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
                                        <Typography variant="h5" fontWeight={700}>{agent.metrics.resolvedTickets}</Typography>
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
                                        <Typography variant="h5" fontWeight={700}>{averageResolution}</Typography>
                                        <Typography variant="caption" color="text.secondary">Avg Resolution</Typography>
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
                                        <Typography variant="h5" fontWeight={700}>{qaScore}</Typography>
                                        <Typography variant="caption" color="text.secondary">QA Score</Typography>
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
                                        {(agent.activity ?? []).map((activity) => (
                                            <TableRow key={activity.id}>
                                                <TableCell>{activity.action}</TableCell>
                                                <TableCell>{new Date(activity.occurredAt).toLocaleString()}</TableCell>
                                                <TableCell>{activity.detail || '—'}</TableCell>
                                            </TableRow>
                                        ))}
                                        {(agent.activity ?? []).length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                                    No activity records available.
                                                </TableCell>
                                            </TableRow>
                                        ) : null}
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
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mb: 2, maxHeight: 260, overflowY: 'auto' }}>
                                {messages.map((message) => (
                                    <Box
                                        key={message.id}
                                        sx={{
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 2,
                                            p: 1.25,
                                            bgcolor: message.senderUserId === agent.id ? 'background.default' : 'rgba(3,205,140,0.08)',
                                        }}
                                    >
                                        <Typography variant="body2">{message.body}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(message.createdAt).toLocaleString()}
                                        </Typography>
                                    </Box>
                                ))}
                                {messages.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary">
                                        No direct messages yet.
                                    </Typography>
                                ) : null}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <TextField
                                    size="small"
                                    fullWidth
                                    multiline
                                    maxRows={4}
                                    placeholder="Write an internal agent message…"
                                    value={messageBody}
                                    onChange={(event) => setMessageBody(event.target.value)}
                                />
                                <Button
                                    variant="contained"
                                    disabled={sending || !messageBody.trim()}
                                    onClick={handleSendMessage}
                                    sx={{ textTransform: 'none', minWidth: 90 }}
                                >
                                    {sending ? 'Sending...' : 'Send'}
                                </Button>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <Button
                                    variant="outlined"
                                    color={isSuspended ? 'success' : 'warning'}
                                    disabled={saving}
                                    onClick={() => void handleStatusChange(isSuspended ? 'active' : 'suspended')}
                                    sx={{ borderRadius: 2, textTransform: 'none' }}
                                >
                                    {isSuspended ? 'Reactivate account' : 'Suspend account'}
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>

                </Grid>
            </Grid>
        </Box>
    )
}
