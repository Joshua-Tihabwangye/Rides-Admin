// @ts-nocheck
import React from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    Button,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
    Paper,
    Snackbar,
    Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

// Data only comes from localStorage 'approval_history' - starts empty until approvals are processed

export default function ApprovalsHistory() {
    const navigate = useNavigate();
    const [history, setHistory] = React.useState([]);
    const [snackbar, setSnackbar] = React.useState({ open: false, message: '' });

    React.useEffect(() => {
        const stored = localStorage.getItem('approval_history');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setHistory(Array.isArray(parsed) ? parsed : []);
            } catch {
                setHistory([]);
            }
        } else {
            setHistory([]);
        }
    }, []);

    const handleClearAll = () => {
        localStorage.removeItem('approval_history');
        setHistory([]);
        setSnackbar({ open: true, message: 'Approval history cleared successfully' });
    };

    return (
        <Box className="p-6">
            <Box className="flex items-center justify-between mb-4">
                <Box className="flex items-center gap-2">
                    <Button
                        size="small"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/admin/approvals')}
                        sx={{ color: 'text.secondary', textTransform: 'none' }}
                    >
                        Back to Queue
                    </Button>
                    <Typography variant="h6" className="font-semibold text-slate-900">
                        Approval History
                    </Typography>
                </Box>
                {history.length > 0 && (
                    <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<DeleteSweepIcon />}
                        onClick={handleClearAll}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                        Clear All
                    </Button>
                )}
            </Box>

            <Card elevation={1} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)" }}>
                <CardContent className="p-0">
                    <TableContainer component={Paper} elevation={0}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Entity</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Action</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Actor</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {history.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                                            No approval history yet. Approvals will appear here once processed.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    history.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="font-mono text-xs">{row.id}</TableCell>
                                            <TableCell className="font-medium">{row.entity}</TableCell>
                                            <TableCell>{row.type}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={row.action}
                                                    size="small"
                                                    color={row.action === 'Approved' ? 'success' : 'error'}
                                                    variant="outlined"
                                                    sx={{ height: 24, borderRadius: 1 }}
                                                />
                                            </TableCell>
                                            <TableCell className="text-slate-500 text-sm">{row.date}</TableCell>
                                            <TableCell className="text-slate-500 text-sm">{row.actor}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
                <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
