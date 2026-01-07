// @ts-nocheck
import React, { useMemo, useState } from "react";
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
            Risk & Fraud Center
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Suspicious activity, abuse patterns and fraud alerts across EVzone.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col gap-3">
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
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [severityFilter, setSeverityFilter] = useState<string>("All");
  const [ageFilter, setAgeFilter] = useState<string>("All");
  const [regionFilter, setRegionFilter] = useState<string>("All");

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

  const filteredCases = useMemo(() => {
    return SAMPLE_RISK_CASES.filter((c) => {
      const matchesType =
        typeFilter === "All" ||
        (typeFilter === "Account" && c.type.toLowerCase().includes("account")) ||
        (typeFilter === "Payment" && c.type.toLowerCase().includes("payment")) ||
        (typeFilter === "Device" && c.type.toLowerCase().includes("device"));

      const matchesSeverity =
        severityFilter === "All" || c.severity.toLowerCase() === severityFilter.toLowerCase();

      const matchesAge =
        ageFilter === "All" ||
        (ageFilter === "<1h" && c.age === "1h") ||
        (ageFilter === "Today" && c.age === "Today") ||
        (ageFilter === ">24h" && c.age === ">24h");

      const matchesRegion = regionFilter === "All" || c.region === regionFilter;

      return matchesType && matchesSeverity && matchesAge && matchesRegion;
    });
  }, [typeFilter, severityFilter, ageFilter, regionFilter]);

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
          <Typography
            variant="caption"
            className="text-[11px]"
            color="text.secondary"
          >
            Filter suspicious activity by type, severity, age and region. Data is simulated on
            the frontend only.
          </Typography>

          <Divider className="!my-1" />

          <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
            <Box className="flex flex-col gap-1">
              <span className="text-slate-500">Type</span>
              <TextField
                select
                size="small"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                SelectProps={{ native: true }}
                sx={{ fontSize: 12, bgcolor: "background.paper" }}
              >
                {["All", "Account", "Payment", "Device"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </TextField>
            </Box>
            <Box className="flex flex-col gap-1">
              <span className="text-slate-500">Severity</span>
              <TextField
                select
                size="small"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                SelectProps={{ native: true }}
                sx={{ fontSize: 12, bgcolor: "background.paper" }}
              >
                {["All", "Low", "Medium", "High"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </TextField>
            </Box>
            <Box className="flex flex-col gap-1">
              <span className="text-slate-500">Age</span>
              <TextField
                select
                size="small"
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value)}
                SelectProps={{ native: true }}
                sx={{ fontSize: 12, bgcolor: "background.paper" }}
              >
                {["All", "<1h", "Today", ">24h"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </TextField>
            </Box>
            <Box className="flex flex-col gap-1">
              <span className="text-slate-500">Region</span>
              <TextField
                select
                size="small"
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                SelectProps={{ native: true }}
                sx={{ fontSize: 12, bgcolor: "background.paper" }}
              >
                {["All", "East Africa", "West Africa"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </TextField>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Risk cases list */}
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filteredCases.map((riskCase) => (
          <Card
            key={riskCase.id}
            elevation={1}
            sx={{
              borderRadius: 8,
              border: "1px solid rgba(148,163,184,0.6)",
              background: "linear-gradient(145deg, #fef2f2, #fef9c3)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              cursor: "pointer",
              "&:hover": {
                transform: "translateY(-3px)",
                boxShadow: 4,
              },
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
