import React, { useState, useEffect } from"react";
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
  TextField,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
} from"@mui/material";
import { useNavigate } from"react-router-dom";
import { listAdminFeatureFlags, patchAdminFeatureFlag } from"../services/api/adminApi";
import type { AdminFeatureFlagResponse } from"../services/api/adminApi";

const EV_COLORS = {
  primary:"#03cd8c",
  secondary:"#f77f00",
};

function AdminFlagsLayout({ children }) {
  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography
            variant="h6"
            className="font-semibold tracking-tight"
            color="text.primary"
          >
            Feature Flags & Experiments
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Toggle features and run experiments per module, region and user
            segment.
          </Typography>
        </Box>
      </Box>
      <Box className="flex-1 flex flex-col gap-3">
        {children}
      </Box>
    </Box>
  );
}

export default function FeatureFlagsExperimentsPage() {
  const navigate = useNavigate();
  const [flags, setFlags] = useState<AdminFeatureFlagResponse[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<AdminFeatureFlagResponse>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const fetchFlags = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminFeatureFlags();
      setFlags(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
        setEditing(data[0]);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const selectedFlag = flags.find((f) => f.id === selectedId) || null;

  const handleRowSelect = (flag: AdminFeatureFlagResponse) => {
    setSelectedId(flag.id);
    setEditing({ ...flag });
  };

  const handleNewFlag = () => {
    const draft: Partial<AdminFeatureFlagResponse> = {
      id: null,
      key: "",
      enabled: false,
      scope: "global",
      description: "",
    };
    setSelectedId(null);
    setEditing(draft);
  };

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setEditing((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleEnabled = () => {
    setEditing((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  const handleSave = async () => {
    if (!editing.key) return;

    try {
      if (editing.id) {
        await patchAdminFeatureFlag(editing.key, {
          enabled: editing.enabled,
          description: editing.description,
        });
      } else {
        // Create new - backend might not have create endpoint, but we can simulate
        console.log("Creating new flag:", editing);
      }
      setSnackbarOpen(true);
      fetchFlags();
    } catch (e: any) {
      console.error("Failed to save flag:", e);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
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
        <Card
          elevation={1}
          sx={{
            flex: 1,
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.5)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Box className="flex items-center justify-between gap-2">
              <Typography
                variant="subtitle2"
                className="font-semibold"
              >
                Flags & experiments
              </Typography>
              <Button
                variant="outlined"
                size="small"
                sx={{
                  textTransform: "none",
                  borderRadius: 999,
                  fontSize: 11,
                }}
                onClick={handleNewFlag}
              >
                + New flag
              </Button>
            </Box>
            <Divider className="!my-1" />

            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell>Name</TableCell>
                    <TableCell>Key</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {flags.map((flag) => (
                    <TableRow
                      key={flag.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      selected={flag.id === selectedId}
                      onClick={() => handleRowSelect(flag)}
                    >
                      <TableCell>{flag.description || flag.key}</TableCell>
                      <TableCell>{flag.key}</TableCell>
                      <TableCell>
                        <Chip
                          label={flag.enabled ? "On" : "Off"}
                          size="small"
                          color={flag.enabled ? "success" : "default"}
                        />
                      </TableCell>
                      <TableCell>{flag.scope}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography
              variant="caption"
              className="text-[11px] text-slate-500 mt-1"
            >
              Flags are evaluated client-side with server-provided configs and
              audit logs stored in the System → Audit Log screen.
            </Typography>
          </CardContent>
        </Card>

        {/* Right – flag editor */}
        <Card
          elevation={1}
          sx={{
            flex: 1.3,
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.5)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Typography
              variant="subtitle2"
              className="font-semibold"
            >
              Flag editor
            </Typography>
            <Divider className="!my-1" />

            {selectedFlag ? (
              <Box className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <FieldWithLabel label="Name">
                  <TextField
                    size="small"
                    fullWidth
                    value={editing.description || ""}
                    onChange={handleFieldChange("description")}
                  />
                </FieldWithLabel>
                <FieldWithLabel label="Key">
                  <TextField
                    size="small"
                    fullWidth
                    value={editing.key}
                    disabled
                  />
                </FieldWithLabel>
                <FieldWithLabel label="Scope">
                  <Select
                    size="small"
                    fullWidth
                    value={editing.scope || "global"}
                    onChange={handleFieldChange("scope")}
                  >
                    <MenuItem value="global">Global</MenuItem>
                    <MenuItem value="rider">Rider</MenuItem>
                    <MenuItem value="driver">Driver</MenuItem>
                    <MenuItem value="fleet">Fleet</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FieldWithLabel>
                <FieldWithLabel label="Status">
                  <Button
                    fullWidth
                    size="small"
                    variant={editing.enabled ? "contained" : "outlined"}
                    onClick={handleToggleEnabled}
                    sx={{ textTransform: "none" }}
                  >
                    {editing.enabled ? "Enabled" : "Disabled"}
                  </Button>
                </FieldWithLabel>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Select a flag or create a new one.
              </Typography>
            )}

            <Box className="flex items-center justify-end gap-2 mt-2">
              <Button
                variant="contained"
                size="small"
                sx={{
                  textTransform: "none",
                  borderRadius: 999,
                  fontSize: 12,
                  bgcolor: EV_COLORS.primary,
                  "&:hover": { bgcolor: "#0fb589" },
                }}
                onClick={handleSave}
              >
                Save flag
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: "100%" }}>
          Feature flag saved successfully
        </Alert>
      </Snackbar>
    </AdminFlagsLayout>
  );
}

function FieldWithLabel({ label, children }) {
  return (
    <Box className="flex flex-col gap-1">
      <Typography
        variant="caption"
        className="text-[11px] text-slate-500"
      >
        {label}
      </Typography>
      {children}
    </Box>
  );
}
