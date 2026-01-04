// @ts-nocheck
import React, { useState } from "react";
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
} from "@mui/material";

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
  const [mode, setMode] = useState("light");
  const isDark = mode === "dark";

  const toggleMode = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <Box
      className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? "bg-slate-950 text-slate-50" : "bg-slate-50 text-slate-900"
        }`}
      sx={{
        background: isDark
          ? `radial-gradient(circle at top left, ${EV_COLORS.primary}18, #020617), radial-gradient(circle at bottom right, ${EV_COLORS.secondary}10, #020617)`
          : `radial-gradient(circle at top left, ${EV_COLORS.primary}12, #ffffff), radial-gradient(circle at bottom right, ${EV_COLORS.secondary}08, #f9fafb)`,
      }}
    >
      {/* Header */}
      <Box className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <Box>
          <Typography
            variant="subtitle2"
            className={`tracking-[0.25em] uppercase text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"
              }`}
          >
            EVZONE ADMIN
          </Typography>
          <Typography
            variant="caption"
            className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"
              }`}
          >
            Approvals
          </Typography>
        </Box>
        <Box className="flex items-center gap-2">
          <Chip
            size="small"
            label="Queue"
            sx={{
              bgcolor: "#eef2ff",
              borderColor: "#c7d2fe",
              color: "#1e3a8a",
              fontSize: 10,
            }}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={toggleMode}
            sx={{
              textTransform: "none",
              borderRadius: 8,
              borderColor: isDark ? "#1f2937" : "#e5e7eb",
              color: isDark ? "#e5e7eb" : "#374151",
              px: 1.8,
              py: 0.4,
              fontSize: 11,
              minWidth: "auto",
            }}
          >
            {isDark ? "Dark" : "Light"}
          </Button>
        </Box>
      </Box>

      {/* Title */}
      <Box className="px-4 sm:px-6 pt-4 pb-2 flex items-center justify-between gap-2">
        <Box>
          <Typography
            variant="h6"
            className={`font-semibold tracking-tight ${isDark ? "text-slate-50" : "text-slate-900"
              }`}
          >
            Approvals Dashboard
          </Typography>
          <Typography
            variant="caption"
            className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"
              }`}
          >
            Company onboarding, vehicles, driver escalations and policy
            exceptions in one queue.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col px-4 sm:px-6 pb-6 gap-3">
        {children}
      </Box>
    </Box>
  );
}

const SAMPLE_APPROVALS = [
  {
    id: "APP-001",
    type: "Company onboarding",
    entity: "GreenMove Fleet",
    severity: "Medium",
    age: "2h",
    region: "East Africa",
    summary: "New fleet partner onboarding – contract and KYB ready for review.",
  },
  {
    id: "APP-002",
    type: "Vehicle exception",
    entity: "CityRide Tours – UBA 123T",
    severity: "High",
    age: "30m",
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
    region: "West Africa",
    summary:
      "Manual commission override request for promotion campaign.",
  },
];

export default function ApprovalsDashboardPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const handleFilterChipClick = (group, value) => {
    console.log(`Filter ${group}:`, value);
  };

  const handleCaseClick = (approval) => {
    navigate(`/admin/approvals/${approval.id}`);
  };

  const handleActionClick = (approval, action) => {
    console.log('AuditLog:', {
      event: `Approval ${action}`,
      at: new Date().toISOString(),
      actor: 'Current Admin',
      approvalId: approval.id,
      entity: approval.entity,
      action,
    });
    alert(`${action} action logged for ${approval.entity}`);
  };

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
          <Box className="flex flex-col lg:flex-row lg:items-center gap-3">
            <Box
              component="form"
              onSubmit={handleSearchSubmit}
              className="flex-1"
            >
              <TextField
                fullWidth
                size="small"
                placeholder="Search approvals by ID, company, driver…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" },
                  "& .MuiInputBase-input::placeholder": { fontSize: 12 },
                }}
              />
            </Box>
          </Box>

          <Divider className="!my-1" />

          <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
            <Box className="flex flex-wrap items-center gap-1">
              <span className="text-slate-500">Type:</span>
              {["All", "Company", "Vehicle", "Driver", "Policy"].map((v) => (
                <Chip
                  key={v}
                  size="small"
                  label={v}
                  onClick={() => handleFilterChipClick("type", v)}
                  sx={{ fontSize: 10, height: 22 }}
                />
              ))}
            </Box>
            <Box className="flex flex-wrap items-center gap-1">
              <span className="text-slate-500">Severity:</span>
              {["All", "Low", "Medium", "High"].map((v) => (
                <Chip
                  key={v}
                  size="small"
                  label={v}
                  onClick={() => handleFilterChipClick("severity", v)}
                  sx={{ fontSize: 10, height: 22 }}
                />
              ))}
            </Box>
            <Box className="flex flex-wrap items-center gap-1">
              <span className="text-slate-500">Age:</span>
              {["All", "<1h", "Today", ">24h"].map((v) => (
                <Chip
                  key={v}
                  size="small"
                  label={v}
                  onClick={() => handleFilterChipClick("age", v)}
                  sx={{ fontSize: 10, height: 22 }}
                />
              ))}
            </Box>
            <Box className="flex flex-wrap items-center gap-1">
              <span className="text-slate-500">Region:</span>
              {["All", "East Africa", "West Africa"].map((v) => (
                <Chip
                  key={v}
                  size="small"
                  label={v}
                  onClick={() => handleFilterChipClick("region", v)}
                  sx={{ fontSize: 10, height: 22 }}
                />
              ))}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Approvals list */}
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {SAMPLE_APPROVALS.map((approval) => (
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
    </AdminApprovalsLayout>
  );
}
