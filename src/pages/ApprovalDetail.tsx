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
  TextField,
  Snackbar,
  Alert
} from "@mui/material";

// E2 – Approval Detail (Light/Dark, EVzone themed)
// Route suggestion: /admin/approvals/:approvalId
// Shows full detail for a single approval case with triage actions.
//
// Manual test cases:
// 1) Initial render
//    - Light mode by default.
//    - Header shows EVZONE ADMIN, subtitle "Approvals · Detail" and
//      Light/Dark toggle.
//    - Title: "Approval Detail" with short description.
//    - Case header card shows ID, entity, type, severity, age, region.
//    - Two main sections: Summary & context, and Decision panel.
// 2) Back button
//    - Click "← Back to approvals"; expect a console log placeholder.
// 3) Theme toggle
//    - Switch to Dark and back; layout & content remain stable.
// 4) Decision actions
//    - Approve / Reject / Request more info buttons log corresponding action
//      and include the case ID.
// 5) Notes
//    - Editing the internal notes textarea updates local state without errors.

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

const SAMPLE_CASE = {
  id: "APP-003",
  type: "Driver escalation",
  entity: "Michael Driver",
  severity: "High",
  age: "4h",
  region: "West Africa",
  summary:
    "Driver flagged by risk rules due to high cancellations and fare disputes.",
  details:
    "System detected a pattern of cancellations after long wait times and multiple fare dispute tickets for this driver.",
  context:
    "Driver has completed 215 trips in the last 30 days with 4.2 average rating. Cancellation rate is 7.4% vs fleet average of 3.1%.",
};

function AdminApprovalDetailLayout({ children }) {
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
            Approval Detail
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Review the case context and make a confident decision.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col gap-3">
        {children}
      </Box>
    </Box>
  );
}

export default function ApprovalDetailPage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, msg: "" });
  const approval = SAMPLE_CASE;

  const handleDecision = (action) => {
    console.log(`Decision: ${action}`);
    // Show feedback then navigate
    setSnackbar({ open: true, msg: `Decision Recorded: ${action}` });
    setTimeout(() => {
      navigate('/admin/approvals');
    }, 1000);
  };

  const handleSaveNote = () => {
    setSnackbar({ open: true, msg: "Note saved internally." });
  };

  return (
    <AdminApprovalDetailLayout>
      {/* Case header */}
      <Card
        elevation={1}
        sx={{
          borderRadius: 8,
          border: "1px solid rgba(148,163,184,0.5)",
          background: "linear-gradient(145deg, #ffffff, #f9fafb)",
        }}
      >
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <Box>
            <Typography
              variant="caption"
              className="text-[11px] text-slate-500"
            >
              {approval.id}
            </Typography>
            <Typography
              variant="subtitle2"
              className="font-semibold text-slate-900"
            >
              {approval.entity}
            </Typography>
            <Typography
              variant="caption"
              className="text-[11px] text-slate-500"
            >
              {approval.type}
            </Typography>
          </Box>
          <Box className="flex flex-wrap gap-1 items-center">
            <Chip
              size="small"
              label={approval.severity}
              sx={{
                fontSize: 10,
                height: 22,
                bgcolor:
                  approval.severity === "High"
                    ? "#fee2e2"
                    : approval.severity === "Medium"
                      ? "#fef3c7"
                      : "#e0f2fe",
              }}
            />
            <Chip
              size="small"
              label={approval.age}
              sx={{ fontSize: 10, height: 22 }}
            />
            <Chip
              size="small"
              label={approval.region}
              sx={{ fontSize: 10, height: 22 }}
            />
          </Box>
        </CardContent>
      </Card>

      <Box className="flex flex-col lg:flex-row gap-4">
        {/* Summary & context */}
        <Card
          elevation={1}
          sx={{
            flex: 2,
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.5)",
            background: "linear-gradient(145deg, #f9fafb, #ffffff)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Box>
              <Typography
                variant="subtitle2"
                className="font-semibold text-slate-900 mb-1"
              >
                Summary
              </Typography>
              <Typography
                variant="body2"
                className="text-[12px] text-slate-800"
              >
                {approval.summary}
              </Typography>
            </Box>

            <Divider className="!my-1" />

            <Box>
              <Typography
                variant="subtitle2"
                className="font-semibold text-slate-900 mb-1"
              >
                System context
              </Typography>
              <Typography
                variant="body2"
                className="text-[12px] text-slate-800"
              >
                {approval.details}
              </Typography>
              <Typography
                variant="body2"
                className="text-[12px] text-slate-800 mt-1"
              >
                {approval.context}
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="subtitle2"
                className="font-semibold text-slate-900 mb-1"
              >
                Internal notes
              </Typography>
              <TextField
                multiline
                minRows={3}
                maxRows={6}
                fullWidth
                size="small"
                placeholder="Add notes for audit trail (only visible to Admins)…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" },
                  "& .MuiInputBase-input": { fontSize: 12 },
                }}
              />
              <Button
                size="small"
                variant="text"
                sx={{ mt: 1, textTransform: 'none', fontSize: 11 }}
                onClick={handleSaveNote}
              >
                Save Note
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Decision panel */}
        <Card
          elevation={1}
          sx={{
            flex: 1,
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.5)",
            background: "linear-gradient(145deg, #eff6ff, #ffffff)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Typography
              variant="subtitle2"
              className="font-semibold text-slate-900"
            >
              Decision
            </Typography>
            <Typography
              variant="caption"
              className="text-[11px] text-slate-600"
            >
              Choose an action. All decisions are logged with notes in the audit
              trail.
            </Typography>

            <Button
              fullWidth
              variant="contained"
              size="small"
              sx={{
                textTransform: "none",
                borderRadius: 999,
                fontSize: 12,
                bgcolor: EV_COLORS.primary,
                "&:hover": { bgcolor: "#0fb589" },
              }}
              onClick={() => handleDecision("Approve")}
            >
              Approve
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
              onClick={() => handleDecision("Reject")}
            >
              Reject
            </Button>
            <Button
              fullWidth
              variant="text"
              size="small"
              sx={{
                textTransform: "none",
                borderRadius: 999,
                fontSize: 12,
                color: "#4b5563",
              }}
              onClick={() => handleDecision("Request more info")}
            >
              Request more info
            </Button>
          </CardContent>
        </Card>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success">{snackbar.msg}</Alert>
      </Snackbar>
    </AdminApprovalDetailLayout>
  );
}
