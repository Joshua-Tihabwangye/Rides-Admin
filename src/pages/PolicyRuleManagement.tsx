import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import {
  createAdminContent,
  listAdminContent,
  patchAdminContent,
  type AdminContentItem,
} from "../services/api/adminApi";

const EV_COLORS = {
  primary: "#03cd8c",
};

const CONTENT_KIND = "policy-rules";

type PolicyCategory = "safety" | "risk" | "pricing" | "operations";
type PolicySeverity = "low" | "medium" | "high";

type PolicyRuleDocument = Record<string, unknown> & {
  title: string;
  status: "published" | "archived";
  category: PolicyCategory;
  condition: string;
  action: string;
  severity: PolicySeverity;
  active: boolean;
};

type PolicyDraft = Pick<PolicyRuleDocument, "title" | "category" | "condition" | "action" | "severity" | "active">;

type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info";
};

const DEFAULT_DRAFT: PolicyDraft = {
  title: "",
  category: "safety",
  condition: "",
  action: "",
  severity: "medium",
  active: true,
};

function AdminPolicyLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography variant="h6" className="font-semibold tracking-tight" color="text.primary">
            Policy & Rule Management
          </Typography>
          <Typography variant="caption" className="text-[11px] text-slate-600">
            Define backend-persisted automation rules for safety, risk, pricing, and operations.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col gap-3">{children}</Box>
    </Box>
  );
}

function isPolicyCategory(value: unknown): value is PolicyCategory {
  return value === "safety" || value === "risk" || value === "pricing" || value === "operations";
}

function isPolicySeverity(value: unknown): value is PolicySeverity {
  return value === "low" || value === "medium" || value === "high";
}

function textValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function boolValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeRule(row?: Partial<PolicyRuleDocument> | null): PolicyDraft {
  return {
    title: textValue(row?.title, DEFAULT_DRAFT.title),
    category: isPolicyCategory(row?.category) ? row.category : DEFAULT_DRAFT.category,
    condition: textValue(row?.condition, DEFAULT_DRAFT.condition),
    action: textValue(row?.action, DEFAULT_DRAFT.action),
    severity: isPolicySeverity(row?.severity) ? row.severity : DEFAULT_DRAFT.severity,
    active: boolValue(row?.active, DEFAULT_DRAFT.active),
  };
}

function severityColor(severity: PolicySeverity): "default" | "warning" | "error" | "success" {
  if (severity === "high") return "error";
  if (severity === "medium") return "warning";
  if (severity === "low") return "success";
  return "default";
}

export default function PolicyRuleManagementPage() {
  const [rules, setRules] = useState<Array<AdminContentItem<PolicyRuleDocument>>>([]);
  const [selected, setSelected] = useState<AdminContentItem<PolicyRuleDocument> | null>(null);
  const [draft, setDraft] = useState<PolicyDraft>(DEFAULT_DRAFT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: "", severity: "info" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listAdminContent<PolicyRuleDocument>(CONTENT_KIND);
      setRules(rows.filter((row) => row.status !== "archived"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load policy rules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const beginCreate = () => {
    setSelected(null);
    setDraft(DEFAULT_DRAFT);
  };

  const beginEdit = (rule: AdminContentItem<PolicyRuleDocument>) => {
    setSelected(rule);
    setDraft(normalizeRule(rule));
  };

  const updateText =
    (field: keyof Pick<PolicyDraft, "title" | "condition" | "action">) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setDraft((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const updateSelect =
    <Field extends keyof Pick<PolicyDraft, "category" | "severity">>(field: Field) =>
    (event: SelectChangeEvent<PolicyDraft[Field]>) => {
      setDraft((prev) => ({ ...prev, [field]: event.target.value as PolicyDraft[Field] }));
    };

  const save = async () => {
    if (!draft.title.trim() || !draft.condition.trim() || !draft.action.trim()) {
      setSnackbar({ open: true, message: "Title, condition, and action are required.", severity: "error" });
      return;
    }

    setSaving(true);
    const payload: PolicyRuleDocument = {
      title: draft.title.trim(),
      status: "published",
      category: draft.category,
      condition: draft.condition.trim(),
      action: draft.action.trim(),
      severity: draft.severity,
      active: draft.active,
    };

    try {
      if (selected) {
        await patchAdminContent<PolicyRuleDocument>(CONTENT_KIND, selected.id, payload);
      } else {
        await createAdminContent<PolicyRuleDocument>(CONTENT_KIND, payload);
      }
      await load();
      setSnackbar({ open: true, message: "Policy rule saved.", severity: "success" });
      setSelected(null);
      setDraft(DEFAULT_DRAFT);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : "Unable to save policy rule",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const archive = async (rule: AdminContentItem<PolicyRuleDocument>) => {
    setSaving(true);
    try {
      await patchAdminContent<PolicyRuleDocument>(CONTENT_KIND, rule.id, { status: "archived" });
      await load();
      setSnackbar({ open: true, message: "Policy rule archived.", severity: "success" });
      if (selected?.id === rule.id) beginCreate();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : "Unable to archive policy rule",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <AdminPolicyLayout>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Box className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-4">
        <Card elevation={1} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.5)" }}>
          <CardContent className="p-4 flex flex-col gap-3">
            <Box className="flex items-center justify-between gap-2">
              <Typography variant="subtitle2" className="font-semibold">
                {selected ? "Edit rule" : "New rule"}
              </Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={beginCreate} sx={{ textTransform: "none" }}>
                New
              </Button>
            </Box>
            <Divider className="!my-1" />
            <TextField label="Title" size="small" value={draft.title} onChange={updateText("title")} fullWidth />
            <FormControl size="small" fullWidth>
              <InputLabel>Category</InputLabel>
              <Select label="Category" value={draft.category} onChange={updateSelect("category")}>
                <MenuItem value="safety">Safety</MenuItem>
                <MenuItem value="risk">Risk</MenuItem>
                <MenuItem value="pricing">Pricing</MenuItem>
                <MenuItem value="operations">Operations</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Condition" size="small" value={draft.condition} onChange={updateText("condition")} multiline minRows={2} fullWidth />
            <TextField label="Action" size="small" value={draft.action} onChange={updateText("action")} multiline minRows={2} fullWidth />
            <FormControl size="small" fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select label="Severity" value={draft.severity} onChange={updateSelect("severity")}>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Active
              </Typography>
              <Switch checked={draft.active} onChange={(event) => setDraft((prev) => ({ ...prev, active: event.target.checked }))} />
            </Stack>
            <Button
              variant="contained"
              size="small"
              startIcon={<SaveIcon />}
              disabled={saving}
              onClick={() => void save()}
              sx={{ textTransform: "none", borderRadius: 2, bgcolor: EV_COLORS.primary, "&:hover": { bgcolor: "#0fb589" } }}
            >
              {saving ? "Saving..." : "Save rule"}
            </Button>
          </CardContent>
        </Card>

        <Card elevation={1} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.5)" }}>
          <CardContent className="p-4 flex flex-col gap-3">
            <Typography variant="subtitle2" className="font-semibold">
              Rules
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Rule</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id} hover selected={selected?.id === rule.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {rule.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {rule.condition}
                        </Typography>
                      </TableCell>
                      <TableCell>{rule.category}</TableCell>
                      <TableCell>
                        <Chip size="small" label={rule.severity} color={severityColor(rule.severity)} sx={{ fontSize: 10 }} />
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={rule.active ? "Active" : "Inactive"} color={rule.active ? "success" : "default"} sx={{ fontSize: 10 }} />
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => beginEdit(rule)} sx={{ textTransform: "none" }}>
                          Edit
                        </Button>
                        <Button size="small" color="error" disabled={saving} onClick={() => void archive(rule)} sx={{ textTransform: "none" }}>
                          Archive
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                          No backend policy rules configured.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        message={snackbar.message}
      />
    </AdminPolicyLayout>
  );
}
