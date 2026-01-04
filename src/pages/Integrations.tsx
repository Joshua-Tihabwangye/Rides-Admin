// @ts-nocheck
import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Divider,
} from "@mui/material";

// K2 – Integrations (Light/Dark, EVzone themed)
// Route suggestion: /admin/system/integrations
// Shows status of external integrations (payments, SMS, maps, analytics).
// Uses a StatusCard pattern that can be reused by the System Health overview.
//
// Manual test cases:
// 1) Initial render
//    - Light mode by default.
//    - Header shows EVZONE ADMIN and subtitle "System · Integrations".
//    - Title "Integrations" with short description.
//    - A grid of integration status cards (Payments, SMS, Maps, Analytics)
//      is visible, each with a status chip and last error/last sync text.
// 2) Theme toggle
//    - Toggle Light/Dark; status cards update colours but preserve their
//      contents.
// 3) Action buttons
//    - Clicking "View details" logs a message with the integration id.
//    - Clicking "Reconnect" or "Refresh" logs a message plus an AuditLog
//      style entry (simulated) indicating an integration update.

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

function AdminIntegrationsLayout({ children }) {
  const [mode, setMode] = useState("light");
  const isDark = mode === "dark";

  const toggleMode = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <Box
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        isDark ? "bg-slate-950 text-slate-50" : "bg-slate-50 text-slate-900"
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
            className={`tracking-[0.25em] uppercase text-[11px] ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            EVZONE ADMIN
          </Typography>
          <Typography
            variant="caption"
            className={`text-[11px] ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
          >
            System · Integrations
          </Typography>
        </Box>
        <Box className="flex items-center gap-2">
          <Chip
            size="small"
            label="Integrations"
            sx={{
              bgcolor: "#e0f2fe",
              borderColor: "#bae6fd",
              color: "#0f172a",
              fontSize: 10,
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

      {/* Title */}
      <Box className="px-4 sm:px-6 pt-4 pb-2 flex items-center justify-between gap-2">
        <Box>
          <Typography
            variant="h6"
            className={`font-semibold tracking-tight ${
              isDark ? "text-slate-50" : "text-slate-900"
            }`}
          >
            Integrations
          </Typography>
          <Typography
            variant="caption"
            className={`text-[11px] ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
          >
            Monitor status of external providers (payments, SMS, maps,
            analytics) and trigger reconnects when needed.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col px-4 sm:px-6 pb-6 gap-3">
        {children}
      </Box>
    </Box>
  );
}

const INTEGRATIONS = [
  {
    id: "payments",
    name: "Payments gateway",
    provider: "ExamplePay",
    status: "Connected",
    lastError: "None",
    lastSync: "2025-11-25 17:40",
  },
  {
    id: "sms",
    name: "SMS provider",
    provider: "ExampleSMS",
    status: "Degraded",
    lastError: "High latency on delivery receipts",
    lastSync: "2025-11-25 17:35",
  },
  {
    id: "maps",
    name: "Maps",
    provider: "MapBox",
    status: "Connected",
    lastError: "None",
    lastSync: "2025-11-25 17:39",
  },
  {
    id: "analytics",
    name: "Analytics",
    provider: "ExampleAnalytics",
    status: "Error",
    lastError: "Auth token expired",
    lastSync: "2025-11-25 17:20",
  },
];

export default function IntegrationsPage() {
  const handleViewDetails = (integration) => {
    console.log("View integration details:", integration.id);
  };

  const handleAction = (integration, action) => {
    console.log(`Integration action ${action} on`, integration.id);
    console.log("AuditLog:", {
      event: "INTEGRATION_ACTION",
      integrationId: integration.id,
      provider: integration.provider,
      action,
      at: new Date().toISOString(),
      actor: "Admin (simulated)",
    });
  };

  return (
    <AdminIntegrationsLayout>
      <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {INTEGRATIONS.map((integration) => (
          <StatusCard
            key={integration.id}
            integration={integration}
            onViewDetails={() => handleViewDetails(integration)}
            onAction={(action) => handleAction(integration, action)}
          />
        ))}
      </Box>
    </AdminIntegrationsLayout>
  );
}

function StatusCard({ integration, onViewDetails, onAction }) {
  const statusColor =
    integration.status === "Connected"
      ? "#22c55e"
      : integration.status === "Degraded"
      ? "#f97316"
      : "#ef4444";

  return (
    <Card
      elevation={1}
      sx={{
        borderRadius: 8,
        border: "1px solid rgba(148,163,184,0.5)",
        background: "linear-gradient(145deg, #ffffff, #f9fafb)",
      }}
    >
      <CardContent className="p-4 flex flex-col gap-2">
        <Box className="flex items-center justify-between gap-2">
          <Box>
            <Typography
              variant="subtitle2"
              className="font-semibold text-slate-900"
            >
              {integration.name}
            </Typography>
            <Typography
              variant="caption"
              className="text-[11px] text-slate-500"
            >
              Provider: {integration.provider}
            </Typography>
          </Box>
          <Chip
            size="small"
            label={integration.status}
            sx={{
              fontSize: 10,
              height: 22,
              bgcolor: `${statusColor}22`,
              color: statusColor,
            }}
          />
        </Box>

        <Divider className="!my-1" />

        <Box className="flex flex-col gap-1 text-[11px] text-slate-600">
          <Typography variant="caption">
            Last sync: {integration.lastSync}
          </Typography>
          <Typography variant="caption">
            Last error: {integration.lastError || "None"}
          </Typography>
        </Box>

        <Box className="flex items-center justify-between mt-1">
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
            onClick={onViewDetails}
          >
            View details
          </Button>
          <Box className="flex gap-1">
            <Button
              variant="outlined"
              size="small"
              sx={{
                textTransform: "none",
                borderRadius: 999,
                fontSize: 11,
              }}
              onClick={() => onAction("refresh")}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              size="small"
              sx={{
                textTransform: "none",
                borderRadius: 999,
                fontSize: 11,
                bgcolor: EV_COLORS.primary,
                "&:hover": { bgcolor: "#0fb589" },
              }}
              onClick={() => onAction("reconnect")}
            >
              Reconnect
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
