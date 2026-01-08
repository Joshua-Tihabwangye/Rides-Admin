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

// Mock data for flags and experiments
const FLAGS_DATA = {
    1: {
        id: 1,
        name: "New rides home screen",
        key: "rides.home.v2",
        status: "On",
        type: "Feature",
        startDate: "2025-10-15",
        duration: "Active",
        description: "New redesigned home screen for the rides module with improved UX and faster load times.",
        module: "Rides",
        segment: "All users",
        variants: [
            { name: "Control (Old)", users: 50000, conversion: 45.2, revenue: 125000 },
            { name: "New Version", users: 50000, conversion: 48.7, revenue: 135000 },
        ],
        dailyData: [
            { day: "Day 1", A: 44.0, B: 45.1 },
            { day: "Day 5", A: 44.5, B: 46.2 },
            { day: "Day 10", A: 45.0, B: 47.5 },
            { day: "Day 15", A: 45.1, B: 48.2 },
            { day: "Day 20", A: 45.2, B: 48.5 },
            { day: "Day 25", A: 45.2, B: 48.7 },
        ],
        adoptionData: [
            { day: "Week 1", adoption: 25 },
            { day: "Week 2", adoption: 45 },
            { day: "Week 3", adoption: 68 },
            { day: "Week 4", adoption: 85 },
            { day: "Week 5", adoption: 92 },
            { day: "Week 6", adoption: 98 },
        ],
    },
    2: {
        id: 2,
        name: "Delivery Price Experiment",
        key: "delivery.pricing.ab",
        status: "Running",
        type: "Experiment",
        startDate: "2025-11-01",
        duration: "25 days",
        description: "A/B test for new delivery pricing model with dynamic surge pricing.",
        module: "Deliveries",
        segment: "10% random",
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
    },
    3: {
        id: 3,
        name: "EV-only banner",
        key: "global.evOnlyBanner",
        status: "Off",
        type: "Feature",
        startDate: "2025-12-01",
        duration: "Inactive",
        description: "Promotional banner highlighting EV-only rides for environmental awareness campaigns.",
        module: "Global",
        segment: "All users",
        variants: [
            { name: "Without Banner", users: 100000, conversion: 22.5, revenue: 180000 },
            { name: "With Banner", users: 0, conversion: 0, revenue: 0 },
        ],
        dailyData: [],
        adoptionData: [],
    },
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

    // Get the flag/experiment data by ID
    const flagId = parseInt(id || "1", 10);
    const flag = FLAGS_DATA[flagId] || FLAGS_DATA[1];
    const isFeature = flag.type === "Feature";
    const isOff = flag.status === "Off";

    const getStatusColor = (status: string) => {
        switch (status) {
            case "On":
            case "Running":
                return { bgcolor: "#ecfdf5", color: "#059669" };
            case "Off":
                return { bgcolor: "#fee2e2", color: "#dc2626" };
            default:
                return { bgcolor: "#fef3c7", color: "#d97706" };
        }
    };

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
                    <Typography variant="h5" fontWeight={700} color="text.primary">
                        {isFeature ? "Feature Flag" : "Experiment Results"}: {flag.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Key: {flag.key} · Module: {flag.module} · Segment: {flag.segment}
                    </Typography>
                </Box>
                <Chip
                    label={flag.status}
                    size="small"
                    sx={{
                        ml: "auto",
                        ...getStatusColor(flag.status),
                        fontWeight: 600,
                    }}
                />
            </Box>

            {/* Summary Card */}
            <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)", bgcolor: "background.paper", mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 2 }}>
                        {isFeature ? "Feature Flag Details" : "Experiment Summary"}
                    </Typography>
                    
                    {/* Description */}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {flag.description}
                    </Typography>
                    
                    <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Box>
                            <Typography variant="caption" className="text-[11px] uppercase" color="text.secondary">
                                Type
                            </Typography>
                            <Typography variant="body2" fontWeight={600} color="text.primary">
                                {flag.type}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" className="text-[11px] uppercase" color="text.secondary">
                                Start Date
                            </Typography>
                            <Typography variant="body2" fontWeight={600} color="text.primary">
                                {flag.startDate}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" className="text-[11px] uppercase" color="text.secondary">
                                {isFeature ? "State" : "Duration"}
                            </Typography>
                            <Typography variant="body2" fontWeight={600} color="text.primary">
                                {flag.duration}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" className="text-[11px] uppercase" color="text.secondary">
                                Status
                            </Typography>
                            <Chip
                                label={flag.status}
                                size="small"
                                sx={{
                                    ...getStatusColor(flag.status),
                                    fontWeight: 600,
                                    height: 22,
                                }}
                            />
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Show message if flag is Off */}
            {isOff && (
                <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)", bgcolor: "#fef3c7", p: 3 }}>
                    <Typography variant="body1" fontWeight={600} color="#92400e">
                        This feature flag is currently OFF
                    </Typography>
                    <Typography variant="body2" color="#a16207" sx={{ mt: 1 }}>
                        No data is being collected while the flag is disabled. Enable the flag to start collecting metrics and user data.
                    </Typography>
                    <Button
                        variant="contained"
                        size="small"
                        sx={{ mt: 2, bgcolor: EV_COLORS.primary, textTransform: 'none' }}
                        onClick={() => navigate("/admin/system/flags")}
                    >
                        Enable Flag
                    </Button>
                </Card>
            )}

            {/* Overview Stats - only show if flag is active */}
            {!isOff && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)", bgcolor: "background.paper" }}>
                            <CardContent className="flex items-center gap-4">
                                <Box sx={{ p: 2, bgcolor: 'primary.main', borderRadius: 2, color: 'white' }}>
                                    <GroupIcon />
                                </Box>
                                <Box>
                                    <Typography variant="caption" className="text-[11px] uppercase" color="text.secondary">
                                        {isFeature ? "Total Users" : "Total Participants"}
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700} color="text.primary">
                                        {(
                                            flag.variants.reduce((acc, v) => acc + v.users, 0)
                                        ).toLocaleString()}
                                    </Typography>
                                    <Typography variant="caption" className="text-[10px]" color="text.secondary">
                                        {isFeature ? "Using this feature" : "Across all variants"}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)", bgcolor: "background.paper" }}>
                            <CardContent className="flex items-center gap-4">
                                <Box sx={{ p: 2, bgcolor: 'success.main', borderRadius: 2, color: 'white' }}>
                                    <TrendingUpIcon />
                                </Box>
                                <Box>
                                    <Typography variant="caption" className="text-[11px] uppercase" color="text.secondary">
                                        {isFeature ? "Conversion Rate" : "Conversion Uplift"}
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700} color="success.main">
                                        {isFeature 
                                            ? `${flag.variants[1]?.conversion || flag.variants[0]?.conversion}%`
                                            : `${((flag.variants[1].conversion - flag.variants[0].conversion) / flag.variants[0].conversion * 100).toFixed(1)}%`
                                        }
                                    </Typography>
                                    <Typography variant="caption" className="text-[10px]" color="text.secondary">
                                        {isFeature ? "Current performance" : "Variant B vs Control A"}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)", bgcolor: "background.paper" }}>
                            <CardContent className="flex items-center gap-4">
                                <Box sx={{ p: 2, bgcolor: 'secondary.main', borderRadius: 2, color: 'white' }}>
                                    <AccessTimeIcon />
                                </Box>
                                <Box>
                                    <Typography variant="caption" className="text-[11px] uppercase" color="text.secondary">
                                        Revenue Impact
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700} color="text.primary">
                                        ${(flag.variants.reduce((acc, v) => acc + v.revenue, 0)).toLocaleString()}
                                    </Typography>
                                    <Typography variant="caption" className="text-[10px]" color="text.secondary">
                                        {isFeature ? "Total revenue" : "Total across variants"}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Main Charts area - only show if flag is active */}
            {!isOff && (
                <Grid container spacing={3}>
                    {/* Left: Variant Comparison or Feature Adoption */}
                    <Grid item xs={12} lg={6}>
                        <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)", bgcolor: "background.paper", height: "100%" }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight={700} color="text.primary" gutterBottom>
                                    {isFeature ? "Feature Performance" : "Variant Performance Comparison"}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                                    {isFeature 
                                        ? "Performance metrics for this feature flag"
                                        : "Side-by-side comparison of Control (A) and Variant (B) performance metrics"
                                    }
                                </Typography>
                                <Divider sx={{ mb: 3 }} />

                                <Box sx={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={flag.variants}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip
                                                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            />
                                            <Legend />
                                            <Bar dataKey="conversion" name="Conversion Rate (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>

                                <Box className="mt-4 grid grid-cols-2 gap-4">
                                    {flag.variants.map((v) => (
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
                                                <span className={v.name.includes("Variant") || v.name.includes("New") ? "text-green-600" : ""}>
                                                    {v.conversion}%
                                                </span>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Right: Trend Over Time or Adoption Rate */}
                    <Grid item xs={12} lg={6}>
                        <Card elevation={1} sx={{ borderRadius: 4, height: "100%" }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    {isFeature && flag.adoptionData?.length > 0 ? "Adoption Rate Over Time" : "Conversion Trend (Daily)"}
                                </Typography>
                                <Divider sx={{ mb: 3 }} />

                                <Box sx={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        {isFeature && flag.adoptionData?.length > 0 ? (
                                            <LineChart data={flag.adoptionData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="day" />
                                                <YAxis domain={[0, 100]} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                />
                                                <Legend />
                                                <Line type="monotone" dataKey="adoption" name="Adoption %" stroke="#03cd8c" strokeWidth={2} dot={{ r: 4 }} />
                                            </LineChart>
                                        ) : (
                                            <LineChart data={flag.dailyData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="day" />
                                                <YAxis domain={['auto', 'auto']} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                />
                                                <Legend />
                                                <Line type="monotone" dataKey="A" name="Control (A)" stroke="#94a3b8" strokeWidth={2} dot={{ r: 4 }} />
                                                <Line type="monotone" dataKey="B" name="Variant (B)" stroke="#03cd8c" strokeWidth={2} dot={{ r: 4 }} />
                                            </LineChart>
                                        )}
                                    </ResponsiveContainer>
                                </Box>

                                <Box className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
                                    <Typography variant="subtitle2" className="text-green-800 font-semibold">
                                        Recommendation
                                    </Typography>
                                    <Typography variant="body2" className="text-green-700 mt-1">
                                        {isFeature 
                                            ? `This feature is performing well with ${flag.variants[1]?.conversion || flag.variants[0]?.conversion}% conversion rate. Consider expanding to more user segments.`
                                            : "Variant B is showing a significant improvement (+13.6% conversion) with 95% statistical confidence. Consider rolling out to 100% of users."
                                        }
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        sx={{ mt: 2, bgcolor: EV_COLORS.primary, textTransform: 'none' }}
                                    >
                                        {isFeature ? "Expand Rollout" : "Rollout Variant B"}
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
}
