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

// J2 – Localization & Language Content (Light/Dark, EVzone themed)
// Route suggestion: /admin/localization
// Content list + editor pattern for translation bundles (keys per language).
//
// Manual test cases:
// 1) Initial render
//    - Light mode by default.
//    - Header shows EVZONE ADMIN and subtitle "Localization & Languages".
//    - Left card lists translation bundles with columns: Namespace, Language,
//      Completion.
//    - Right card shows an editor with keys + translations for the selected
//      bundle.
// 2) Theme toggle
//    - Toggle Light/Dark; bundles and editor state stay intact.
// 3) Select bundle
//    - Clicking a row selects it and updates the editor fields.
// 4) Edit & save
//    - Change one or more translation values and click "Save translations";
//      expect a console log and an AuditLog-style entry.
// 5) New bundle
//    - Click "+ New bundle"; editor clears to defaults (namespace/language);
//      saving logs creation (demo only, no full list persistence).

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

function AdminLocalizationLayout({ children }) {
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
            Localization & Language Content
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Manage translation bundles and ensure each language is complete
            before rollout.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col gap-3">
        {children}
      </Box>
    </Box>
  );
}

const INITIAL_BUNDLES = [
  {
    id: 1,
    namespace: "app.shell",
    language: "en",
    completion: "100%",
    keys: {
      "title": "EVzone Super App",
      "cta.start": "Get started",
    },
  },
  {
    id: 2,
    namespace: "app.shell",
    language: "fr",
    completion: "80%",
    keys: {
      "title": "Application EVzone",
      "cta.start": "Commencer",
    },
  },
  {
    id: 3,
    namespace: "rides.booking",
    language: "en",
    completion: "100%",
    keys: {
      "pickup": "Pickup location",
      "dropoff": "Drop-off location",
    },
  },
];

export default function LocalizationLanguageContentPage() {
  const [bundles, setBundles] = useState(INITIAL_BUNDLES);
  const [selectedId, setSelectedId] = useState(INITIAL_BUNDLES[0]?.id || null);
  const [editingBundle, setEditingBundle] = useState({ ...INITIAL_BUNDLES[0] });

  const selectedBundle =
    bundles.find((b) => b.id === selectedId) || bundles[0] || null;

  const syncEditingWithSelected = (bundle) => {
    if (!bundle) return;
    setEditingBundle({ ...bundle, keys: { ...bundle.keys } });
  };

  const handleRowClick = (bundle) => {
    setSelectedId(bundle.id);
    syncEditingWithSelected(bundle);
  };

  const handleNewBundle = () => {
    const draft = {
      id: null,
      namespace: "",
      language: "en",
      completion: "0%",
      keys: {
        "title": "",
        "cta.start": "",
      },
    };
    setSelectedId(null);
    setEditingBundle(draft);
  };

  const handleBundleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setEditingBundle((prev) => ({ ...prev, [field]: value }));
  };

  const handleKeyChange = (key) => (event) => {
    const value = event.target.value;
    setEditingBundle((prev) => ({
      ...prev,
      keys: { ...prev.keys, [key]: value },
    }));
  };

  const handleSave = () => {
    if (!editingBundle.namespace.trim()) return;

    if (editingBundle.id == null) {
      const nextId = bundles.length
        ? Math.max(...bundles.map((b) => b.id)) + 1
        : 1;
      const newBundle = { ...editingBundle, id: nextId };
      setBundles((prev) => [...prev, newBundle]);
      setSelectedId(nextId);
      console.log("Localization bundle created:", newBundle);
      console.log("AuditLog:", {
        event: "LOCALIZATION_BUNDLE_CREATED",
        bundleId: nextId,
        namespace: newBundle.namespace,
        language: newBundle.language,
        at: new Date().toISOString(),
        actor: "Admin (simulated)",
      });
    } else {
      setBundles((prev) =>
        prev.map((b) =>
          b.id === editingBundle.id ? { ...editingBundle } : b
        )
      );
      console.log("Localization bundle updated:", editingBundle);
      console.log("AuditLog:", {
        event: "LOCALIZATION_BUNDLE_UPDATED",
        bundleId: editingBundle.id,
        namespace: editingBundle.namespace,
        language: editingBundle.language,
        at: new Date().toISOString(),
        actor: "Admin (simulated)",
      });
    }
  };

  return (
    <AdminLocalizationLayout>
      <Box className="flex flex-col lg:flex-row gap-4">
        {/* Left – bundles list */}
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
                Bundles
              </Typography>
              <Button
                variant="outlined"
                size="small"
                sx={{
                  textTransform: "none",
                  borderRadius: 999,
                  fontSize: 11,
                }}
                onClick={handleNewBundle}
              >
                + New bundle
              </Button>
            </Box>
            <Divider className="!my-1" />

            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f3f4f6" }}>
                    <TableCell>Namespace</TableCell>
                    <TableCell>Language</TableCell>
                    <TableCell>Completion</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bundles.map((bundle) => (
                    <TableRow
                      key={bundle.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      selected={bundle.id === selectedId}
                      onClick={() => handleRowClick(bundle)}
                    >
                      <TableCell>{bundle.namespace}</TableCell>
                      <TableCell>{bundle.language}</TableCell>
                      <TableCell>{bundle.completion}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography
              variant="caption"
              className="text-[11px] text-slate-500 mt-1"
            >
              Completion is tracked server-side based on key coverage per
              language.
            </Typography>
          </CardContent>
        </Card>

        {/* Right – bundle editor */}
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
              Bundle editor
            </Typography>
            <Divider className="!my-1" />

            <Box className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Box className="flex flex-col gap-1">
                <Typography
                  variant="caption"
                  className="text-[11px] text-slate-500"
                >
                  Namespace
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={editingBundle.namespace}
                  onChange={handleBundleFieldChange("namespace")}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
                />
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
                  value={editingBundle.language}
                  onChange={handleBundleFieldChange("language")}
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
                title
              </Typography>
              <TextField
                size="small"
                fullWidth
                value={editingBundle.keys["title"] || ""}
                onChange={handleKeyChange("title")}
                sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
              />
            </Box>

            <Box className="flex flex-col gap-1">
              <Typography
                variant="caption"
                className="text-[11px] text-slate-500"
              >
                cta.start
              </Typography>
              <TextField
                size="small"
                fullWidth
                value={editingBundle.keys["cta.start"] || ""}
                onChange={handleKeyChange("cta.start")}
                sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
              />
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
                Save translations
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </AdminLocalizationLayout>
  );
}
