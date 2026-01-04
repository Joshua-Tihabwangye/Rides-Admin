// @ts-nocheck
import React, { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import LockIcon from "@mui/icons-material/Lock";
import SchoolIcon from "@mui/icons-material/School";
import LocalPoliceIcon from "@mui/icons-material/LocalPolice";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import DirectionsCarFilledIcon from "@mui/icons-material/DirectionsCarFilled";
import ApiIcon from "@mui/icons-material/Api";

// A4 – Admin Onboarding Checklist & Required Training
// Route suggestion: /admin/onboarding/checklist
//
// Manual test cases (run these in the browser or your test harness):
// 1) Initial render
//    - Expect all modules to be marked as not completed.
//    - Required counter should show `0 / 5 completed`.
//    - Required progress bar should show `0%`.
//    - "Unlock full Admin access" button must be disabled.
//    - Theme toggle should default to Light mode.
// 2) Mark a single required module as done
//    - Click "Mark done" for "Core Admin Training".
//    - Expect its pill to change to "Completed" with filled style.
//    - Required counter should update to `1 / 5 completed`.
//    - Required progress should update accordingly (20%).
//    - "Unlock full Admin access" button should still be disabled.
// 3) Complete ALL required modules only
//    - Mark all required modules (Core, Privacy & Security, Rides & Logistics,
//      Finance & Billing, Safety & Risk) as done.
//    - Optional module can remain incomplete.
//    - Required counter should show `5 / 5 completed`.
//    - Required progress should read `100%`.
//    - "Unlock full Admin access" button should become enabled.
// 4) Toggle a module back to not done
//    - Click "Completed" again for one required module.
//    - Expect it to revert to the outlined "Mark done" state.
//    - Required counter and progress should both decrease.
//    - "Unlock full Admin access" button should become disabled again.
// 5) Overall progress chip
//    - As you toggle modules on/off (required or optional), the
//      `${progressAll}% overall` chip should reflect the percentage of
//      *all* modules completed (required + optional).
// 6) Read-only entry
//    - Click "Enter portal (read-only)".
//    - Expect no errors; you should be able to hook this up to navigation
//      without changing internal state.
// 7) Unlock action
//    - After completing all required modules, click "Unlock full Admin access".
//    - Expect a console log (`"Onboarding checklist complete"`) for now and
//      no errors; in your real app you will replace this with navigation and
//      access-level upgrade logic.
// 8) Theme toggle
//    - Click the theme toggle in the header.
//    - Expect backgrounds and key text colors to switch between light and
//      dark palettes.
// 9) Theme persistence during interaction
//    - Toggle to Dark mode, mark some modules as completed, then switch back
//      to Light mode.
//    - Expect the completion state and progress bars to remain correct in
//      both themes (no reset or visual glitches).

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

const TRAINING_MODULES = [
  {
    id: "core-admin",
    title: "Core Admin Training",
    description:
      "How EVzone works across Rider, Driver, Company, Agent & Admin portals.",
    area: "Core",
    required: true,
  },
  {
    id: "privacy-security",
    title: "Data Governance, Privacy & Security",
    description:
      "Access scopes, PII handling, audit logs, and incident escalation.",
    area: "Security",
    required: true,
  },
  {
    id: "rides-mobility",
    title: "Rides & Logistics Admin",
    description:
      "Services, pricing, zones, approvals and EV-only rules for mobility.",
    area: "Mobility",
    required: true,
  },
  {
    id: "finance-billing",
    title: "Finance & Billing Overview",
    description:
      "Commissions, payouts, taxes, invoices and financial reporting.",
    area: "Finance",
    required: true,
  },
  {
    id: "safety-risk",
    title: "Safety, Risk & Compliance",
    description:
      "Incidents, fraud rules, sanctions and automated policy actions.",
    area: "Risk",
    required: true,
  },
  {
    id: "integrations-tech",
    title: "Tech & Integrations",
    description: "Feature flags, API keys, webhooks and third-party integrations.",
    area: "Tech",
    required: false,
  },
];

const areaIcon = (area) => {
  switch (area) {
    case "Core":
      return <LockIcon fontSize="small" />;
    case "Security":
      return <LocalPoliceIcon fontSize="small" />;
    case "Mobility":
      return <DirectionsCarFilledIcon fontSize="small" />;
    case "Finance":
      return <AccountBalanceIcon fontSize="small" />;
    case "Risk":
      return <SchoolIcon fontSize="small" />;
    case "Tech":
      return <ApiIcon fontSize="small" />;
    default:
      return <SchoolIcon fontSize="small" />;
  }
};

export default function AdminOnboardingChecklistPage() {
  const [mode, setMode] = useState("light"); // "light" | "dark"
  const [completed, setCompleted] = useState(() => ({
    // In a real app, this would be loaded from the backend
    "core-admin": false,
    "privacy-security": false,
    "rides-mobility": false,
    "finance-billing": false,
    "safety-risk": false,
    "integrations-tech": false,
  }));

  const isDark = mode === "dark";

  const totalRequired = useMemo(
    () => TRAINING_MODULES.filter((m) => m.required).length,
    []
  );

  const totalDoneRequired = useMemo(
    () => TRAINING_MODULES.filter((m) => m.required && completed[m.id]).length,
    [completed]
  );

  const totalDoneAll = useMemo(
    () => TRAINING_MODULES.filter((m) => completed[m.id]).length,
    [completed]
  );

  const progressRequired = Math.round((totalDoneRequired / totalRequired) * 100);
  const progressAll = Math.round(
    (totalDoneAll / TRAINING_MODULES.length) * 100
  );

  const toggleComplete = (id) => {
    setCompleted((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <Box
      className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? "bg-slate-950 text-slate-50" : "bg-slate-50 text-slate-900"
        }`}
      sx={{
        background: isDark
          ? `radial-gradient(circle at top left, ${EV_COLORS.primary}22, transparent 55%), radial-gradient(circle at bottom right, ${EV_COLORS.secondary}22, #020617)`
          : `radial-gradient(circle at top left, ${EV_COLORS.primary}11, #ffffff), radial-gradient(circle at bottom right, ${EV_COLORS.secondary}11, #f9fafb)`,
      }}
    >
      {/* Header */}
      <Box className="w-full flex items-center justify-between px-4 py-3 sm:px-6">
        <Typography
          variant="subtitle2"
          className={`tracking-[0.25em] uppercase text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"
            }`}
        >
          EVZONE
        </Typography>
        <Box className="flex items-center gap-2">
          <Chip
            size="small"
            label="Admin onboarding"
            sx={{
              bgcolor: isDark ? "rgba(15,23,42,0.9)" : "#ffffff",
              border: isDark ? "1px solid #1f2937" : "1px solid #e5e7eb",
              color: isDark ? "#e5e7eb" : "#4b5563",
              fontSize: "10px",
              textTransform: "uppercase",
            }}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={toggleMode}
            sx={{
              textTransform: "none",
              borderRadius: 999,
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

      {/* Main card */}
      <Box className="flex-1 flex items-center justify-center px-4 pb-10">
        <Card
          elevation={10}
          sx={{
            width: "100%",
            maxWidth: 720,
            borderRadius: 2,
            border: isDark
              ? "1px solid rgba(30,64,175,0.4)"
              : "1px solid rgba(148,163,184,0.5)",
            background: isDark
              ? "linear-gradient(145deg, rgba(15,23,42,0.96), rgba(15,23,42,0.98))"
              : "linear-gradient(145deg, #ffffff, #f9fafb)",
          }}
        >
          <CardContent className="p-5 sm:p-7 flex flex-col gap-6">
            {/* Heading + progress */}
            <Box className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <Box className="flex-1 min-w-0">
                <Typography
                  variant="h6"
                  className={`font-semibold tracking-tight mb-1 ${isDark ? "text-slate-50" : "text-slate-900"
                    }`}
                >
                  Complete your Admin onboarding
                </Typography>
                <Typography
                  variant="body2"
                  className={`text-xs sm:text-sm ${isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                >
                  To unlock full write access in the Admin Portal, you need to complete
                  the required training modules below. You can still browse in read-only
                  mode while training is in progress.
                </Typography>
              </Box>

              <Box className="flex flex-col items-end gap-2 w-full sm:w-auto">
                <Box className="text-right">
                  <Typography
                    variant="caption"
                    className={`text-[11px] ${isDark ? "text-slate-300" : "text-slate-600"
                      }`}
                  >
                    Required modules
                  </Typography>
                  <Typography
                    variant="body2"
                    className={`font-semibold text-sm ${isDark ? "text-slate-50" : "text-slate-900"
                      }`}
                  >
                    {totalDoneRequired} / {totalRequired} completed
                  </Typography>
                </Box>
                <Box className="w-full sm:w-48">
                  <LinearProgress
                    variant="determinate"
                    value={progressRequired}
                    sx={{
                      height: 6,
                      borderRadius: 2,
                      backgroundColor: isDark ? "#020617" : "#e5e7eb",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 2,
                        background: `linear-gradient(90deg, ${EV_COLORS.primary}, ${EV_COLORS.secondary})`,
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    className={`text-[10px] mt-1 float-right ${isDark ? "text-slate-500" : "text-slate-600"
                      }`}
                  >
                    {progressRequired}%
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Training modules list */}
            <Box className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
              <Box className="px-4 pt-4 pb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <Box>
                  <Typography
                    variant="subtitle2"
                    className="text-slate-100 text-sm font-medium"
                  >
                    Training modules
                  </Typography>
                  <Typography
                    variant="caption"
                    className="text-[11px] text-slate-400"
                  >
                    Marking modules as completed here is for demo only – in production
                    this is driven by the training system.
                  </Typography>
                </Box>

                <Chip
                  size="small"
                  label={`${progressAll}% overall`}
                  sx={{
                    bgcolor: "rgba(15,23,42,0.9)",
                    border: "1px solid #1f2937",
                    color: "#e5e7eb",
                    fontSize: "10px",
                  }}
                />
              </Box>

              <List dense className="px-2 pb-1">
                {TRAINING_MODULES.map((module) => {
                  const done = !!completed[module.id];
                  return (
                    <ListItem
                      key={module.id}
                      className="rounded-xl px-2 py-2 flex flex-col sm:flex-row sm:items-center gap-2"
                      sx={{
                        "&:hover": {
                          backgroundColor: "rgba(15,23,42,0.9)",
                        },
                      }}
                      alignItems="flex-start"
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {done ? (
                          <CheckCircleIcon
                            fontSize="small"
                            sx={{ color: EV_COLORS.primary }}
                          />
                        ) : (
                          <RadioButtonUncheckedIcon
                            fontSize="small"
                            sx={{ color: "#64748b" }}
                          />
                        )}
                      </ListItemIcon>

                      <Box className="flex-1 min-w-0">
                        <Box className="flex flex-wrap items-center gap-1 mb-0.5">
                          <Typography
                            variant="body2"
                            className="text-[13px] font-medium text-slate-100"
                          >
                            {module.title}
                          </Typography>
                          <Chip
                            size="small"
                            variant="outlined"
                            icon={areaIcon(module.area)}
                            label={module.area}
                            sx={{
                              borderColor: "#1f2937",
                              color: "#cbd5f5",
                              bgcolor: "rgba(15,23,42,0.9)",
                              "& .MuiChip-icon": { color: "#64748b" },
                            }}
                          />
                          {module.required && (
                            <Chip
                              size="small"
                              label="Required"
                              sx={{
                                bgcolor: "rgba(248,250,252,0.05)",
                                border: "1px solid #fbbf24",
                                color: "#facc15",
                                fontSize: "10px",
                              }}
                            />
                          )}
                        </Box>
                        <Typography
                          variant="body2"
                          className="text-[11px] text-slate-400"
                        >
                          {module.description}
                        </Typography>
                      </Box>

                      <Box className="flex items-center gap-2 self-stretch sm:self-auto">
                        <Tooltip title="Mark as done for this sandbox session">
                          <Button
                            variant={done ? "contained" : "outlined"}
                            size="small"
                            onClick={() => toggleComplete(module.id)}
                            sx={{
                              textTransform: "none",
                              borderRadius: 2,
                              minWidth: 96,
                              borderColor: done ? "transparent" : "#1f2937",
                              bgcolor: done ? EV_COLORS.primary : "transparent",
                              color: done ? "#020617" : "#e5e7eb",
                              "&:hover": {
                                bgcolor: done ? "#0fb589" : "#020617",
                              },
                            }}
                          >
                            {done ? "Completed" : "Mark done"}
                          </Button>
                        </Tooltip>

                        <Button
                          variant="outlined"
                          size="small"
                          sx={{
                            textTransform: "none",
                            borderRadius: 2,
                            borderColor: "#1f2937",
                            color: "#e5e7eb",
                            "&:hover": { borderColor: EV_COLORS.secondary },
                          }}
                          onClick={() => {
                            // TODO: navigate to training module route
                            // e.g. router.push(`/admin/training/${module.id}`)
                          }}
                        >
                          Open
                        </Button>
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            </Box>

            {/* Footer actions */}
            <Box className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-1">
              <Typography
                variant="caption"
                className={`text-[10px] max-w-xl ${isDark ? "text-slate-500" : "text-slate-500"
                  }`}
              >
                When all required modules are completed, your supervisor or Super Admin
                can switch your access level from read-only to full write access for the
                regions and modules assigned to you.
              </Typography>

              <Box className="flex flex-row gap-2 justify-end">
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    borderColor: "#1f2937",
                    color: "#e5e7eb",
                    "&:hover": { borderColor: EV_COLORS.primary },
                  }}
                  onClick={() => {
                    // TODO: allow user to view portal in read-only mode
                    // e.g. router.push('/admin?mode=readonly')
                  }}
                >
                  Enter portal (read-only)
                </Button>

                <Button
                  variant="contained"
                  size="small"
                  disabled={totalDoneRequired !== totalRequired}
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    px: 3,
                    bgcolor:
                      totalDoneRequired === totalRequired
                        ? EV_COLORS.primary
                        : "#1f2937",
                    "&:hover": {
                      bgcolor:
                        totalDoneRequired === totalRequired
                          ? "#0fb589"
                          : "#020617",
                    },
                  }}
                  onClick={() => {
                    if (totalDoneRequired !== totalRequired) return;
                    // TODO: navigate to full Admin Home and unlock write access
                    console.log("Onboarding checklist complete");
                  }}
                >
                  Unlock full Admin access
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
