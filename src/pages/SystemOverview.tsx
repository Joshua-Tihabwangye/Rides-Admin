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

      <Box className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Integrations status */}
        <Card
          elevation={1}
          sx={{
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.5)",
            // background: "linear-gradient(145deg, #ffffff, #f9fafb)",
            bgcolor: "background.paper"
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <Typography
              variant="subtitle2"
              className="font-semibold"
              color="text.primary"
            >
              Integrations status
            </Typography>
            <Divider className="!my-1" />
            <Box className="flex flex-col gap-2 text-[12px]">
              {SYSTEM_INTEGRATIONS.map((integration) => (
                <Box
                  key={integration.id}
                  className="flex items-start justify-between gap-2"
                >
                  <Box>
                    <div className="font-medium">{integration.name}</div>
                    <div className="text-[11px] text-slate-500">
                      Provider: {integration.provider}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Last error: {integration.lastError}
                    </div>
                  </Box>
                  <Button
                    variant="text"
                    size="small"
                    sx={{
                      textTransform: "none",
                      fontSize: 11,
                      minWidth: "auto",
                      padding: 0,
                      color: "#4b5563",
                    }}
                    onClick={() => handleIntegrationClick(integration.id)}
                  >
                    View
                  </Button>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Recent critical actions */}
        <Card
          elevation={1}
          sx={{
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.5)",
            // background: "linear-gradient(145deg, #fef2f2, #ffffff)",
            bgcolor: "background.paper"
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <Typography
              variant="subtitle2"
              className="font-semibold"
              color="text.primary"
            >
              Recent critical admin actions
            </Typography>
            <Divider className="!my-1" />
            <Box className="flex flex-col gap-2 text-[12px]">
              {CRITICAL_ACTIONS.map((evt) => (
                <Box key={evt.id} className="flex flex-col">
                  <span className="text-[11px] text-slate-500">{evt.at}</span>
                  <span className="font-medium">{evt.actor}</span>
                  <span>{evt.detail}</span>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Quick links */}
        <Card
          elevation={1}
          sx={{
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.5)",
            // background: "linear-gradient(145deg, #eef2ff, #ffffff)",
            bgcolor: "background.paper"
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Typography
              variant="subtitle2"
              className="font-semibold"
              color="text.primary"
            >
              Quick links
            </Typography>
            <Divider className="!my-1" />
            <Box className="flex flex-col gap-2">
              <Button
                variant="outlined"
                size="small"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  fontSize: 12,
                }}
                onClick={() => handleQuickLink("integrations")}
              >
                Go to Integrations
              </Button>
              <Button
                variant="outlined"
                size="small"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  fontSize: 12,
                }}
                onClick={() => handleQuickLink("flags")}
              >
                Go to Feature Flags
              </Button>
              <Button
                variant="outlined"
                size="small"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  fontSize: 12,
                }}
                onClick={() => handleQuickLink("audit")}
              >
                Go to Audit Log
              </Button>
              <Button
                variant="outlined"
                size="small"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  fontSize: 12,
                }}
                onClick={() => handleQuickLink("risk")}
              >
                Go to Risk & Fraud Center
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
