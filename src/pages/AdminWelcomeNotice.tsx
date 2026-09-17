import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  getAdminOnboardingStatus,
  listAdminContent,
  patchAdminOnboardingStatus,
  type AdminContentItem,
} from "../services/api/adminApi";

const EV_COLORS = {
  primary:"#03cd8c",
  secondary:"#f77f00",
};

const NOTICE_CONTENT_KIND = "admin-responsibility-notices";

type ResponsibilityNoticeDocument = Record<string, unknown> & {
  title?: string;
  body?: string;
  status?: string;
};

export default function AdminWelcomeNoticePage() {
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [acknowledged, setAcknowledged] = useState(false);
  const [ackSaving, setAckSaving] = useState(false);
  const [notices, setNotices] = useState<Array<AdminContentItem<ResponsibilityNoticeDocument>>>([]);
  const [noticesLoading, setNoticesLoading] = useState(true);
  const [noticesError, setNoticesError] = useState<string | null>(null);
  const navigate = useNavigate();

  const isDark = mode ==="dark";

  const loadNotices = useCallback(async () => {
    setNoticesLoading(true);
    setNoticesError(null);
    try {
      const rows = await listAdminContent<ResponsibilityNoticeDocument>(NOTICE_CONTENT_KIND);
      setNotices(rows.filter((row) => row.status !== "archived"));
    } catch (error) {
      setNoticesError(error instanceof Error ? error.message : "Failed to load responsibility notices");
      setNotices([]);
    } finally {
      setNoticesLoading(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await loadNotices();
      try {
        const status = await getAdminOnboardingStatus();
        setAcknowledged(status.acknowledged);
      } catch (error) {
        setNoticesError(error instanceof Error ? error.message : "Failed to load Admin onboarding status");
      }
    };
    void load();
  }, [loadNotices]);

  const handleContinue = async () => {
    setAckSaving(true);
    try {
      const status = await patchAdminOnboardingStatus({ acknowledged: true });
      setAcknowledged(status.acknowledged);
      navigate("/admin/onboarding/checklist");
    } catch (error) {
      setNoticesError(error instanceof Error ? error.message : "Failed to save Admin acknowledgement");
    } finally {
      setAckSaving(false);
    }
  };

  const handleAcknowledgementChange = async (checked: boolean) => {
    if (!checked) return;
    setAckSaving(true);
    try {
      const status = await patchAdminOnboardingStatus({ acknowledged: true });
      setAcknowledged(status.acknowledged);
    } catch (error) {
      setNoticesError(error instanceof Error ? error.message : "Failed to save Admin acknowledgement");
    } finally {
      setAckSaving(false);
    }
  };

  const handlePolicyCentre = () => {
    navigate("/admin/vertical-policies");
  };

  const toggleMode = () => {
    setMode((prev) => (prev ==="light" ?"dark" :"light"));
  };

  return (
    <Box
      className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ?"bg-slate-950 text-slate-50" :"bg-slate-50"
        }`}
      sx={{
        background: isDark
          ? `radial-gradient(circle at top left, ${EV_COLORS.primary}22, transparent 55%), radial-gradient(circle at bottom right, ${EV_COLORS.secondary}22, #020617)`
          : `radial-gradient(circle at top left, ${EV_COLORS.primary}11, #ffffff), radial-gradient(circle at bottom right, ${EV_COLORS.secondary}11, #f9fafb)`,
      }}
    >
      {/* Header */}
      <Box className="w-full flex items-center justify-between px-4 py-3 sm:px-6">
        <Typography
          variant="subtitle2"
          className={`tracking-[0.25em] uppercase text-[11px] ${isDark ?"text-slate-400" :"text-slate-500"
            }`}
        >
          EVZONE
        </Typography>
        <Box className="flex items-center gap-2">
          <Chip
            size="small"
            label="Admin onboarding"
            sx={{
              bgcolor: isDark ?"rgba(15,23,42,0.9)" :"#ffffff",
              border: isDark ?"1px solid #1f2937" :"1px solid #e5e7eb",
              color: isDark ?"#e5e7eb" :"#4b5563",
              fontSize:"10px",
              letterSpacing: 0.8,
              textTransform:"uppercase",
            }}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={toggleMode}
            sx={{
              textTransform:"none",
              borderRadius: 999,
              borderColor: isDark ?"#1f2937" :"#e5e7eb",
              color: isDark ?"#e5e7eb" :"#374151",
              px: 1.8,
              py: 0.4,
              fontSize: 11,
              minWidth:"auto",
            }}
          >
            {isDark ?"Dark" :"Light"}
          </Button>
        </Box>
      </Box>

      {/* Main card */}
      <Box className="flex-1 flex items-center justify-center px-4 pb-10">
        <Card
          elevation={10}
          sx={{
            width:"100%",
            maxWidth: 560,
            borderRadius: 2,
            border: isDark
              ?"1px solid rgba(30,64,175,0.4)"
              :"1px solid rgba(148,163,184,0.5)",
            background: isDark
              ?"linear-gradient(145deg, rgba(15,23,42,0.96), rgba(15,23,42,0.98))"
              :"linear-gradient(145deg, #ffffff, #f9fafb)",
          }}
        >
          <CardContent className="p-5 sm:p-7 flex flex-col gap-6">
            {/* Title + description */}
            <Box className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <Box className="flex-1 min-w-0">
                <Typography
                  variant="h6"
                  className={`font-semibold tracking-tight mb-1 ${isDark ?"text-slate-50" :""
                    }`}
                >
                  Welcome to the EVzone Admin Portal
                </Typography>
                <Typography
                  variant="body2"
                  className={`text-xs sm:text-sm ${isDark ?"text-slate-400" :"text-slate-600"
                    }`}
                >
                  You are signing into the EVzone HQ console. This space controls pricing,
                  services, and policies across Rides & Logistics and other modules. Please
                  review and acknowledge your responsibilities before continuing.
                </Typography>
              </Box>

              <Box className="flex flex-col items-end gap-2">
                <Chip
                  label="Internal use only"
                  size="small"
                  sx={{
                    bgcolor: isDark ?"rgba(15,23,42,0.9)" :"#f9fafb",
                    border: isDark ?"1px solid #334155" :"1px solid #e5e7eb",
                    color: isDark ?"#e5e7eb" :"#4b5563",
                    fontSize:"10px",
                    textTransform:"uppercase",
                  }}
                />
                <Typography
                  variant="caption"
                  className={`text-[10px] max-w-[160px] text-right ${isDark ?"text-slate-500" :"text-slate-500"
                    }`}
                >
                  Do not share screenshots or credentials outside EVzone.
                </Typography>
              </Box>
            </Box>

            {/* Responsibilities list */}
            <Box className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
              <Box className="px-4 pt-4 pb-1 flex items-center justify-between gap-2">
                <Typography
                  variant="subtitle2"
                  className="text-slate-100 text-sm font-medium"
                >
                  Your responsibilities as an Admin
                </Typography>
                <Chip
                  size="small"
                  label="Logged & monitored"
                  sx={{
                    bgcolor:"rgba(248,250,252,0.05)",
                    border:"1px solid #1f2937",
                    color:"#9ca3af",
                    fontSize:"10px",
                  }}
                />
              </Box>

              {noticesError ? (
                <Box className="px-4 pb-4">
                  <Alert
                    severity="error"
                    action={
                      <Button color="inherit" size="small" onClick={() => void loadNotices()}>
                        Retry
                      </Button>
                    }
                  >
                    {noticesError}
                  </Alert>
                </Box>
              ) : noticesLoading ? (
                <Box className="px-4 py-6 flex justify-center">
                  <CircularProgress size={24} />
                </Box>
              ) : notices.length === 0 ? (
                <Box className="px-4 pb-4">
                  <Alert severity="info">
                    No admin responsibility notices have been published by the backend yet.
                  </Alert>
                </Box>
              ) : (
              <List dense className="px-2 pb-1">
                {notices.map((item) => (
                  <ListItem
                    key={item.id}
                    className="rounded-xl px-2 py-1.5"
                    sx={{"&:hover": {
                        backgroundColor:"rgba(15,23,42,0.9)",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {/* Simple circular icon without @mui/icons-material */}
                      <Box
                        component="span"
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius:"999px",
                          bgcolor: EV_COLORS.primary,
                          boxShadow:"0 0 0 3px rgba(3,205,140,0.25)",
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          className="text-[13px] font-medium text-slate-100"
                        >
                          {item.title || "Responsibility notice"}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          className="text-[11px] text-slate-400"
                        >
                          {item.body || "No notice body was provided."}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              )}
            </Box>

            {/* Acknowledgement + actions */}
            <Box className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-1">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={acknowledged}
                    disabled={ackSaving}
                    onChange={(e) => handleAcknowledgementChange(e.target.checked)}
                    sx={{
                      color:"#64748b","&.Mui-checked": { color: EV_COLORS.primary },
                    }}
                  />
                }
                label={
                  <Typography
                    variant="body2"
                    className={`text-[11px] sm:text-xs ${isDark ?"text-slate-300" :"text-slate-600"
                      }`}
                  >
                    I understand that my actions in this portal are audited and I will
                    follow EVzone's governance, privacy, and safety policies.
                  </Typography>
                }
              />

              <Box className="flex flex-col sm:flex-row gap-2 sm:justify-end w-full sm:w-auto">
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    textTransform:"none",
                    borderRadius: 2,
                    borderColor:"#1f2937",
                    color:"#e5e7eb",
                    px: 2.5,"&:hover": { borderColor: EV_COLORS.secondary },
                  }}
                  onClick={handlePolicyCentre}
                >
                  View policy centre
                </Button>

                <Button
                  variant="contained"
                  size="small"
                  disabled={!acknowledged}
                  sx={{
                    textTransform:"none",
                    borderRadius: 2,
                    px: 3,
                    bgcolor: acknowledged ? EV_COLORS.primary :"#1f2937","&:hover": {
                      bgcolor: acknowledged ?"#0fb589" :"#020617",
                    },
                  }}
                  onClick={handleContinue}
                >
                  {ackSaving ? "Saving..." : "Continue to onboarding"}
                </Button>
              </Box>
            </Box>

            <Typography
              variant="caption"
              className={`text-[10px] mt-1 ${isDark ?"text-slate-500" :"text-slate-500"
                }`}
            >
              Tip: New admins typically start in read-only mode. Write access to critical
              settings (pricing, services, finance, risk) can be granted after completing
              the required training modules.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
