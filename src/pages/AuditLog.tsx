import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
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
import type { SelectChangeEvent } from "@mui/material/Select";
import { isAdminBackendEnabled, listAdminAuditEvents, type AdminAuditEventResponse } from "../services/api/adminApi";

type AuditFilterState = {
  module: string;
  actor: string;
  range: "24h" | "7d" | "30d";
};

type AuditEventRow = {
  id: string;
  at: string;
  timestamp: number;
  actor: string;
  module: string;
  event: string;
  detail: string;
};

function AdminAuditLayout({ children }: { children: React.ReactNode }) {
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

function formatAuditTime(value: number) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

function mapAuditEvent(item: AdminAuditEventResponse): AuditEventRow {
  return {
    id: item.id,
    at: formatAuditTime(item.createdAt),
    timestamp: item.createdAt,
    actor: item.actorId || "Unknown",
    module: item.resource || "Unknown",
    event: item.action || "Unknown action",
    detail: item.resourceId || "n/a",
  };
}

function rangeCutoff(range: AuditFilterState["range"]) {
  const now = Date.now();
  if (range === "7d") return now - 7 * 24 * 60 * 60 * 1000;
  if (range === "30d") return now - 30 * 24 * 60 * 60 * 1000;
  return now - 24 * 60 * 60 * 1000;
}

export default function AuditLogPage() {
  const backendMode = isAdminBackendEnabled();
  const [filters, setFilters] = useState<AuditFilterState>({ module: "All", actor: "All", range: "24h" });
  const [backendEvents, setBackendEvents] = useState<AuditEventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!backendMode) {
      setBackendEvents([]);
      setError("Admin backend mode is disabled, so audit events cannot be loaded.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const items = await listAdminAuditEvents();
      setBackendEvents(items.map(mapAuditEvent));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load audit events");
    } finally {
      setLoading(false);
    }
  }, [backendMode]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredEvents = useMemo(() => {
    const cutoff = rangeCutoff(filters.range);
    return backendEvents.filter((evt) => {
      if (evt.timestamp < cutoff) return false;
      if (filters.module !== "All" && evt.module !== filters.module) return false;
      if (filters.actor !== "All" && evt.actor !== filters.actor) return false;
      return true;
    });
  }, [backendEvents, filters.actor, filters.module, filters.range]);

  const modules = useMemo(() => ["All", ...Array.from(new Set(backendEvents.map((item) => item.module)))], [backendEvents]);
  const actors = useMemo(() => ["All", ...Array.from(new Set(backendEvents.map((item) => item.actor)))], [backendEvents]);

  return (
    <AdminAuditLayout>
      {error ? (
        <Alert
          severity={backendMode ? "error" : "warning"}
          action={
            backendMode ? (
              <Button color="inherit" size="small" onClick={() => void load()}>
                Retry
              </Button>
            ) : undefined
          }
        >
          {error}
        </Alert>
      ) : null}

      <Card elevation={1} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.5)" }}>
        <CardContent className="p-4 flex flex-col gap-3">
          <Box className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <FilterSelect
              label="Module"
              value={filters.module}
              onChange={(value) => setFilters((prev) => ({ ...prev, module: value }))}
              options={modules}
            />
            <FilterSelect
              label="Actor"
              value={filters.actor}
              onChange={(value) => setFilters((prev) => ({ ...prev, actor: value }))}
              options={actors}
            />
            <FilterSelect
              label="Range"
              value={filters.range}
              onChange={(value) => setFilters((prev) => ({ ...prev, range: value as AuditFilterState["range"] }))}
              options={["24h", "7d", "30d"]}
            />
          </Box>

          <Box className="flex items-center justify-between mt-2">
            <Typography variant="caption" className="text-[11px] text-slate-500">
              Showing {filteredEvents.length} event(s) from backend.
            </Typography>
            <Button
              variant="outlined"
              size="small"
              sx={{ textTransform: "none", borderRadius: 999, fontSize: 11 }}
              disabled={loading || !backendMode}
              onClick={() => void load()}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card elevation={1} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.5)" }}>
        <CardContent className="p-4 flex flex-col gap-2">
          {loading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 3 }}>
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">
                Loading audit events...
              </Typography>
            </Box>
          ) : (
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
                        No audit events match the selected filters.
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
          )}
        </CardContent>
      </Card>
    </AdminAuditLayout>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <Box className="flex flex-col gap-1">
      <Typography variant="caption" className="text-[11px] text-slate-500">
        {label}
      </Typography>
      <Select
        size="small"
        value={value}
        onChange={(event: SelectChangeEvent<string>) => onChange(event.target.value)}
        fullWidth
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
