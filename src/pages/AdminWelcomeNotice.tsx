// @ts-nocheck
import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from "@mui/material";

// A3 – Admin Welcome & Responsibility Notice (Light/Dark)
// Route suggestion: /admin/onboarding/welcome
//
// Manual test cases:
// 1) Initial render
//    - Expect light mode by default (light background, dark text).
//    - Page shows a welcome heading, description, and 4 responsibility items
//      with small green bullet icons.
//    - Acknowledgement checkbox should be unchecked.
//    - "Continue to onboarding" button must be disabled.
// 2) Acknowledge responsibilities
//    - Tick the acknowledgement checkbox.
//    - Expect the "Continue to onboarding" button to become enabled.
//    - Clicking the button should log "Admin responsibility notice acknowledged"
//      to the console (until real navigation is wired).
// 3) Theme toggle
//    - Click the theme toggle in the top-right.
//    - Expect the UI to switch between light and dark palettes.
//    - Content and checkbox state must be preserved while switching theme.
// 4) Policy centre button
//    - Click "View policy centre".
//    - Expect a placeholder console log, with no errors (you will replace this
//      with navigation to the policy / rule management pages later).

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

const bulletPoints = [
  {
    title: "High-impact workspace",
    body: "Changes here flow to riders, drivers, companies, and agents in real time.",
  },
  {
    title: "Full audit logging",
    body: "Every admin action is recorded with timestamp, actor, and before/after values.",
  },
  {
    title: "Policy-first operations",
    body: "Follow EVzone's governance, privacy, and safety policies for every decision.",
  },
  {
    title: "Production vs staging",
    body: "Test risky changes in staging before rolling out to live regions.",
  },
];

export default function AdminWelcomeNoticePage() {
  const [acknowledged, setAcknowledged] = useState(false);
  const [mode, setMode] = useState("light"); // "light" | "dark"

  const isDark = mode === "dark";

  const handleContinue = () => {
    if (!acknowledged) return;
    // TODO: Navigate to onboarding checklist or home dashboard
    console.log("Admin responsibility notice acknowledged");
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
              letterSpacing: 0.8,
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
            maxWidth: 560,
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
            {/* Title + description */}
            <Box className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <Box className="flex-1 min-w-0">
                <Typography
                  variant="h6"
                  className={`font-semibold tracking-tight mb-1 ${isDark ? "text-slate-50" : "text-slate-900"
                    }`}
                >
                  Welcome to the EVzone Admin Portal
                </Typography>
                <Typography
                  variant="body2"
                  className={`text-xs sm:text-sm ${isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                >
                  You are signing into the EVzone HQ console. This space controls pricing,
                  services, and policies across Rides & Logistics and other modules. Please
                  review and acknowledge your responsibilities before continuing.
                </Typography>
              </Box>

              <Box className="flex flex-col items-end gap-2">
                <Chip
                  label="Internal use only"
                  size="small"
                  sx={{
                    bgcolor: isDark ? "rgba(15,23,42,0.9)" : "#f9fafb",
                    border: isDark ? "1px solid #334155" : "1px solid #e5e7eb",
                    color: isDark ? "#e5e7eb" : "#4b5563",
                    fontSize: "10px",
                    textTransform: "uppercase",
                  }}
                />
                <Typography
                  variant="caption"
                  className={`text-[10px] max-w-[160px] text-right ${isDark ? "text-slate-500" : "text-slate-500"
                    }`}
                >
                  Do not share screenshots or credentials outside EVzone.
                </Typography>
              </Box>
            </Box>

            {/* Responsibilities list */}
            <Box className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
              <Box className="px-4 pt-4 pb-1 flex items-center justify-between gap-2">
                <Typography
                  variant="subtitle2"
                  className="text-slate-100 text-sm font-medium"
                >
                  Your responsibilities as an Admin
                </Typography>
                <Chip
                  size="small"
                  label="Logged & monitored"
                  sx={{
                    bgcolor: "rgba(248,250,252,0.05)",
                    border: "1px solid #1f2937",
                    color: "#9ca3af",
                    fontSize: "10px",
                  }}
                />
              </Box>

              <List dense className="px-2 pb-1">
                {bulletPoints.map((item) => (
                  <ListItem
                    key={item.title}
                    className="rounded-xl px-2 py-1.5"
                    sx={{
                      "&:hover": {
                        backgroundColor: "rgba(15,23,42,0.9)",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {/* Simple circular icon without @mui/icons-material */}
                      <Box
                        component="span"
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "999px",
                          bgcolor: EV_COLORS.primary,
                          boxShadow: "0 0 0 3px rgba(3,205,140,0.25)",
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          className="text-[13px] font-medium text-slate-100"
                        >
                          {item.title}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          className="text-[11px] text-slate-400"
                        >
                          {item.body}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            {/* Acknowledgement + actions */}
            <Box className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-1">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    sx={{
                      color: "#64748b",
                      "&.Mui-checked": { color: EV_COLORS.primary },
                    }}
                  />
                }
                label={
                  <Typography
                    variant="body2"
                    className={`text-[11px] sm:text-xs ${isDark ? "text-slate-300" : "text-slate-600"
                      }`}
                  >
                    I understand that my actions in this portal are audited and I will
                    follow EVzone's governance, privacy, and safety policies.
                  </Typography>
                }
              />

              <Box className="flex flex-col sm:flex-row gap-2 sm:justify-end w-full sm:w-auto">
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    borderColor: "#1f2937",
                    color: "#e5e7eb",
                    px: 2.5,
                    "&:hover": { borderColor: EV_COLORS.secondary },
                  }}
                  onClick={() => {
                    // TODO: open policies modal or route to /admin/policies
                    console.log("TODO: open admin policy center");
                  }}
                >
                  View policy centre
                </Button>

                <Button
                  variant="contained"
                  size="small"
                  disabled={!acknowledged}
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    px: 3,
                    bgcolor: acknowledged ? EV_COLORS.primary : "#1f2937",
                    "&:hover": {
                      bgcolor: acknowledged ? "#0fb589" : "#020617",
                    },
                  }}
                  onClick={handleContinue}
                >
                  Continue to onboarding
                </Button>
              </Box>
            </Box>

            <Typography
              variant="caption"
              className={`text-[10px] mt-1 ${isDark ? "text-slate-500" : "text-slate-500"
                }`}
            >
              Tip: New admins typically start in read-only mode. Write access to critical
              settings (pricing, services, finance, risk) can be granted after completing
              the required training modules.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
