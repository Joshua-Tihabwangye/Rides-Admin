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

// J1 – Global Training Manager (Light/Dark, EVzone themed)
// Route suggestion: /admin/training
// Content list + editor pattern for training modules (Drivers, Agents,
// Companies). Mirrors the same structure used in localization and feature
// flags.
//
// Manual test cases:
// 1) Initial render
//    - Light mode by default.
//    - Header shows EVZONE ADMIN and subtitle "Training · Global manager".
//    - Title "Global Training Manager" visible.
//    - Left card lists sample training modules with columns: Title, Audience,
//      Status, Language.
//    - Right card shows the selected module's title, type, language and
//      description in editable fields.
// 2) Theme toggle
//    - Toggle Light/Dark; list and editor state remain intact.
// 3) Select module
//    - Clicking a row in the module table selects it and updates the editor
//      fields accordingly.
// 4) Edit & save
//    - Change Title/Type/Language/Description and click "Save module".
//    - Expect a console log with the updated module and an AuditLog-style
//      entry (simulated).
// 5) New module
//    - Click "+ New module"; editor should clear to defaults and selecting
//      "Save" logs creation for a new module id (demo only, no full list
//      persistence).

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

function AdminTrainingLayout({ children }) {
  const [mode, setMode] = useState("light");
  const isDark = mode === "dark";

  const toggleMode = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <Box
      className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? "bg-slate-950 text-slate-50" : "bg-slate-50 text-slate-900"
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
            className={`tracking-[0.25em] uppercase text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"
              }`}
          >
            EVZONE ADMIN
          </Typography>
          <Typography
            variant="caption"
            className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"
              }`}
          >
            Training · Global manager
          </Typography>
        </Box>
        <Box className="flex items-center gap-2">
          <Chip
            size="small"
            label="Training"
            sx={{
              bgcolor: "#ecfdf5",
              borderColor: "#bbf7d0",
              color: "#14532d",
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
            className={`font-semibold tracking-tight ${isDark ? "text-slate-50" : "text-slate-900"
              }`}
          >
            Global Training Manager
          </Typography>
          <Typography
            variant="caption"
            className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"
              }`}
          >
            Create and manage training modules for Drivers, Agents and
            Companies across regions.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col px-4 sm:px-6 pb-6 gap-3">
        {children}
      </Box>
    </Box>
  );
}

const INITIAL_MODULES = [
  {
    id: 1,
    title: "Driver onboarding 101",
    audience: "Drivers",
    status: "Published",
    language: "en",
    description: "Core onboarding for new EV drivers.",
  },
  {
    id: 2,
    title: "Safety & SOS procedures",
    audience: "Drivers",
    status: "Draft",
    language: "en",
    description: "How to handle emergencies and SOS events.",
  },
  {
    id: 3,
    title: "Agent ticket handling",
    audience: "Agents",
    status: "Published",
    language: "en",
    description: "Guidelines for agents handling rider/driver tickets.",
  },
];

export default function GlobalTrainingManagerPage() {
  const navigate = useNavigate();
  const [modules, setModules] = useState(INITIAL_MODULES);
  const [selectedId, setSelectedId] = useState(INITIAL_MODULES[0]?.id || null);
  const [editing, setEditing] = useState(() => ({ ...INITIAL_MODULES[0] }));

  const selectedModule =
    modules.find((m) => m.id === selectedId) || modules[0] || null;

  const syncEditingWithSelected = (module) => {
    if (!module) return;
    setEditing({ ...module });
  };

  const handleRowClick = (module) => {
    setSelectedId(module.id);
    syncEditingWithSelected(module);
  };

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setEditing((prev) => ({ ...prev, [field]: value }));
  };

  const handleNewModule = () => {
    const draft = {
      id: null,
      title: "",
      audience: "Drivers",
      status: "Draft",
      language: "en",
      description: "",
    };
    setSelectedId(null);
    setEditing(draft);
  };

  const handleSave = () => {
    if (!editing.title.trim()) return;

    if (editing.id == null) {
      // Create new
      const nextId = modules.length
        ? Math.max(...modules.map((m) => m.id)) + 1
        : 1;
      const newModule = { ...editing, id: nextId };
      const nextModules = [...modules, newModule];
      setModules(nextModules);
      setSelectedId(nextId);
      console.log("Training module created:", newModule);
      console.log("AuditLog:", {
        event: "TRAINING_MODULE_CREATED",
        moduleId: nextId,
        title: newModule.title,
        at: new Date().toISOString(),
        actor: "Admin (simulated)",
      });
    } else {
      // Update existing
      const nextModules = modules.map((m) =>
        m.id === editing.id ? { ...editing } : m
      );
      setModules(nextModules);
      setSelectedId(editing.id);
      console.log("Training module updated:", editing);
      console.log("AuditLog:", {
        event: "TRAINING_MODULE_UPDATED",
        moduleId: editing.id,
        title: editing.title,
        at: new Date().toISOString(),
        actor: "Admin (simulated)",
      });
    }
  };

  return (
    <AdminTrainingLayout>
      <Box className="flex flex-col lg:flex-row gap-4">
        {/* Left – module list */}
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
                Modules
              </Typography>
              <Button
                variant="outlined"
                size="small"
                sx={{
                  textTransform: "none",
                  borderRadius: 999,
                  fontSize: 11,
                }}
                onClick={handleNewModule}
              >
                + New module
              </Button>
            </Box>
            <Divider className="!my-1" />

            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f3f4f6" }}>
                    <TableCell>Title</TableCell>
                    <TableCell>Audience</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Language</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modules.map((module) => (
                    <TableRow
                      key={module.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      selected={module.id === selectedId}
                      onClick={() => handleRowClick(module)}
                    >
                      <TableCell>{module.title}</TableCell>
                      <TableCell>{module.audience}</TableCell>
                      <TableCell>{module.status}</TableCell>
                      <TableCell>{module.language}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography
              variant="caption"
              className="text-[11px] text-slate-500 mt-1"
            >
              Training modules appear in Driver/Agent/Company apps based on
              their audience and status.
            </Typography>
          </CardContent>
        </Card>

        {/* Right – module editor */}
        <Card
          elevation={1}
          sx={{
            flex: 1.3,
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.5)",
            background: "linear-gradient(145deg, #eef2ff, #ffffff)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Typography
              variant="subtitle2"
              className="font-semibold text-slate-900"
            >
              Module editor
            </Typography>
            <Divider className="!my-1" />

            <Box className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Box className="flex flex-col gap-1">
                <Typography
                  variant="caption"
                  className="text-[11px] text-slate-500"
                >
                  Title
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={editing.title}
                  onChange={handleFieldChange("title")}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
                />
              </Box>
              <Box className="flex flex-col gap-1">
                <Typography
                  variant="caption"
                  className="text-[11px] text-slate-500"
                >
                  Audience
                </Typography>
                <Select
                  size="small"
                  fullWidth
                  value={editing.audience}
                  onChange={handleFieldChange("audience")}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
                >
                  <MenuItem value="Drivers">Drivers</MenuItem>
                  <MenuItem value="Agents">Agents</MenuItem>
                  <MenuItem value="Companies">Companies</MenuItem>
                </Select>
              </Box>
              <Box className="flex flex-col gap-1">
                <Typography
                  variant="caption"
                  className="text-[11px] text-slate-500"
                >
                  Status
                </Typography>
                <Select
                  size="small"
                  fullWidth
                  value={editing.status}
                  onChange={handleFieldChange("status")}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
                >
                  <MenuItem value="Draft">Draft</MenuItem>
                  <MenuItem value="Published">Published</MenuItem>
                </Select>
              </Box>
              <Box className="flex flex-col gap-1">
                <Typography
                  variant="caption"
                  className="text-[11px] text-slate-500"
                >
                  Language
                </Typography>
                <Select
                  size="small"
                  fullWidth
                  value={editing.language}
                  onChange={handleFieldChange("language")}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="fr">French</MenuItem>
                  <MenuItem value="sw">Swahili</MenuItem>
                </Select>
              </Box>
            </Box>

            <Box className="flex flex-col gap-1">
              <Typography
                variant="caption"
                className="text-[11px] text-slate-500"
              >
                Description
              </Typography>
              <TextField
                size="small"
                multiline
                fullWidth
                minRows={3}
                maxRows={5}
                value={editing.description}
                onChange={handleFieldChange("description")}
                sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
              />
            </Box>

            <Box className="flex items-center justify-between mt-4 border-t pt-4">
              <Button
                variant="text"
                size="small"
                sx={{ textTransform: 'none', color: 'text.secondary' }}
                onClick={() => {
                  if (!editing.title) return;
                  navigate(`/admin/training/preview?title=${encodeURIComponent(editing.title)}&desc=${encodeURIComponent(editing.description)}`)
                }}
              >
                Preview as User
              </Button>
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
                Save module
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </AdminTrainingLayout>
  );
}
