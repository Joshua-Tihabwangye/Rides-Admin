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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Removed static HISTORY_DATA
// using localStorage 'approval_history'

export default function ApprovalsHistory() {
    const navigate = useNavigate();
    const [history, setHistory] = React.useState([]);

    React.useEffect(() => {
        const stored = localStorage.getItem('approval_history');
        if (stored) {
            setHistory(JSON.parse(stored));
        }
    }, []);

    return (
        <Box className="p-6">
            <Box className="flex items-center gap-2 mb-4">
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
                                {history.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" className="text-slate-500 py-8">
                                            No approval history found.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {history.map((row) => (
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
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        </Box>
    );
}
