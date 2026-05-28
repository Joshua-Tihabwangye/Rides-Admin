// @ts-nocheck
import React, { useState } from"react";
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
} from"@mui/material";
import { isAdminBackendEnabled, listAdminAuditEvents } from "../services/api/adminApi";

// K3 – Audit Log (Light/Dark, EVzone themed)
// Route suggestion: /admin/system/audit-log
// Displays a list of audit events (mutating actions from the Admin Portal).
// Filters by module, actor and date range.
//
// Manual test cases:
// 1) Initial render
//    - Light mode by default.
//    - Header shows EVZONE ADMIN and subtitle"System · Audit log".
//    - Title"Audit Log" visible, with a short description.
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
  primary:"#03cd8c",
  secondary:"#f77f00",
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

export default function AuditLogPage() {
  const backendMode = isAdminBackendEnabled();
  const [filters, setFilters] = useState({
    module:"All",
    actor:"All",
    range:"24h",
  });

  const [backendEvents, setBackendEvents] = useState<any[]>([]);

  React.useEffect(() => {
    const load = async () => {
      if (!backendMode) return;
      try {
        const items = await listAdminAuditEvents();
        setBackendEvents(
          items.map((item) => ({
            id: item.id,
            at: new Date(item.createdAt).toLocaleString(),
            actor: item.actorId,
            module: item.resource,
            event: item.action,
            detail: item.resourceId,
          })),
        );
      } catch (error) {
        console.warn("Failed to load backend audit events.", error);
        setBackendEvents([]);
      }
    };

    void load();
  }, [backendMode]);

  const eventsForTable = backendMode ? backendEvents : [];
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
    if (filters.module !=="All" && evt.module !== filters.module) return false;
    if (filters.actor !=="All" && evt.actor !== filters.actor) return false;
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
          border:"1px solid rgba(148,163,184,0.5)",
          
        }}
      >
        <CardContent className="p-4 flex flex-col gap-3">
          <Box className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <FilterSelect
              label="Module"
              value={filters.module}
              onChange={handleFilterChange("module")}
              options={["All","Training","Pricing","Finance","System","Risk",
              ]}
            />
            <FilterSelect
              label="Actor"
              value={filters.actor}
              onChange={handleFilterChange("actor")}
              options={["All","Alex Admin","Maria Mobility","Felix Finance","RiskBot"]}
            />
            <FilterSelect
              label="Range"
              value={filters.range}
              onChange={handleFilterChange("range")}
              options={["24h","7d","30d"]}
            />
          </Box>
          <Box className="flex items-center justify-between mt-2">
            <Typography variant="caption" className="text-[11px] text-slate-500">
              Showing {filteredEvents.length} event(s){
                backendMode ? " from backend" : " (backend mode disabled)"
              }.
            </Typography>
            <Button
              variant="outlined"
              size="small"
              sx={{ textTransform:"none", borderRadius: 999, fontSize: 11 }}
              onClick={() => {
                setBackendEvents([]);
              }}
            >
              {backendEvents.length > 0 ? "Clear view" : "Refresh needed"}
            </Button>
          </Box>

        </CardContent>
      </Card>

      {/* Events table */}
      <Card
        elevation={1}
        sx={{
          borderRadius: 8,
          border:"1px solid rgba(148,163,184,0.5)",
          
        }}
      >
        <CardContent className="p-4 flex flex-col gap-2">
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
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
                      sx={{ cursor:"pointer" }}
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
        sx={{"& .MuiOutlinedInput-root": {  } }}
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
