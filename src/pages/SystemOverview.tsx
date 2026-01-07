// @ts-nocheck
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Divider,
} from "@mui/material";

// System Health & Config Overview (Light/Dark, EVzone themed)
// Route suggestion: /admin/system/overview
// Glue page that summarises integration status, last errors and recent
// critical admin actions. Provides quick entry points into Integrations,
// Flags, Audit and Risk.
//
// Manual test cases:
// 1) Initial render
//    - Light mode by default.
//    - Header shows EVZONE ADMIN and subtitle "System · Overview".
//    - Title "System Health & Config Overview" visible.
//    - Integrations status cards, recent critical actions and quick links
//      cards are visible.
// 2) Theme toggle
//    - Toggle Light/Dark; all cards update while contents remain intact.
// 3) Status cards
//    - Clicking "View details" or "Go to Integrations" logs navigation
//      hints and AuditLog-style entries.
// 4) Quick links
//    - Quick link buttons for Integrations, Flags, Audit log and Risk log the
//      suggested routes.

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};



const SYSTEM_INTEGRATIONS = [
  {
    id: "payments",
    name: "Payments gateway",
    provider: "ExamplePay",
    status: "Connected",
    lastError: "None",
  },
  {
    id: "sms",
    name: "SMS provider",
    provider: "ExampleSMS",
    status: "Degraded",
    lastError: "High latency on delivery receipts",
  },
  {
    id: "analytics",
    name: "Analytics",
    provider: "ExampleAnalytics",
    status: "Error",
    lastError: "Auth token expired",
  },
];

const CRITICAL_ACTIONS = [
  {
    id: "EVT-CRIT-1",
    at: "2025-11-25 17:40",
    actor: "Alex Admin",
    detail: "Turned on rides.home.v2 for all users.",
  },
  {
    id: "EVT-CRIT-2",
    at: "2025-11-25 17:35",
    actor: "Felix Finance",
    detail: "Updated VAT rate for Uganda.",
  },
  {
    id: "EVT-CRIT-3",
    at: "2025-11-25 17:20",
    actor: "RiskBot",
    detail: "Suspended account for RISK-101.",
  },
];


export default function SystemOverviewPage() {
  const navigate = useNavigate();

  const handleIntegrationClick = (integrationId) => {
    navigate("/admin/system/integrations");
  };

  const routeMap = {
    integrations: "/admin/system/integrations",
    flags: "/admin/system/flags",
    audit: "/admin/system/audit-log",
    risk: "/admin/risk",
  };

  const handleQuickLink = (target) => {
    navigate(routeMap[target]);
  };

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
            System Health & Config Overview
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Quickly inspect integrations, flags and recent critical actions.
          </Typography>
        </Box>
        <Chip
          size="small"
          label="System health"
          sx={{
            bgcolor: "#e0f2fe",
            borderColor: "#bae6fd",
            color: "#0f172a",
            fontSize: 10,
          }}
        />
      </Box>

      {/* System Health KPIs */}
      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)", bgcolor: "background.paper" }}>
          <CardContent className="p-3">
            <Typography variant="caption" className="text-[11px] uppercase text-slate-500">System Status</Typography>
            <Typography variant="h6" className="font-semibold text-lg" color="text.primary">Operational</Typography>
            <Typography variant="caption" className="text-[11px] text-emerald-600">All systems normal</Typography>
          </CardContent>
        </Card>
        <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)", bgcolor: "background.paper" }}>
          <CardContent className="p-3">
            <Typography variant="caption" className="text-[11px] uppercase text-slate-500">Active Integrations</Typography>
            <Typography variant="h6" className="font-semibold text-lg" color="text.primary">2/3</Typography>
            <Typography variant="caption" className="text-[11px] text-amber-600">1 degraded</Typography>
          </CardContent>
        </Card>
        <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)", bgcolor: "background.paper" }}>
          <CardContent className="p-3">
            <Typography variant="caption" className="text-[11px] uppercase text-slate-500">Feature Flags</Typography>
            <Typography variant="h6" className="font-semibold text-lg" color="text.primary">3</Typography>
            <Typography variant="caption" className="text-[11px] text-slate-600">2 active, 1 experiment</Typography>
          </CardContent>
        </Card>
        <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)", bgcolor: "background.paper" }}>
          <CardContent className="p-3">
            <Typography variant="caption" className="text-[11px] uppercase text-slate-500">Uptime (30d)</Typography>
            <Typography variant="h6" className="font-semibold text-lg" color="text.primary">99.8%</Typography>
            <Typography variant="caption" className="text-[11px] text-emerald-600">+0.2% vs last month</Typography>
          </CardContent>
        </Card>
      </Box>

      <Box className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Integrations status */}
        <Card
          elevation={2}
          sx={{
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.3)",
            bgcolor: "background.paper"
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <Box className="flex items-center justify-between">
              <Typography
                variant="subtitle2"
                className="font-semibold"
                color="text.primary"
              >
                Integrations Status
              </Typography>
              <Button
                variant="text"
                size="small"
                onClick={() => handleQuickLink("integrations")}
                sx={{ textTransform: "none", fontSize: 11 }}
              >
                Manage
              </Button>
            </Box>
            <Divider className="!my-1" />
            <Box className="flex flex-col gap-3">
              {SYSTEM_INTEGRATIONS.map((integration) => {
                const statusColor = integration.status === "Connected" ? "#03cd8c" : integration.status === "Degraded" ? "#f77f00" : "#ef4444";
                return (
                  <Box
                    key={integration.id}
                    className="flex items-start justify-between gap-2 p-2 rounded-md border border-divider"
                  >
                    <Box sx={{ flex: 1 }}>
                      <Box className="flex items-center gap-2 mb-1">
                        <Typography variant="body2" className="font-semibold" color="text.primary">
                          {integration.name}
                        </Typography>
                        <Chip
                          label={integration.status}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: 9,
                            bgcolor: statusColor + '20',
                            color: statusColor,
                            fontWeight: 600,
                          }}
                        />
                      </Box>
                      <Typography variant="caption" className="text-[11px]" color="text.secondary">
                        Provider: {integration.provider}
                      </Typography>
                      {integration.lastError !== "None" && (
                        <Typography variant="caption" className="text-[10px] text-amber-600 block mt-1">
                          {integration.lastError}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>

        {/* Recent critical actions */}
        <Card
          elevation={2}
          sx={{
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.3)",
            bgcolor: "background.paper"
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <Box className="flex items-center justify-between">
              <Typography
                variant="subtitle2"
                className="font-semibold"
                color="text.primary"
              >
                Recent Critical Actions
              </Typography>
              <Button
                variant="text"
                size="small"
                onClick={() => handleQuickLink("audit")}
                sx={{ textTransform: "none", fontSize: 11 }}
              >
                View All
              </Button>
            </Box>
            <Divider className="!my-1" />
            <Box className="flex flex-col gap-3">
              {CRITICAL_ACTIONS.map((evt) => (
                <Box 
                  key={evt.id} 
                  className="p-2 rounded-md border border-divider hover:bg-action-hover transition-colors"
                >
                  <Typography variant="caption" className="text-[10px] uppercase" color="text.secondary">
                    {evt.at}
                  </Typography>
                  <Typography variant="body2" className="font-semibold mt-0.5" color="text.primary">
                    {evt.actor}
                  </Typography>
                  <Typography variant="body2" className="text-[12px] mt-1" color="text.primary">
                    {evt.detail}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Quick links */}
        <Card
          elevation={2}
          sx={{
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.3)",
            bgcolor: "background.paper"
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Typography
              variant="subtitle2"
              className="font-semibold"
              color="text.primary"
            >
              Quick Actions
            </Typography>
            <Divider className="!my-1" />
            <Box className="grid grid-cols-2 gap-2">
              <Button
                variant="contained"
                size="small"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  fontSize: 11,
                  bgcolor: EV_COLORS.primary,
                  '&:hover': { bgcolor: '#0fb589' },
                }}
                onClick={() => handleQuickLink("integrations")}
              >
                Integrations
              </Button>
              <Button
                variant="contained"
                size="small"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  fontSize: 11,
                  bgcolor: EV_COLORS.secondary,
                  '&:hover': { bgcolor: '#d97706' },
                }}
                onClick={() => handleQuickLink("flags")}
              >
                Feature Flags
              </Button>
              <Button
                variant="outlined"
                size="small"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  fontSize: 11,
                }}
                onClick={() => handleQuickLink("audit")}
              >
                Audit Log
              </Button>
              <Button
                variant="outlined"
                size="small"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  fontSize: 11,
                }}
                onClick={() => handleQuickLink("risk")}
              >
                Risk Center
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
