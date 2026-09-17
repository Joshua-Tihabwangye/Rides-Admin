import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Card, CardContent, Typography, Chip, Button, Divider, TextField, Alert, CircularProgress } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getAdminRiskCase, patchAdminRiskCase } from "../services/api/adminApi";
import type { AdminRiskCaseResponse } from "../services/api/adminApi";

type RiskCaseDetail = AdminRiskCaseResponse & { updatedAt?: number };

export default function RiskCaseDetailPage() {
  const { riskId } = useParams();
  const navigate = useNavigate();
  const [riskCase, setRiskCase] = useState<RiskCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!riskId) return;
    const loadCase = async () => {
      setLoading(true);
      try {
        const data = await getAdminRiskCase(riskId as string);
        setRiskCase(data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load risk case");
      } finally {
        setLoading(false);
      }
    };
    loadCase();
  }, [riskId]);

  const appendCaseNote = (entry: string) => [riskCase?.notes, entry].filter(Boolean).join("\n");

  const updateCase = async (status: "open" | "under_review" | "resolved", entry: string) => {
    if (!riskCase) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await patchAdminRiskCase(riskCase.id, {
        status,
        notes: appendCaseNote(entry),
      });
      setRiskCase(updated);
      setNotes("");
      setNotice("Risk case updated from the backend.");
    } catch (e: any) {
      setError(e?.message ?? "Failed to update risk case");
    } finally {
      setSaving(false);
    }
  };

  const handleAction = (action: string, status: "open" | "under_review" | "resolved") => {
    const entry = `Action: ${action}${notes.trim() ? ` - ${notes.trim()}` : ""}`;
    void updateCase(status, entry);
  };

  const handleAddNote = () => {
    const trimmed = notes.trim();
    if (!trimmed) return;
    void updateCase((riskCase?.status ?? "open") as "open" | "under_review" | "resolved", `Note: ${trimmed}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !riskCase) {
    return <Alert severity="error">{error || "Risk case not found"}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Button onClick={() => navigate('/admin/risk')} startIcon={<ArrowBackIcon />} size="small" sx={{ textTransform: 'none', minWidth: 0 }}>
          Back
        </Button>
        <Typography variant="caption" color="text.secondary">
          Admin / Risk &amp; Fraud / {riskCase.id.slice(0, 8)}
        </Typography>
      </Box>
      {notice ? <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert> : null}
      <Box className="pb-4 flex items-center justify-between gap-2 flex-wrap">
        <Box>
          <Typography variant="h6" className="font-semibold tracking-tight" color="text.primary">
            Risk case detail
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Deep view of a single fraud or abuse alert to support confident triage.
          </Typography>
        </Box>
      </Box>

      <Card
        elevation={2}
        sx={{
          borderRadius: 2,
          border: "1px solid rgba(148,163,184,0.3)",
          mb: 3,
        }}
      >
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <Box>
            <Typography variant="caption" className="text-[11px] text-slate-500">
              {riskCase.id}
            </Typography>
            <Typography variant="subtitle2" className="font-semibold" color="text.primary">
              {riskCase.subjectId}
            </Typography>
            <Typography variant="caption" className="text-[11px] text-slate-500">
              {riskCase.subjectType} · {riskCase.type}
            </Typography>
            <Typography variant="caption" className="text-[11px] text-slate-500" sx={{ display: "block" }}>
              Created {new Date(riskCase.createdAt).toLocaleString()}
              {riskCase.updatedAt ? ` · Updated ${new Date(riskCase.updatedAt).toLocaleString()}` : ""}
            </Typography>
          </Box>
          <Box className="flex flex-wrap gap-1 items-center">
            <Chip
              size="small"
              label={riskCase.severity}
              sx={{
                fontSize: 10,
                height: 22,
                bgcolor:
                  riskCase.severity === "High"
                    ? "#fee2e2"
                    : riskCase.severity === "Medium"
                    ? "#fef3c7"
                    : "#e0f2fe",
              }}
            />
            <Chip
              size="small"
              label={riskCase.status ?? "open"}
              color={riskCase.status === "resolved" ? "success" : riskCase.status === "under_review" ? "warning" : "default"}
              sx={{ fontSize: 10, height: 22 }}
            />
            <Chip
              size="small"
              label={new Date(riskCase.createdAt).toLocaleDateString()}
              sx={{ fontSize: 10, height: 22 }}
            />
          </Box>
        </CardContent>
      </Card>

      <Box className="flex flex-col lg:flex-row gap-4">
        <Card
          elevation={2}
          sx={{
            flex: 2,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.3)",
            bgcolor: "background.paper",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Box>
              <Typography variant="subtitle2" className="font-semibold" color="text.primary">
                Summary
              </Typography>
              <Typography variant="body2" className="text-[12px]">
                {riskCase.notes || "No additional notes."}
              </Typography>
            </Box>

            <Divider className="!my-1" />

            <Box>
              <Typography variant="subtitle2" className="font-semibold" color="text.primary">
                Status
              </Typography>
              <Typography variant="body2" className="text-[12px]">
                {riskCase.status ?? "open"}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" className="font-semibold" color="text.primary">
                Internal notes
              </Typography>
              <Box className="flex flex-col gap-2">
                <TextField
                  multiline
                  minRows={3}
                  maxRows={6}
                  fullWidth
                  size="small"
                  placeholder="Add notes for audit trail and hand-off to fraud desk…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={saving}
                  sx={{
                    "& .MuiOutlinedInput-root": { bgcolor: "background.default" },
                    "& .MuiInputBase-input": { fontSize: 12 },
                  }}
                />
                <Button
                  variant="contained"
                  size="small"
                  color="success"
                  sx={{ alignSelf: "flex-end", textTransform: "none", borderRadius: 999, fontSize: 12, color: "white" }}
                  onClick={handleAddNote}
                  disabled={saving || !notes.trim()}
                >
                  {saving ? "Saving..." : "Add note"}
                </Button>
              </Box>

              {riskCase.notes ? (
                <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <Typography variant="caption" className="text-[11px]" color="text.secondary">
                    Backend notes
                  </Typography>
                  {riskCase.notes.split("\n").filter(Boolean).map((n, idx) => (
                    <Typography key={idx} variant="body2" className="text-[12px] text-slate-500">
                      {n}
                    </Typography>
                  ))}
                </Box>
              ) : null}
            </Box>
          </CardContent>
        </Card>

        <Card
          elevation={2}
          sx={{
            flex: 1,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.3)",
            background: "linear-gradient(145deg, #ef444410, #eab30808)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Typography variant="subtitle2" className="font-semibold">
              Actions & triage
            </Typography>
            <Typography variant="caption" className="text-[11px] text-slate-500">
              Choose the appropriate action. All actions and notes will be logged in the audit trail.
            </Typography>

            <Button
              fullWidth
              variant="text"
              size="small"
              sx={{
                textTransform: "none",
                borderRadius: 999,
                fontSize: 12,
                color: "text.secondary",
              }}
              disabled={saving}
              onClick={() => handleAction("Monitor", "open")}
            >
              Monitor only (no blocking)
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              sx={{
                textTransform: "none",
                borderRadius: 999,
                fontSize: 12,
                borderColor: "#f97316",
                color: "#92400e",
              }}
              disabled={saving}
              onClick={() => handleAction("Limit features", "under_review")}
            >
              Limit features (e.g. no cash trips)
            </Button>
            <Button
              fullWidth
              variant="contained"
              size="small"
              sx={{
                textTransform: "none",
                borderRadius: 999,
                fontSize: 12,
                bgcolor: "#ef4444",
                "&:hover": { bgcolor: "#dc2626" },
              }}
              disabled={saving}
              onClick={() => handleAction("Escalate to fraud desk", "under_review")}
            >
              Escalate to fraud desk
            </Button>
            <Button
              fullWidth
              variant="contained"
              size="small"
              sx={{
                textTransform: "none",
                borderRadius: 999,
                fontSize: 12,
                bgcolor: "#16a34a",
                color: "#ffffff",
                "&:hover": { bgcolor: "#15803d" },
              }}
              disabled={saving}
              onClick={() => handleAction("Resolved after admin review", "resolved")}
            >
              Resolve case
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
