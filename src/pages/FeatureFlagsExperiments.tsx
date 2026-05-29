import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { listAdminFeatureFlags, patchAdminFeatureFlag } from "../services/api/adminApi";
import type { AdminFeatureFlagResponse } from "../services/api/adminApi";

const EV_COLORS = {
  primary: "#03cd8c",
};

function AdminFlagsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography variant="h6" className="font-semibold tracking-tight" color="text.primary">
            Feature Flags & Experiments
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Toggle backend feature flags per module and scope.
          </Typography>
        </Box>
      </Box>
      <Box className="flex-1 flex flex-col gap-3">{children}</Box>
    </Box>
  );
}

export default function FeatureFlagsExperimentsPage() {
  const [flags, setFlags] = useState<AdminFeatureFlagResponse[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<AdminFeatureFlagResponse>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const selectedFlag = useMemo(() => flags.find((f) => f.id === selectedId) || null, [flags, selectedId]);

  const fetchFlags = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminFeatureFlags();
      setFlags(data);
      if (data.length > 0) {
        const current = selectedId ? data.find((item) => item.id === selectedId) : data[0];
        if (current) {
          setSelectedId(current.id);
          setEditing(current);
        }
      }
    } catch (err: any) {
      setError(err?.message ?? "Failed to load feature flags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchFlags();
  }, []);

  const handleFieldChange =
    (field: keyof AdminFeatureFlagResponse) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
      const value = event.target.value;
      setEditing((prev) => ({ ...prev, [field]: value }));
    };

  const handleToggleEnabled = () => {
    setEditing((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  const handleSave = async () => {
    if (!editing.id || !editing.key) return;

    setSaving(true);
    try {
      await patchAdminFeatureFlag(editing.key, {
        enabled: Boolean(editing.enabled),
        scope: String(editing.scope ?? "global"),
        description: String(editing.description ?? ""),
      });
      setSnackbarOpen(true);
      await fetchFlags();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save flag");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <AdminFlagsLayout>
      <Box className="flex flex-col lg:flex-row gap-4">
        <Card elevation={1} sx={{ flex: 1, borderRadius: 8, border: "1px solid rgba(148,163,184,0.5)" }}>
          <CardContent className="p-4 flex flex-col gap-3">
            <Typography variant="subtitle2" className="font-semibold">
              Flags
            </Typography>
            <Divider className="!my-1" />

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "action.hover" }}>
                    <TableCell>Name</TableCell>
                    <TableCell>Key</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Scope</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {flags.map((flag) => (
                    <TableRow
                      key={flag.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      selected={flag.id === selectedId}
                      onClick={() => {
                        setSelectedId(flag.id);
                        setEditing({ ...flag });
                      }}
                    >
                      <TableCell>{flag.description || flag.key}</TableCell>
                      <TableCell>{flag.key}</TableCell>
                      <TableCell>
                        <Chip label={flag.enabled ? "On" : "Off"} size="small" color={flag.enabled ? "success" : "default"} />
                      </TableCell>
                      <TableCell>{flag.scope}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        <Card elevation={1} sx={{ flex: 1.3, borderRadius: 8, border: "1px solid rgba(148,163,184,0.5)" }}>
          <CardContent className="p-4 flex flex-col gap-3">
            <Typography variant="subtitle2" className="font-semibold">
              Flag editor
            </Typography>
            <Divider className="!my-1" />

            {selectedFlag ? (
              <Box className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <FieldWithLabel label="Name">
                  <TextField size="small" fullWidth value={editing.description || ""} onChange={handleFieldChange("description")} />
                </FieldWithLabel>
                <FieldWithLabel label="Key">
                  <TextField size="small" fullWidth value={editing.key || ""} disabled />
                </FieldWithLabel>
                <FieldWithLabel label="Scope">
                  <Select size="small" fullWidth value={editing.scope || "global"} onChange={handleFieldChange("scope")}>
                    <MenuItem value="global">Global</MenuItem>
                    <MenuItem value="rider">Rider</MenuItem>
                    <MenuItem value="driver">Driver</MenuItem>
                    <MenuItem value="fleet">Fleet</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FieldWithLabel>
                <FieldWithLabel label="Status">
                  <Button fullWidth size="small" variant={editing.enabled ? "contained" : "outlined"} onClick={handleToggleEnabled} sx={{ textTransform: "none" }}>
                    {editing.enabled ? "Enabled" : "Disabled"}
                  </Button>
                </FieldWithLabel>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No flag selected.
              </Typography>
            )}

            <Box className="flex items-center justify-end gap-2 mt-2">
              <Button
                variant="contained"
                size="small"
                disabled={!selectedFlag || saving}
                sx={{ textTransform: "none", borderRadius: 999, fontSize: 12, bgcolor: EV_COLORS.primary, "&:hover": { bgcolor: "#0fb589" } }}
                onClick={handleSave}
              >
                {saving ? "Saving..." : "Save flag"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)}>
        <Alert severity="success" onClose={() => setSnackbarOpen(false)}>
          Flag saved successfully.
        </Alert>
      </Snackbar>
    </AdminFlagsLayout>
  );
}

function FieldWithLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box className="flex flex-col gap-1">
      <Typography variant="caption" className="text-[11px] text-slate-500">
        {label}
      </Typography>
      {children}
    </Box>
  );
}
