// @ts-nocheck
import React, { useState, useMemo } from "react";
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
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
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
    PieChart,
    Pie,
    Cell,
} from "recharts";

const EV_COLORS = {
    primary: "#03cd8c",
    secondary: "#f77f00",
    blue: "#3b82f6",
    red: "#ef4444",
};

// Sample promo data
const PROMO_DATA = {
    "PROMO-NEW-UG": {
        id: "PROMO-NEW-UG",
        name: "Welcome rides Uganda",
        type: "Rider Promotion",
        segment: "New riders",
        reward: "50% off first 3 rides",
        status: "Active",
        startDate: "2025-01-01",
        endDate: "2025-03-31",
        budget: 50000,
        spent: 32450,
        redemptions: 1245,
        uniqueUsers: 980,
        avgDiscount: 26.10,
        conversionRate: 68.5,
        dailyData: [
            { day: "Week 1", redemptions: 180, spend: 4680 },
            { day: "Week 2", redemptions: 220, spend: 5720 },
            { day: "Week 3", redemptions: 195, spend: 5070 },
            { day: "Week 4", redemptions: 250, spend: 6500 },
            { day: "Week 5", redemptions: 200, spend: 5200 },
            { day: "Week 6", redemptions: 200, spend: 5280 },
        ],
        regionBreakdown: [
            { name: "Kampala", value: 650, color: EV_COLORS.primary },
            { name: "Entebbe", value: 280, color: EV_COLORS.secondary },
            { name: "Jinja", value: 180, color: EV_COLORS.blue },
            { name: "Other", value: 135, color: "#94a3b8" },
        ],
    },
    "PROMO-OFFPEAK": {
        id: "PROMO-OFFPEAK",
        name: "Off-peak discount",
        type: "Rider Promotion",
        segment: "All riders",
        reward: "10% off rides 10am–3pm",
        status: "Active",
        startDate: "2025-01-15",
        endDate: "2025-06-30",
        budget: 30000,
        spent: 8750,
        redemptions: 875,
        uniqueUsers: 620,
        avgDiscount: 10.00,
        conversionRate: 42.3,
        dailyData: [
            { day: "Week 1", redemptions: 120, spend: 1200 },
            { day: "Week 2", redemptions: 145, spend: 1450 },
            { day: "Week 3", redemptions: 160, spend: 1600 },
            { day: "Week 4", redemptions: 180, spend: 1800 },
            { day: "Week 5", redemptions: 135, spend: 1350 },
            { day: "Week 6", redemptions: 135, spend: 1350 },
        ],
        regionBreakdown: [
            { name: "Kampala", value: 420, color: EV_COLORS.primary },
            { name: "Nairobi", value: 250, color: EV_COLORS.secondary },
            { name: "Lagos", value: 130, color: EV_COLORS.blue },
            { name: "Other", value: 75, color: "#94a3b8" },
        ],
    },
    "INCENTIVE-PEAK": {
        id: "INCENTIVE-PEAK",
        name: "Peak hours bonus",
        type: "Driver Incentive",
        segment: "Active drivers",
        reward: "Bonus after 10 peak trips",
        status: "Active",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        budget: 100000,
        spent: 45200,
        redemptions: 452,
        uniqueUsers: 320,
        avgDiscount: 100.00,
        conversionRate: 78.2,
        dailyData: [
            { day: "Week 1", redemptions: 65, spend: 6500 },
            { day: "Week 2", redemptions: 78, spend: 7800 },
            { day: "Week 3", redemptions: 82, spend: 8200 },
            { day: "Week 4", redemptions: 75, spend: 7500 },
            { day: "Week 5", redemptions: 80, spend: 8000 },
            { day: "Week 6", redemptions: 72, spend: 7200 },
        ],
        regionBreakdown: [
            { name: "Kampala", value: 180, color: EV_COLORS.primary },
            { name: "Lagos", value: 145, color: EV_COLORS.secondary },
            { name: "Nairobi", value: 85, color: EV_COLORS.blue },
            { name: "Other", value: 42, color: "#94a3b8" },
        ],
    },
    "INCENTIVE-EV": {
        id: "INCENTIVE-EV",
        name: "EV utilisation boost",
        type: "Driver Incentive",
        segment: "EV drivers",
        reward: "Extra bonus for 95% EV-only hours",
        status: "Active",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        budget: 75000,
        spent: 28500,
        redemptions: 285,
        uniqueUsers: 195,
        avgDiscount: 100.00,
        conversionRate: 85.4,
        dailyData: [
            { day: "Week 1", redemptions: 42, spend: 4200 },
            { day: "Week 2", redemptions: 48, spend: 4800 },
            { day: "Week 3", redemptions: 52, spend: 5200 },
            { day: "Week 4", redemptions: 45, spend: 4500 },
            { day: "Week 5", redemptions: 50, spend: 5000 },
            { day: "Week 6", redemptions: 48, spend: 4800 },
        ],
        regionBreakdown: [
            { name: "Kampala", value: 120, color: EV_COLORS.primary },
            { name: "Kigali", value: 85, color: EV_COLORS.secondary },
            { name: "Nairobi", value: 50, color: EV_COLORS.blue },
            { name: "Other", value: 30, color: "#94a3b8" },
        ],
    },
};

export default function PromoDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const promo = useMemo(() => {
        if (id && PROMO_DATA[id]) {
            return PROMO_DATA[id];
        }
        // Default to first promo
        return PROMO_DATA["PROMO-NEW-UG"];
    }, [id]);

    const budgetUsedPercent = ((promo.spent / promo.budget) * 100).toFixed(1);

    return (
        <Box className="flex flex-col gap-6">
            {/* Header */}
            <Box className="flex items-center gap-4 flex-wrap">
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate("/admin/promos")}
                    sx={{ textTransform: "none", color: "text.secondary" }}
                >
                    Back to Promotions
                </Button>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" fontWeight={700} color="text.primary">
                        {promo.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {promo.id} · {promo.type} · {promo.segment}
                    </Typography>
                </Box>
                <Chip
                    label={promo.status}
                    size="small"
                    sx={{
                        bgcolor: promo.status === "Active" ? "#ecfdf5" : "#fee2e2",
                        color: promo.status === "Active" ? "#059669" : "#dc2626",
                        fontWeight: 600,
                    }}
                />
            </Box>

            {/* Summary Card */}
            <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)", bgcolor: "background.paper" }}>
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 2 }}>
                        Campaign Summary
                    </Typography>
                    <Box className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Box>
                            <Typography variant="caption" className="text-[11px] uppercase" color="text.secondary">
                                Reward
                            </Typography>
                            <Typography variant="body2" fontWeight={600} color="text.primary">
                                {promo.reward}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" className="text-[11px] uppercase" color="text.secondary">
                                Start Date
                            </Typography>
                            <Typography variant="body2" fontWeight={600} color="text.primary">
                                {promo.startDate}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" className="text-[11px] uppercase" color="text.secondary">
                                End Date
                            </Typography>
                            <Typography variant="body2" fontWeight={600} color="text.primary">
                                {promo.endDate}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" className="text-[11px] uppercase" color="text.secondary">
                                Budget Used
                            </Typography>
                            <Typography variant="body2" fontWeight={600} color="text.primary">
                                {budgetUsedPercent}%
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Overview Stats */}
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)", bgcolor: "background.paper" }}>
                        <CardContent className="flex items-center gap-4">
                            <Box sx={{ p: 2, bgcolor: EV_COLORS.primary, borderRadius: 2, color: 'white' }}>
                                <LocalOfferIcon />
                            </Box>
                            <Box>
                                <Typography variant="caption" className="text-[11px] uppercase" color="text.secondary">
                                    Total Redemptions
                                </Typography>
                                <Typography variant="h5" fontWeight={700} color="text.primary">
                                    {promo.redemptions.toLocaleString()}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)", bgcolor: "background.paper" }}>
                        <CardContent className="flex items-center gap-4">
                            <Box sx={{ p: 2, bgcolor: EV_COLORS.secondary, borderRadius: 2, color: 'white' }}>
                                <GroupIcon />
                            </Box>
                            <Box>
                                <Typography variant="caption" className="text-[11px] uppercase" color="text.secondary">
                                    Unique Users
                                </Typography>
                                <Typography variant="h5" fontWeight={700} color="text.primary">
                                    {promo.uniqueUsers.toLocaleString()}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)", bgcolor: "background.paper" }}>
                        <CardContent className="flex items-center gap-4">
                            <Box sx={{ p: 2, bgcolor: EV_COLORS.blue, borderRadius: 2, color: 'white' }}>
                                <AttachMoneyIcon />
                            </Box>
                            <Box>
                                <Typography variant="caption" className="text-[11px] uppercase" color="text.secondary">
                                    Total Spent
                                </Typography>
                                <Typography variant="h5" fontWeight={700} color="text.primary">
                                    ${promo.spent.toLocaleString()}
                                </Typography>
                                <Typography variant="caption" className="text-[10px]" color="text.secondary">
                                    of ${promo.budget.toLocaleString()} budget
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)", bgcolor: "background.paper" }}>
                        <CardContent className="flex items-center gap-4">
                            <Box sx={{ p: 2, bgcolor: '#8b5cf6', borderRadius: 2, color: 'white' }}>
                                <TrendingUpIcon />
                            </Box>
                            <Box>
                                <Typography variant="caption" className="text-[11px] uppercase" color="text.secondary">
                                    Conversion Rate
                                </Typography>
                                <Typography variant="h5" fontWeight={700} color="success.main">
                                    {promo.conversionRate}%
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3}>
                {/* Redemptions Over Time */}
                <Grid item xs={12} lg={8}>
                    <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)", bgcolor: "background.paper", height: "100%" }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={700} color="text.primary" gutterBottom>
                                Redemptions & Spend Over Time
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                                Weekly breakdown of promo redemptions and associated spend
                            </Typography>
                            <Divider sx={{ mb: 3 }} />

                            <Box sx={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={promo.dailyData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                                        <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            formatter={(value, name) => [
                                                name === 'spend' ? `$${value.toLocaleString()}` : value.toLocaleString(),
                                                name === 'spend' ? 'Spend' : 'Redemptions'
                                            ]}
                                        />
                                        <Legend />
                                        <Line yAxisId="left" type="monotone" dataKey="redemptions" name="Redemptions" stroke={EV_COLORS.primary} strokeWidth={2} dot={{ r: 4 }} />
                                        <Line yAxisId="right" type="monotone" dataKey="spend" name="Spend ($)" stroke={EV_COLORS.secondary} strokeWidth={2} dot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Region Breakdown */}
                <Grid item xs={12} lg={4}>
                    <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)", bgcolor: "background.paper", height: "100%" }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={700} color="text.primary" gutterBottom>
                                Redemptions by Region
                            </Typography>
                            <Divider sx={{ mb: 3 }} />

                            <Box sx={{ height: 250 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={promo.regionBreakdown}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {promo.regionBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            formatter={(value) => [value.toLocaleString(), 'Redemptions']}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>

                            <Box className="mt-4 space-y-2">
                                {promo.regionBreakdown.map((region) => (
                                    <Box key={region.name} className="flex justify-between items-center text-sm">
                                        <Box className="flex items-center gap-2">
                                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: region.color }} />
                                            <span>{region.name}</span>
                                        </Box>
                                        <span className="font-semibold">{region.value.toLocaleString()}</span>
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Actions */}
            <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)", bgcolor: "background.paper" }}>
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 2 }}>
                        Campaign Actions
                    </Typography>
                    <Box className="flex gap-2 flex-wrap">
                        <Button
                            variant="outlined"
                            size="small"
                            sx={{ textTransform: 'none', borderRadius: 2 }}
                        >
                            Edit Campaign
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            color="warning"
                            sx={{ textTransform: 'none', borderRadius: 2 }}
                        >
                            Pause Campaign
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            sx={{ textTransform: 'none', borderRadius: 2 }}
                        >
                            End Campaign
                        </Button>
                        <Button
                            variant="contained"
                            size="small"
                            sx={{ textTransform: 'none', borderRadius: 2, bgcolor: EV_COLORS.primary, ml: 'auto' }}
                        >
                            Duplicate Campaign
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
