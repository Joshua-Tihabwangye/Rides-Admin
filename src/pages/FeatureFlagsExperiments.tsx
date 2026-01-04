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
  TextField,
  Select,
  MenuItem,
} from "@mui/material";

// K1 – Feature Flags & Experiments (Light/Dark, EVzone themed)
// Route suggestion: /admin/system/flags
// Content list + editor pattern for feature flags and experiments.
//
// Manual test cases:
// 1) Initial render
//    - Light mode by default.
//    - Header shows EVZONE ADMIN and subtitle "System · Feature flags".
//    - Left card lists flags with columns: Name, Key, Status, Type.
//    - Right card shows an editor for the selected flag: name, key, module,
//      status, type and targeting segment.
// 2) Theme toggle
//    - Toggle Light/Dark; list and editor state stay intact.
// 3) Select flag
//    - Clicking a row selects it and updates the editor fields.
// 4) Edit & save
//    - Change Name/Status/Segment and click "Save flag"; expect a console
//      log and an AuditLog-style entry.
// 5) New flag
//    - Click "+ New flag"; editor clears to defaults; saving logs creation
//      for a new flag (demo only, no global persistence beyond the table).

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

function AdminFlagsLayout({ children }) {
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
            System · Feature flags
          </Typography>
        </Box>
        <Box className="flex items-center gap-2">
          <Chip
            size="small"
            label="Flags"
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
            Feature Flags & Experiments
          </Typography>
          <Typography
            variant="caption"
            className={`text-[11px] ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
          >
            Toggle features and run experiments per module, region and user
            segment.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col px-4 sm:px-6 pb-6 gap-3">
        {children}
      </Box>
    </Box>
  );
}

const INITIAL_FLAGS = [
  {
    id: 1,
    name: "New rides home screen",
    key: "rides.home.v2",
    module: "Rides",
    status: "On",
    type: "Feature",
    segment: "All users",
  },
  {
    id: 2,
    name: "Delivery price experiment",
    key: "delivery.pricing.ab",
    module: "Deliveries",
    status: "Running",
    type: "Experiment",
    segment: "10% random",
  },
  {
    id: 3,
    name: "EV-only banner",
    key: "global.evOnlyBanner",
    module: "Global",
    status: "Off",
    type: "Feature",
    segment: "All users",
  },
];

export default function FeatureFlagsExperimentsPage() {
  const [flags, setFlags] = useState(INITIAL_FLAGS);
  const [selectedId, setSelectedId] = useState(INITIAL_FLAGS[0]?.id || null);
  const [editing, setEditing] = useState({ ...INITIAL_FLAGS[0] });

  const selectedFlag = flags.find((f) => f.id === selectedId) || flags[0] || null;

  const syncEditingWithSelected = (flag) => {
    if (!flag) return;
    setEditing({ ...flag });
  };

  const handleRowClick = (flag) => {
    setSelectedId(flag.id);
    syncEditingWithSelected(flag);
  };

  const handleNewFlag = () => {
    const draft = {
      id: null,
      name: "",
      key: "",
      module: "Global",
      status: "Off",
      type: "Feature",
      segment: "All users",
    };
    setSelectedId(null);
    setEditing(draft);
  };

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setEditing((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!editing.key.trim()) return;

    if (editing.id == null) {
      const nextId = flags.length ? Math.max(...flags.map((f) => f.id)) + 1 : 1;
      const newFlag = { ...editing, id: nextId };
      setFlags((prev) => [...prev, newFlag]);
      setSelectedId(nextId);
      console.log("Feature flag created:", newFlag);
      console.log("AuditLog:", {
        event: "FLAG_CREATED",
        flagId: nextId,
        key: newFlag.key,
        at: new Date().toISOString(),
        actor: "Admin (simulated)",
      });
    } else {
      setFlags((prev) => prev.map((f) => (f.id === editing.id ? { ...editing } : f)));
      console.log("Feature flag updated:", editing);
      console.log("AuditLog:", {
        event: "FLAG_UPDATED",
        flagId: editing.id,
        key: editing.key,
        at: new Date().toISOString(),
        actor: "Admin (simulated)",
      });
    }
  };

  return (
    <AdminFlagsLayout>
      <Box className="flex flex-col lg:flex-row gap-4">
        {/* Left – flags list */}
        <Card
          elevation={1}
          sx={{
            flex: 1,
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.5)",
            background: "linear-gradient(145deg, #f9fafb, #ffffff)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Box className="flex items-center justify-between gap-2">
              <Typography
                variant="subtitle2"
                className="font-semibold text-slate-900"
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
                  <TableRow sx={{ backgroundColor: "#f3f4f6" }}>
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
                      onClick={() => handleRowClick(flag)}
                    >
                      <TableCell>{flag.name}</TableCell>
                      <TableCell>{flag.key}</TableCell>
                      <TableCell>{flag.status}</TableCell>
                      <TableCell>{flag.type}</TableCell>
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
            background: "linear-gradient(145deg, #e0f2fe, #ffffff)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Typography
              variant="subtitle2"
              className="font-semibold text-slate-900"
            >
              Flag editor
            </Typography>
            <Divider className="!my-1" />

            <Box className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <FieldWithLabel label="Name">
                <TextField
                  size="small"
                  fullWidth
                  value={editing.name}
                  onChange={handleFieldChange("name")}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
                />
              </FieldWithLabel>
              <FieldWithLabel label="Key">
                <TextField
                  size="small"
                  fullWidth
                  value={editing.key}
                  onChange={handleFieldChange("key")}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
                />
              </FieldWithLabel>
              <FieldWithLabel label="Module">
                <Select
                  size="small"
                  fullWidth
                  value={editing.module}
                  onChange={handleFieldChange("module")}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
                >
                  <MenuItem value="Global">Global</MenuItem>
                  <MenuItem value="Rides">Rides</MenuItem>
                  <MenuItem value="Deliveries">Deliveries</MenuItem>
                  <MenuItem value="Finance">Finance</MenuItem>
                </Select>
              </FieldWithLabel>
              <FieldWithLabel label="Status">
                <Select
                  size="small"
                  fullWidth
                  value={editing.status}
                  onChange={handleFieldChange("status")}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
                >
                  <MenuItem value="On">On</MenuItem>
                  <MenuItem value="Off">Off</MenuItem>
                  <MenuItem value="Running">Running</MenuItem>
                </Select>
              </FieldWithLabel>
              <FieldWithLabel label="Type">
                <Select
                  size="small"
                  fullWidth
                  value={editing.type}
                  onChange={handleFieldChange("type")}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
                >
                  <MenuItem value="Feature">Feature</MenuItem>
                  <MenuItem value="Experiment">Experiment</MenuItem>
                </Select>
              </FieldWithLabel>
              <FieldWithLabel label="Segment">
                <Select
                  size="small"
                  fullWidth
                  value={editing.segment}
                  onChange={handleFieldChange("segment")}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
                >
                  <MenuItem value="All users">All users</MenuItem>
                  <MenuItem value="Beta users">Beta users</MenuItem>
                  <MenuItem value="10% random">10% random</MenuItem>
                </Select>
              </FieldWithLabel>
            </Box>

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
