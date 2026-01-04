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
  TextField,
} from "@mui/material";
import CallIcon from '@mui/icons-material/Call';
import ChatIcon from '@mui/icons-material/Chat';

// H2 – Risk Case Detail (Light/Dark, EVzone themed)
// Route suggestion: /admin/risk/:riskId

const SAMPLE_RISK_CASE = {
  id: "RISK-101",
  type: "Account abuse",
  actorType: "Rider",
  actorName: "John Okello",
  severity: "High",
  age: "1h",
  region: "East Africa",
  summary:
    "Multiple refund disputes across 3 drivers in less than 24 hours.",
  signals: [
    "3 refund tickets from different drivers in 18 hours",
    "2 chargebacks flagged by payment gateway",
    "Device linked to another suspended account",
  ],
  context:
    "Rider completed 42 trips in the last 30 days (avg rating 4.1). Recent " +
    "behaviour deviates from historical pattern: spike in short trips followed " +
    "by refund requests.",
  financialExposure:
    "Estimated financial exposure for the last 7 days: $86 (unpaid disputes).",
};

export default function RiskCaseDetailPage() {
  const [notes, setNotes] = useState("");
  const riskCase = SAMPLE_RISK_CASE;

  const handleAction = (action) => {
    console.log(`Risk action: ${action} on`, riskCase.id, "Notes:", notes.trim());
  };

  const handleCommunication = (method) => {
    console.log(`Initiating ${method} with ${riskCase.actorName}`);
  }

  return (
    <Box>
      {/* Header / Title */}
      <Box className="pb-4 flex items-center justify-between gap-2 flex-wrap">
        <Box>
          <Typography
            variant="h6"
            className="font-semibold tracking-tight"
            color="text.primary"
          >
            Risk case detail
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Deep view of a single fraud or abuse alert to support confident triage.
          </Typography>
        </Box>
        <Box className="flex items-center gap-2">
          <Button
            variant="outlined"
            startIcon={<CallIcon />}
            size="small"
            onClick={() => handleCommunication('Call')}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Call Actor
          </Button>
          <Button
            variant="outlined"
            startIcon={<ChatIcon />}
            size="small"
            onClick={() => handleCommunication('Chat')}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Chat with Actor
          </Button>
        </Box>
      </Box>

      {/* Case header */}
      <Card
        elevation={2}
        sx={{
          borderRadius: 2,
          border: "1px solid rgba(148,163,184,0.3)",
          background: "linear-gradient(145deg, #fef2f2, #ffffff)",
          mb: 3
        }}
      >
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <Box>
            <Typography
              variant="caption"
              className="text-[11px] text-slate-600"
            >
              {riskCase.id}
            </Typography>
            <Typography
              variant="subtitle2"
              className="font-semibold"
              color="text.primary"
            >
              {riskCase.actorName}
            </Typography>
            <Typography
              variant="caption"
              className="text-[11px] text-slate-600"
            >
              {riskCase.actorType} · {riskCase.type}
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
              label={riskCase.age}
              sx={{ fontSize: 10, height: 22 }}
            />
            <Chip
              size="small"
              label={riskCase.region}
              sx={{ fontSize: 10, height: 22 }}
            />
          </Box>
        </CardContent>
      </Card>

      <Box className="flex flex-col lg:flex-row gap-4">
        {/* Left – signals, context, notes */}
        <Card
          elevation={2}
          sx={{
            flex: 2,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.3)",
            bgcolor: "background.paper"
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Box>
              <Typography
                variant="subtitle2"
                className="font-semibold"
                color="text.primary"
              >
                Summary
              </Typography>
              <Typography
                variant="body2"
                className="text-[12px] text-slate-800"
              >
                {riskCase.summary}
              </Typography>
            </Box>

            <Divider className="!my-1" />

            <Box>
              <Typography
                variant="subtitle2"
                className="font-semibold"
                color="text.primary"
              >
                Signals from risk engine
              </Typography>
              <Box className="flex flex-col gap-1">
                {riskCase.signals.map((s) => (
                  <Typography
                    key={s}
                    variant="body2"
                    className="text-[12px] text-slate-800"
                  >
                    • {s}
                  </Typography>
                ))}
              </Box>
            </Box>

            <Box>
              <Typography
                variant="subtitle2"
                className="font-semibold"
                color="text.primary"
              >
                Behavioural context
              </Typography>
              <Typography
                variant="body2"
                className="text-[12px] text-slate-800"
              >
                {riskCase.context}
              </Typography>
              <Typography
                variant="body2"
                className="text-[12px] text-slate-800 mt-1"
              >
                {riskCase.financialExposure}
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="subtitle2"
                className="font-semibold"
                color="text.primary"
              >
                Internal notes
              </Typography>
              <TextField
                multiline
                minRows={3}
                maxRows={6}
                fullWidth
                size="small"
                placeholder="Add notes for audit trail and hand-off to fraud desk…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": { bgcolor: "background.paper" },
                  "& .MuiInputBase-input": { fontSize: 12 },
                }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Right – action panel */}
        <Card
          elevation={2}
          sx={{
            flex: 1,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.3)",
            background: "linear-gradient(145deg, #fef2f2, #fffbeb)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Typography
              variant="subtitle2"
              className="font-semibold text-slate-900"
            >
              Actions & triage
            </Typography>
            <Typography
              variant="caption"
              className="text-[11px] text-slate-700"
            >
              Choose the appropriate action. All actions and notes will be
              logged in the audit trail.
            </Typography>

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
              onClick={() => handleAction("Monitor")}
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
              onClick={() => handleAction("Limit features")}
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
              onClick={() => handleAction("Escalate to fraud desk")}
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
                bgcolor: "#111827",
                "&:hover": { bgcolor: "#020617" },
              }}
              onClick={() => handleAction("Suspend account")}
            >
              Suspend account immediately
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
