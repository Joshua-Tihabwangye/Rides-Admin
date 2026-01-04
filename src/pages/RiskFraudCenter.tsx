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

// H2 – Risk & Fraud Center (Light/Dark, EVzone themed)
// Route suggestion: /admin/risk
// Central view for fraud alerts, suspicious behaviours and triage workflow.
//
// Manual test cases:
// 1) Initial render
//    - Light mode by default.
//    - Header shows EVZONE ADMIN and "Risk & Fraud" subtitle.
//    - Filters row includes type, severity, age, region chips.
//    - A list/grid of risk case cards is visible.
// 2) Theme toggle
//    - Toggle Light/Dark; cards and background adjust while content remains
//      readable.
// 3) Filters (demo)
//    - Clicking a filter chip logs the chosen filter to the console.
// 4) Case actions
//    - Clicking a card logs that case (placeholder for opening deep detail).
//    - Action buttons (Monitor, Limit features, Escalate) log the respective
//      action and case ID.

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

function AdminRiskLayout({ children }) {
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
            Risk & Fraud
          </Typography>
        </Box>
        <Box className="flex items-center gap-2">
          <Chip
            size="small"
            label="Risk queue"
            sx={{
              bgcolor: "#fef2f2",
              borderColor: "#fecaca",
              color: "#991b1b",
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
            Risk & Fraud Center
          </Typography>
          <Typography
            variant="caption"
            className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"
              }`}
          >
            Suspicious activity, abuse patterns and fraud alerts across EVzone.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col px-4 sm:px-6 pb-6 gap-3">
        {children}
      </Box>
    </Box>
  );
}

const SAMPLE_RISK_CASES = [
  {
    id: "RISK-101",
    type: "Account abuse",
    actorType: "Rider",
    actorName: "John Okello",
    severity: "High",
    age: "1h",
    region: "East Africa",
    summary: "Multiple refund disputes across 3 drivers in 24 hours.",
  },
  {
    id: "RISK-102",
    type: "Payment fraud",
    actorType: "Driver",
    actorName: "Michael Driver",
    severity: "Medium",
    age: "3h",
    region: "West Africa",
    summary: "Unusual pattern of short trips with identical card tokens.",
  },
  {
    id: "RISK-103",
    type: "Device sharing",
    actorType: "Rider",
    actorName: "Samuel K.",
    severity: "Low",
    age: "Today",
    region: "West Africa",
    summary: "Multiple accounts logging in from the same device/IMEI.",
  },
];

export default function RiskFraudCenterPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const handleFilterChipClick = (group, value) => {
    console.log(`Risk filter ${group}:`, value);
  };

  const handleCaseClick = (riskCase) => {
    navigate(`/admin/risk/${riskCase.id}`);
  };

  const handleActionClick = (riskCase, action) => {
    console.log('AuditLog:', {
      event: `Risk action: ${action}`,
      at: new Date().toISOString(),
      actor: 'Current Admin',
      caseId: riskCase.id,
      action,
    });
    alert(`Action "${action}" logged for ${riskCase.id}`);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    console.log("Risk search submitted:", search.trim());
  };

  return (
    <AdminRiskLayout>
      {/* Filters row */}
      <Card
        elevation={1}
        sx={{
          borderRadius: 8,
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
                placeholder="Search risk alerts by ID, name, phone…"
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
              {["All", "Account", "Payment", "Device"].map((v) => (
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

      {/* Risk cases list */}
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {SAMPLE_RISK_CASES.map((riskCase) => (
          <Card
            key={riskCase.id}
            elevation={1}
            sx={{
              borderRadius: 8,
              border: "1px solid rgba(148,163,184,0.6)",
              background: "linear-gradient(145deg, #fef2f2, #fef9c3)",
            }}
          >
            <CardContent
              className="p-4 flex flex-col gap-2 cursor-pointer"
              onClick={() => handleCaseClick(riskCase)}
            >
              <Box className="flex items-center justify-between gap-2">
                <Box>
                  <Typography
                    variant="caption"
                    className="text-[11px] text-slate-600"
                  >
                    {riskCase.id}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    className="font-semibold text-slate-900"
                  >
                    {riskCase.actorName}
                  </Typography>
                  <Typography
                    variant="caption"
                    className="text-[11px] text-slate-600"
                  >
                    {riskCase.actorType} · {riskCase.region}
                  </Typography>
                </Box>
                <Box className="flex flex-col items-end gap-1">
                  <Chip
                    size="small"
                    label={riskCase.type}
                    sx={{ fontSize: 10, height: 22 }}
                  />
                  <Box className="flex gap-1">
                    <Chip
                      size="small"
                      label={riskCase.severity}
                      sx={{
                        fontSize: 10,
                        height: 22,
                        bgcolor:
                          riskCase.severity === "High"
                            ? "#fee2e2"
                            : riskCase.severity === "Medium"
                              ? "#fef3c7"
                              : "#e0f2fe",
                      }}
                    />
                    <Chip
                      size="small"
                      label={riskCase.age}
                      sx={{ fontSize: 10, height: 22 }}
                    />
                  </Box>
                </Box>
              </Box>

              <Typography
                variant="body2"
                className="text-[12px] text-slate-800"
              >
                {riskCase.summary}
              </Typography>

              <Box className="flex items-center justify-between mt-1">
                <Typography
                  variant="caption"
                  className="text-[11px] text-slate-600"
                >
                  Risk engine score: 82 (sample)
                </Typography>
                <Box className="flex gap-1">
                  <Button
                    size="small"
                    variant="text"
                    sx={{
                      textTransform: "none",
                      borderRadius: 2,
                      fontSize: 11,
                      color: "#4b5563",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActionClick(riskCase, "Monitor");
                    }}
                  >
                    Monitor
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{
                      textTransform: "none",
                      borderRadius: 2,
                      fontSize: 11,
                      borderColor: "#f97316",
                      color: "#92400e",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActionClick(riskCase, "Limit features");
                    }}
                  >
                    Limit features
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    sx={{
                      textTransform: "none",
                      borderRadius: 2,
                      fontSize: 11,
                      bgcolor: "#ef4444",
                      "&:hover": { bgcolor: "#dc2626" },
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActionClick(riskCase, "Escalate");
                    }}
                  >
                    Escalate
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </AdminRiskLayout>
  );
}
