// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { isAdminBackendEnabled, listAdminAuditEvents } from "../services/api/adminApi";

function AdminAuditLayout({ children }) {
  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography variant="h6" className="font-semibold tracking-tight" color="text.primary">
            Audit Log
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Track critical admin actions and change history.
          </Typography>
        </Box>
      </Box>
      <Box className="flex-1 flex flex-col gap-3">{children}</Box>
    </Box>
  );
}

export default function AuditLogPage() {
  const backendMode = isAdminBackendEnabled();
  const [filters, setFilters] = useState({ module: "All", actor: "All", range: "24h" });
  const [backendEvents, setBackendEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!backendMode) {
      setBackendEvents([]);
      return;
    }

    setLoading(true);
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
    } catch {
      setBackendEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [backendMode]);

  const filteredEvents = useMemo(
    () =>
      backendEvents.filter((evt) => {
        if (filters.module !== "All" && evt.module !== filters.module) return false;
        if (filters.actor !== "All" && evt.actor !== filters.actor) return false;
        return true;
      }),
    [backendEvents, filters.actor, filters.module],
  );

  return (
    <AdminAuditLayout>
      <Card elevation={1} sx={{ borderRadius: 8, border: "1px solid rgba(148,163,184,0.5)" }}>
        <CardContent className="p-4 flex flex-col gap-3">
          <Box className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <FilterSelect
              label="Module"
              value={filters.module}
              onChange={(event) => setFilters((prev) => ({ ...prev, module: event.target.value }))}
              options={["All", "Training", "Pricing", "Finance", "System", "Risk"]}
            />
            <FilterSelect
              label="Actor"
              value={filters.actor}
              onChange={(event) => setFilters((prev) => ({ ...prev, actor: event.target.value }))}
              options={["All", ...Array.from(new Set(backendEvents.map((item) => item.actor)))]}
            />
            <FilterSelect
              label="Range"
              value={filters.range}
              onChange={(event) => setFilters((prev) => ({ ...prev, range: event.target.value }))}
              options={["24h", "7d", "30d"]}
            />
          </Box>

          <Box className="flex items-center justify-between mt-2">
            <Typography variant="caption" className="text-[11px] text-slate-500">
              Showing {filteredEvents.length} event(s){backendMode ? " from backend" : " (backend mode disabled)"}.
            </Typography>
            <Button variant="outlined" size="small" sx={{ textTransform: "none", borderRadius: 999, fontSize: 11 }} onClick={() => void load()}>
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card elevation={1} sx={{ borderRadius: 8, border: "1px solid rgba(148,163,184,0.5)" }}>
        <CardContent className="p-4 flex flex-col gap-2">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "action.hover" }}>
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
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      No audit events found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((evt) => (
                    <TableRow key={evt.id} hover>
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
      <Typography variant="caption" className="text-[11px] text-slate-500">
        {label}
      </Typography>
      <Select size="small" value={value} onChange={onChange} fullWidth>
        {options.map((opt) => (
          <MenuItem key={opt} value={opt}>
            {opt}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
}
