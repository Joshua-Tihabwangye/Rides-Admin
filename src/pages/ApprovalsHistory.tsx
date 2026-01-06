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

const HISTORY_DATA = [
    { id: "APP-001", entity: "GreenMove Fleet", action: "Approved", date: "2024-01-15 10:30", actor: "Admin User", type: "Company" },
    { id: "APP-004", entity: "Sunrise Logistics", action: "Rejected", date: "2024-01-14 14:20", actor: "Admin User", type: "Policy" },
];

export default function ApprovalsHistory() {
    const navigate = useNavigate();

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
                                {HISTORY_DATA.map((row) => (
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
