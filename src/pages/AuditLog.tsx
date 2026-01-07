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
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Select,
  MenuItem,
} from "@mui/material";
import { clearAuditEvents, getAuditEvents } from "../lib/auditStore";

// K3 – Audit Log (Light/Dark, EVzone themed)
// Route suggestion: /admin/system/audit-log
// Displays a list of audit events (mutating actions from the Admin Portal).
// Filters by module, actor and date range.
//
// Manual test cases:
// 1) Initial render
//    - Light mode by default.
//    - Header shows EVZONE ADMIN and subtitle "System · Audit log".
//    - Title "Audit Log" visible, with a short description.
//    - Filter row has Module, Actor and Range selects.
//    - Table shows at least 5 sample audit events.
// 2) Theme toggle
//    - Toggle Light/Dark; filters and table state remain intact.
// 3) Filters
//    - Changing Module/Actor/Range logs the filter state to the console.
// 4) Row click
//    - Clicking a row logs that event's id; in production, this would open a
//      detail drawer.

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

function AdminAuditLayout({ children }) {
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
            Audit Log
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Track all critical admin actions: who changed what, and when.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col gap-3">
        {children}
      </Box>
    </Box>
  );
}

const SAMPLE_EVENTS = [
  {
    id: "EVT-001",
    at: "2025-11-25 17:45",
    actor: "Alex Admin",
    module: "Training",
    event: "TRAINING_MODULE_UPDATED",
    detail: "Updated 'Driver onboarding 101'",
  },
  {
    id: "EVT-002",
    at: "2025-11-25 17:40",
    actor: "Maria Mobility",
    module: "Pricing",
    event: "PRICING_RULE_SAVED",
    detail: "Saved Kampala EV Car – Standard pricing",
  },
  {
    id: "EVT-003",
    at: "2025-11-25 17:35",
    actor: "Felix Finance",
    module: "Finance",
    event: "REGION_TAX_CONFIG_UPDATED",
    detail: "Updated VAT for Uganda",
  },
  {
    id: "EVT-004",
    at: "2025-11-25 17:30",
    actor: "Alex Admin",
    module: "System",
    event: "FLAG_UPDATED",
    detail: "Turned on rides.home.v2",
  },
  {
    id: "EVT-005",
    at: "2025-11-25 17:20",
    actor: "RiskBot",
    module: "Risk",
    event: "RISK_ACTION_LOGGED",
    detail: "Escalated RISK-101 to fraud desk",
  },
];

export default function AuditLogPage() {
  const [filters, setFilters] = useState({
    module: "All",
    actor: "All",
    range: "24h",
  });

  const storedEvents = getAuditEvents();
  const eventsForTable = storedEvents.length
    ? storedEvents.map((evt, i) => ({
        id: `LIVE-${i + 1}`,
        at: typeof evt.at === 'string' ? new Date(evt.at).toLocaleString() : '',
        actor: (evt.actor as string) || 'Admin (unknown)',
        module: (evt.module as string) || 'System',
        event: evt.event as string,
        detail: JSON.stringify(evt, null, 0),
      }))
    : [];
  const handleFilterChange = (field) => (event) => {
    const value = event.target.value;
    const next = { ...filters, [field]: value };
    setFilters(next);
    console.log("Audit log filters updated:", next);
  };

  const handleRowClick = (eventRow) => {
    console.log("Audit log row clicked:", eventRow.id);
  };

  const filteredEvents = eventsForTable.filter((evt) => {
    if (filters.module !== "All" && evt.module !== filters.module) return false;
    if (filters.actor !== "All" && evt.actor !== filters.actor) return false;
    // Range filter omitted in this demo, but logged above.
    return true;
  });

  return (
    <AdminAuditLayout>
      {/* Filters */}
      <Card
        elevation={1}
        sx={{
          borderRadius: 8,
          border: "1px solid rgba(148,163,184,0.5)",
          background: "linear-gradient(145deg, #f9fafb, #ffffff)",
        }}
      >
        <CardContent className="p-4 flex flex-col gap-3">
          <Box className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <FilterSelect
              label="Module"
              value={filters.module}
              onChange={handleFilterChange("module")}
              options={[
                "All",
                "Training",
                "Pricing",
                "Finance",
                "System",
                "Risk",
              ]}
            />
            <FilterSelect
              label="Actor"
              value={filters.actor}
              onChange={handleFilterChange("actor")}
              options={["All", "Alex Admin", "Maria Mobility", "Felix Finance", "RiskBot"]}
            />
            <FilterSelect
              label="Range"
              value={filters.range}
              onChange={handleFilterChange("range")}
              options={["24h", "7d", "30d"]}
            />
          </Box>
          <Box className="flex items-center justify-between mt-2">
            <Typography variant="caption" className="text-[11px] text-slate-500">
              Showing {filteredEvents.length} event(s){storedEvents.length ? " from this session" : " (sample data)"}.
            </Typography>
            <Button
              variant="outlined"
              size="small"
              sx={{ textTransform: "none", borderRadius: 999, fontSize: 11 }}
              onClick={() => {
                clearAuditEvents();
                // Clear sample events from localStorage
                localStorage.removeItem('audit_events');
                // Clear approval history if needed
                localStorage.removeItem('approval_history');
                // Force reload to show empty state
                window.location.reload();
              }}
            >
              Clear audit log
            </Button>
          </Box>

        </CardContent>
      </Card>

      {/* Events table */}
      <Card
        elevation={1}
        sx={{
          borderRadius: 8,
          border: "1px solid rgba(148,163,184,0.5)",
          background: "#ffffff",
        }}
      >
        <CardContent className="p-4 flex flex-col gap-2">
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f3f4f6" }}>
                  <TableCell>Time</TableCell>
                  <TableCell>Actor</TableCell>
                  <TableCell>Module</TableCell>
                  <TableCell>Event</TableCell>
                  <TableCell>Detail</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No audit events found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((evt) => (
                    <TableRow
                      key={evt.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => handleRowClick(evt)}
                    >
                      <TableCell>{evt.at}</TableCell>
                      <TableCell>{evt.actor}</TableCell>
                      <TableCell>{evt.module}</TableCell>
                      <TableCell>{evt.event}</TableCell>
                      <TableCell>{evt.detail}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </AdminAuditLayout>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <Box className="flex flex-col gap-1">
      <Typography
        variant="caption"
        className="text-[11px] text-slate-500"
      >
        {label}
      </Typography>
      <Select
        size="small"
        value={value}
        onChange={onChange}
        fullWidth
        sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
      >
        {options.map((opt) => (
          <MenuItem key={opt} value={opt}>
            {opt}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
}
