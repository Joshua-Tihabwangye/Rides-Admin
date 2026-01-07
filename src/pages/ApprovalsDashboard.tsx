// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Chip,
  Button,
  Divider,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Snackbar,
  Alert
} from "@mui/material";
import PeriodSelector from "../components/PeriodSelector";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

// E1 – Approvals Dashboard (Light/Dark, EVzone themed)
// Route suggestion: /admin/approvals
// Central queue for items needing Admin-level approval.
//
// Manual test cases:
// 1) Initial render
//    - Light mode by default.
//    - Header shows EVZONE ADMIN and subtitle "Approvals".
//    - Filters row shows type, severity, age and region chips.
//    - A list of approval case cards is visible with tags and actions.
// 2) Theme toggle
//    - Click the Light/Dark toggle; expect background and cards to switch
//      palettes while content remains readable.
// 3) Filters (demo behaviour)
//    - Clicking any filter chip logs the chosen filter to the console.
// 4) Case actions
//    - Clicking a case card logs that case and would in production navigate to
//      E2 (Approval Detail).
//    - Approve/Reject buttons on the card log the action and case id.

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

function AdminApprovalsLayout({ children }) {
  return (
    <Box>
      {/* Title */}
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography
            variant="h6"
            className="font-semibold tracking-tight"
            color="text.primary"
          >
            Approvals Dashboard
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Company onboarding, vehicles, driver escalations and policy
            exceptions in one queue.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col gap-3">
        {children}
      </Box>
    </Box>
  );
}

const SAMPLE_APPROVALS_INITIAL = [
  {
    id: "APP-001",
    type: "Company onboarding",
    entity: "GreenMove Fleet",
    severity: "Medium",
    age: "2h",
    timestamp: dayjs().subtract(2, 'hour').toISOString(),
    region: "East Africa",
    summary: "New fleet partner onboarding – contract and KYB ready for review.",
  },
  {
    id: "APP-002",
    type: "Vehicle exception",
    entity: "CityRide Tours – UBA 123T",
    severity: "High",
    age: "30m",
    timestamp: dayjs().subtract(30, 'minute').toISOString(),
    region: "East Africa",
    summary:
      "Request to approve ICE bus for tours module (non-EV exception).",
  },
  {
    id: "APP-003",
    type: "Driver escalation",
    entity: "Michael Driver",
    severity: "High",
    age: "4h",
    timestamp: dayjs().subtract(4, 'hour').toISOString(),
    region: "West Africa",
    summary:
      "Driver flagged by risk rules (high cancellations + fare disputes).",
  },
  {
    id: "APP-004",
    type: "Policy exception",
    entity: "Sunrise Logistics",
    severity: "Low",
    age: "1d",
    timestamp: dayjs().subtract(1, 'day').toISOString(),
    region: "West Africa",
    summary:
      "Manual commission override request for promotion campaign.",
  },
];

export default function ApprovalsDashboardPage() {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState(SAMPLE_APPROVALS_INITIAL);
  const [filters, setFilters] = useState({ type: 'All', severity: 'All', region: 'All' });
  const [period, setPeriod] = useState("today");
  const [customRange, setCustomRange] = useState([null, null]);
  const [snackbar, setSnackbar] = useState({ open: false, msg: '' });

  const handleFilterChange = (field) => (e) => {
    setFilters(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleCaseClick = (approval) => {
    navigate(`/admin/approvals/${approval.id}`);
  };

  const handleActionClick = (approval, action) => {
    // Remove from list
    setApprovals(prev => prev.filter(a => a.id !== approval.id));

    // Persist to History using localStorage
    const historyItem = {
      ...approval,
      action,
      date: dayjs().format("YYYY-MM-DD HH:mm"),
      actor: "Admin User", // Simulated
    };

    const existingHistory = JSON.parse(localStorage.getItem('approval_history') || '[]');
    localStorage.setItem('approval_history', JSON.stringify([historyItem, ...existingHistory]));

    // Log
    console.log('Action:', action, 'on', approval.id);
    setSnackbar({ open: true, msg: `Case ${approval.id} ${action === 'Approve' ? 'Approved' : 'Rejected'}` });
  };

  const filteredApprovals = approvals.filter(a => {
    // 1. Period Filter
    const itemDate = dayjs(a.timestamp);
    let inPeriod = true;
    const now = dayjs();

    if (period === 'today') {
      inPeriod = itemDate.isSame(now, 'day');
    } else if (period === 'week' || period === '7days') {
      inPeriod = itemDate.isAfter(now.subtract(7, 'day'));
    } else if (period === 'thisMonth') {
      inPeriod = itemDate.isSame(now, 'month');
    } else if (period === 'custom' && customRange[0] && customRange[1]) {
      inPeriod = itemDate.isBetween(customRange[0], customRange[1], 'day', '[]');
    }

    if (!inPeriod) return false;

    // 2. Attribute Filters
    if (filters.type !== 'All' && a.type !== filters.type) return false;
    if (filters.severity !== 'All' && a.severity !== filters.severity) return false;
    if (filters.region !== 'All' && a.region !== filters.region) return false;
    return true;
  });

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    console.log("Approval search submitted:", search.trim());
  };

  return (
    <AdminApprovalsLayout>
      {/* Filters row */}
      <Card
        elevation={1}
        sx={{
          border: "1px solid rgba(148,163,184,0.5)",
          background: "linear-gradient(145deg, #f9fafb, #ffffff)",
        }}
      >
        <CardContent className="p-3 flex flex-col gap-3">
          <Box className="flex flex-col md:flex-row gap-3 items-center">
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="type-select">Type</InputLabel>
              <Select labelId="type-select" label="Type" value={filters.type} onChange={handleFilterChange('type')}>
                <MenuItem value="All">All Types</MenuItem>
                <MenuItem value="Company onboarding">Company</MenuItem>
                <MenuItem value="Vehicle exception">Vehicle</MenuItem>
                <MenuItem value="Driver escalation">Driver</MenuItem>
                <MenuItem value="Policy exception">Policy</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="severity-select">Severity</InputLabel>
              <Select labelId="severity-select" label="Severity" value={filters.severity} onChange={handleFilterChange('severity')}>
                <MenuItem value="All">All Severities</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="region-select">Region</InputLabel>
              <Select labelId="region-select" label="Region" value={filters.region} onChange={handleFilterChange('region')}>
                <MenuItem value="All">All Regions</MenuItem>
                <MenuItem value="East Africa">East Africa</MenuItem>
                <MenuItem value="West Africa">West Africa</MenuItem>
              </Select>
            </FormControl>
            <Box className="ml-auto">
              <Button
                variant="text"
                size="small"
                onClick={() => navigate('/admin/approvals/history')}
                sx={{ textTransform: 'none' }}
              >
                View History
              </Button>
            </Box>
          </Box>
          <Box className="flex justify-end">
            <PeriodSelector
              period={period}
              onChange={setPeriod}
              customStart={customRange[0]}
              customEnd={customRange[1]}
              setCustomRange={(range) => setCustomRange([range.start, range.end])}
            />
          </Box>

        </CardContent>
      </Card>

      {/* Approvals list */}
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filteredApprovals.length === 0 && <Typography className="p-4 text-slate-500 italic">No approvals found matching filters.</Typography>}
        {filteredApprovals.map((approval) => (
          <Card
            key={approval.id}
            elevation={1}
            sx={{
              border: "1px solid rgba(148,163,184,0.5)",
              background: "linear-gradient(145deg, #ffffff, #f9fafb)",
            }}
          >
            <CardContent
              className="p-4 flex flex-col gap-2 cursor-pointer"
              onClick={() => handleCaseClick(approval)}
            >
              <Box className="flex items-center justify-between gap-2">
                <Box>
                  <Typography
                    variant="caption"
                    className="text-[11px] text-slate-500"
                  >
                    {approval.id}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    className="font-semibold text-slate-900"
                  >
                    {approval.entity}
                  </Typography>
                </Box>
                <Box className="flex flex-col items-end gap-1">
                  <Chip
                    size="small"
                    label={approval.type}
                    sx={{ fontSize: 10, height: 22 }}
                  />
                  <Box className="flex gap-1">
                    <Chip
                      size="small"
                      label={approval.severity}
                      sx={{
                        fontSize: 10,
                        height: 22,
                        bgcolor:
                          approval.severity === "High"
                            ? "#fee2e2"
                            : approval.severity === "Medium"
                              ? "#fef3c7"
                              : "#e0f2fe",
                      }}
                    />
                    <Chip
                      size="small"
                      label={approval.age}
                      sx={{ fontSize: 10, height: 22 }}
                    />
                  </Box>
                </Box>
              </Box>

              <Typography
                variant="body2"
                className="text-[12px] text-slate-700"
              >
                {approval.summary}
              </Typography>

              <Box className="flex items-center justify-between mt-1">
                <Typography
                  variant="caption"
                  className="text-[11px] text-slate-500"
                >
                  Region: {approval.region}
                </Typography>
                <Box className="flex gap-1">
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{
                      textTransform: "none",
                      borderRadius: 2,
                      fontSize: 11,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActionClick(approval, "Reject");
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    sx={{
                      textTransform: "none",
                      borderRadius: 2,
                      fontSize: 11,
                      bgcolor: EV_COLORS.primary,
                      "&:hover": { bgcolor: "#0fb589" },
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActionClick(approval, "Approve");
                    }}
                  >
                    Approve
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>


      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success">{snackbar.msg}</Alert>
      </Snackbar>
    </AdminApprovalsLayout >
  );
}
