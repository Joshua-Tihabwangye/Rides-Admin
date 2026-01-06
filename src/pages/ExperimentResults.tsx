// @ts-nocheck
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    Chip,
    Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GroupIcon from "@mui/icons-material/Group";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
} from "recharts";

// Mock data for the experiment
const EXPERIMENT_DATA = {
    id: 1,
    name: "Delivery Price Experiment",
    key: "delivery.pricing.ab",
    status: "Running",
    startDate: "2025-11-01",
    duration: "25 days",
    variants: [
        { name: "Control (A)", users: 12500, conversion: 12.5, revenue: 45000 },
        { name: "Variant (B)", users: 12450, conversion: 14.2, revenue: 52000 },
    ],
    dailyData: [
        { day: "Day 1", A: 12.0, B: 12.1 },
        { day: "Day 5", A: 12.2, B: 12.8 },
        { day: "Day 10", A: 12.3, B: 13.5 },
        { day: "Day 15", A: 12.1, B: 13.9 },
        { day: "Day 20", A: 12.5, B: 14.1 },
        { day: "Day 25", A: 12.5, B: 14.2 },
    ],
};

const EV_COLORS = {
    primary: "#03cd8c",
    secondary: "#f77f00",
    blue: "#3b82f6",
    red: "#ef4444",
};

export default function ExperimentResults() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [mode, setMode] = useState("light"); // Local simulated mode state or could consume context

    // In a real app, we'd fetch the experiment by ID
    const experiment = EXPERIMENT_DATA;

    return (
        <Box className="p-4 sm:p-6 flex flex-col gap-6">
            {/* Header */}
            <Box className="flex items-center gap-4">
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate("/admin/system/flags")}
                    sx={{ textTransform: "none", color: "text.secondary" }}
                >
                    Back to Flags
                </Button>
                <Box>
                    <Typography variant="h5" className="font-bold text-slate-900">
                        Experiment Results
                    </Typography>
                    <Typography variant="body2" className="text-slate-500">
                        {experiment.name} ({experiment.key})
                    </Typography>
                </Box>
                <Chip
                    label={experiment.status}
                    size="small"
                    sx={{
                        ml: "auto",
                        bgcolor: "#ecfdf5",
                        color: "#059669",
                        fontWeight: 600,
                    }}
                />
            </Box>

            {/* Overview Stats */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Card elevation={1} sx={{ borderRadius: 4 }}>
                        <CardContent className="flex items-center gap-4">
                            <Box className="p-3 bg-blue-50 rounded-full text-blue-600">
                                <GroupIcon />
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Total Participants
                                </Typography>
                                <Typography variant="h5" fontWeight={700}>
                                    {(
                                        experiment.variants.reduce((acc, v) => acc + v.users, 0)
                                    ).toLocaleString()}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card elevation={1} sx={{ borderRadius: 4 }}>
                        <CardContent className="flex items-center gap-4">
                            <Box className="p-3 bg-green-50 rounded-full text-green-600">
                                <TrendingUpIcon />
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Uplift (Conversion)
                                </Typography>
                                <Typography variant="h5" fontWeight={700} color="success.main">
                                    +13.6%
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card elevation={1} sx={{ borderRadius: 4 }}>
                        <CardContent className="flex items-center gap-4">
                            <Box className="p-3 bg-orange-50 rounded-full text-orange-600">
                                <AccessTimeIcon />
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Duration
                                </Typography>
                                <Typography variant="h5" fontWeight={700}>
                                    {experiment.duration}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Main Charts area */}
            <Grid container spacing={3}>
                {/* Left: Variant Comparison */}
                <Grid item xs={12} lg={6}>
                    <Card elevation={1} sx={{ borderRadius: 4, height: "100%" }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Variant Performance
                            </Typography>
                            <Divider sx={{ mb: 3 }} />

                            <Box sx={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={experiment.variants}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip
                                            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="conversion" name="Conversion Rate (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        {/* Scale revenue for display alongside % if needed, or just show conversion */}
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>

                            <Box className="mt-4 grid grid-cols-2 gap-4">
                                {experiment.variants.map((v) => (
                                    <Box key={v.name} className="p-3 bg-slate-50 rounded-lg">
                                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                            {v.name}
                                        </Typography>
                                        <Box className="flex justify-between text-sm">
                                            <span className="text-slate-500">Users</span>
                                            <span>{v.users.toLocaleString()}</span>
                                        </Box>
                                        <Box className="flex justify-between text-sm">
                                            <span className="text-slate-500">Revenue</span>
                                            <span>${v.revenue.toLocaleString()}</span>
                                        </Box>
                                        <Box className="flex justify-between text-sm font-semibold mt-1">
                                            <span className="text-slate-500">Conv. Rate</span>
                                            <span className={v.name.includes("Variant") ? "text-green-600" : ""}>
                                                {v.conversion}%
                                            </span>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right: Trend Over Time */}
                <Grid item xs={12} lg={6}>
                    <Card elevation={1} sx={{ borderRadius: 4, height: "100%" }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Conversion Trend (Daily)
                            </Typography>
                            <Divider sx={{ mb: 3 }} />

                            <Box sx={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={experiment.dailyData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="day" />
                                        <YAxis domain={[11, 15]} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="A" name="Control (A)" stroke="#94a3b8" strokeWidth={2} dot={{ r: 4 }} />
                                        <Line type="monotone" dataKey="B" name="Variant (B)" stroke="#03cd8c" strokeWidth={2} dot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Box>

                            <Box className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
                                <Typography variant="subtitle2" className="text-green-800 font-semibold">
                                    Recommendation
                                </Typography>
                                <Typography variant="body2" className="text-green-700 mt-1">
                                    Variant B is showing a significant improvement (+13.6% conversion) with 95% statistical confidence. Consider rolling out to 100% of users.
                                </Typography>
                                <Button
                                    variant="contained"
                                    size="small"
                                    sx={{ mt: 2, bgcolor: EV_COLORS.primary, textTransform: 'none' }}
                                >
                                    Rollout Variant B
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
