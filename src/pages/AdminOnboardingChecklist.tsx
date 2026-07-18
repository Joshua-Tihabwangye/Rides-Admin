// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  CircularProgress,
  Alert,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import LockIcon from "@mui/icons-material/Lock";
import SchoolIcon from "@mui/icons-material/School";
import LocalPoliceIcon from "@mui/icons-material/LocalPolice";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import DirectionsCarFilledIcon from "@mui/icons-material/DirectionsCarFilled";
import ApiIcon from "@mui/icons-material/Api";
import { listAdminTrainingModules } from "../services/api/adminApi";
import type { AdminTrainingModuleResponse } from "../services/api/adminApi";

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

const areaIcon = (area: string) => {
  switch (area) {
    case "Core":
      return <LockIcon fontSize="small" />;
    case "Security":
      return <LocalPoliceIcon fontSize="small" />;
    case "Mobility":
      return <DirectionsCarFilledIcon fontSize="small" />;
    case "Finance":
      return <AccountBalanceIcon fontSize="small" />;
    case "Risk":
      return <SchoolIcon fontSize="small" />;
    case "Tech":
      return <ApiIcon fontSize="small" />;
    default:
      return <SchoolIcon fontSize="small" />;
  }
};

export default function AdminOnboardingChecklistPage() {
  const [mode, setMode] = useState("light");
  const [modules, setModules] = useState<AdminTrainingModuleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listAdminTrainingModules();
        setModules(data);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load training modules");
        setModules([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const isDark = mode === "dark";

  const totalRequired = useMemo(() => modules.filter((m) => m.required).length, [modules]);
  const totalDoneRequired = useMemo(() => modules.filter((m) => m.required && m.completedAt).length, [modules]);
  const totalDoneAll = useMemo(() => modules.filter((m) => m.completedAt).length, [modules]);

  const progressRequired = totalRequired ? Math.round((totalDoneRequired / totalRequired) * 100) : 0;
  const progressAll = modules.length ? Math.round((totalDoneAll / modules.length) * 100) : 0;

  const toggleMode = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
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
    <Box
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        isDark ? "bg-slate-950 text-slate-50" : "bg-slate-50"
      }`}
      sx={{
        background: isDark
          ? `radial-gradient(circle at top left, ${EV_COLORS.primary}22, transparent 55%), radial-gradient(circle at bottom right, ${EV_COLORS.secondary}22, #020617)`
          : `radial-gradient(circle at top left, ${EV_COLORS.primary}11, #ffffff), radial-gradient(circle at bottom right, ${EV_COLORS.secondary}11, #f9fafb)`,
      }}
    >
      <Box className="w-full flex items-center justify-between px-4 py-3 sm:px-6">
        <Typography
          variant="subtitle2"
          className={`tracking-[0.25em] uppercase text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
        >
          EVZONE
        </Typography>
        <Box className="flex items-center gap-2">
          <Chip
            size="small"
            label="Admin onboarding"
            sx={{
              bgcolor: isDark ? "rgba(15,23,42,0.9)" : "#ffffff",
              border: isDark ? "1px solid #1f2937" : "1px solid #e5e7eb",
              color: isDark ? "#e5e7eb" : "#4b5563",
              fontSize: "10px",
              textTransform: "uppercase",
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

      <Box className="flex-1 flex items-center justify-center px-4 pb-10">
        <Card
          elevation={10}
          sx={{
            width: "100%",
            maxWidth: 720,
            borderRadius: 2,
            border: isDark ? "1px solid rgba(30,64,175,0.4)" : "1px solid rgba(148,163,184,0.5)",
            background: isDark
              ? "linear-gradient(145deg, rgba(15,23,42,0.96), rgba(15,23,42,0.98))"
              : "linear-gradient(145deg, #ffffff, #f9fafb)",
          }}
        >
          <CardContent className="p-5 sm:p-7 flex flex-col gap-6">
            <Box className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <Box className="flex-1 min-w-0">
                <Typography
                  variant="h6"
                  className={`font-semibold tracking-tight mb-1 ${isDark ? "text-slate-50" : ""}`}
                >
                  Complete your Admin onboarding
                </Typography>
                <Typography
                  variant="body2"
                  className={`text-xs sm:text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  To unlock full write access in the Admin Portal, you need to complete the required training modules
                  below. You can still browse in read-only mode while training is in progress.
                </Typography>
              </Box>

              <Box className="flex flex-col items-end gap-2 w-full sm:w-auto">
                <Box className="text-right">
                  <Typography
                    variant="caption"
                    className={`text-[11px] ${isDark ? "text-slate-300" : "text-slate-600"}`}
                  >
                    Required modules
                  </Typography>
                  <Typography
                    variant="body2"
                    className={`font-semibold text-sm ${isDark ? "text-slate-50" : ""}`}
                  >
                    {totalDoneRequired} / {totalRequired} completed
                  </Typography>
                </Box>
                <Box className="w-full sm:w-48">
                  <LinearProgress
                    variant="determinate"
                    value={progressRequired}
                    sx={{
                      height: 6,
                      borderRadius: 2,
                      backgroundColor: isDark ? "#020617" : "#e5e7eb",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 2,
                        background: `linear-gradient(90deg, ${EV_COLORS.primary}, ${EV_COLORS.secondary})`,
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    className={`text-[10px] mt-1 float-right ${isDark ? "text-slate-500" : "text-slate-600"}`}
                  >
                    {progressRequired}%
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
              <Box className="px-4 pt-4 pb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <Box>
                  <Typography variant="subtitle2" className="text-slate-100 text-sm font-medium">
                    Training modules
                  </Typography>
                  <Typography variant="caption" className="text-[11px] text-slate-400">
                    Modules are loaded from the training system.
                  </Typography>
                </Box>

                <Chip
                  size="small"
                  label={`${progressAll}% overall`}
                  sx={{
                    bgcolor: "rgba(15,23,42,0.9)",
                    border: "1px solid #1f2937",
                    color: "#e5e7eb",
                    fontSize: "10px",
                  }}
                />
              </Box>

              {modules.length === 0 ? (
                <Box className="px-4 pb-4">
                  <Typography variant="body2" className="text-slate-300 text-sm">
                    No training modules found. Once modules are configured in the backend, they will appear here.
                  </Typography>
                </Box>
              ) : (
                <List dense className="px-2 pb-1">
                  {modules.map((module) => {
                    const done = !!module.completedAt;
                    return (
                      <ListItem
                        key={module.id}
                        className="rounded-xl px-2 py-2 flex flex-col sm:flex-row sm:items-center gap-2"
                        sx={{
                          "&:hover": {
                            backgroundColor: "rgba(15,23,42,0.9)",
                          },
                        }}
                        alignItems="flex-start"
                      >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {done ? (
                            <CheckCircleIcon fontSize="small" sx={{ color: EV_COLORS.primary }} />
                          ) : (
                            <RadioButtonUncheckedIcon fontSize="small" sx={{ color: "#64748b" }} />
                          )}
                        </ListItemIcon>

                        <Box className="flex-1 min-w-0">
                          <Box className="flex flex-wrap items-center gap-1 mb-0.5">
                            <Typography variant="body2" className="text-[13px] font-medium text-slate-100">
                              {module.title}
                            </Typography>
                            <Chip
                              size="small"
                              variant="outlined"
                              icon={areaIcon(module.area)}
                              label={module.area}
                              sx={{
                                borderColor: "#1f2937",
                                color: "#cbd5f5",
                                bgcolor: "rgba(15,23,42,0.9)",
                                "& .MuiChip-icon": { color: "#64748b" },
                              }}
                            />
                            {module.required && (
                              <Chip
                                size="small"
                                label="Required"
                                sx={{
                                  bgcolor: "rgba(248,250,252,0.05)",
                                  border: "1px solid #fbbf24",
                                  color: "#facc15",
                                  fontSize: "10px",
                                }}
                              />
                            )}
                          </Box>
                          <Typography variant="body2" className="text-[11px] text-slate-400">
                            {module.description}
                          </Typography>
                        </Box>

                        <Box className="flex items-center gap-2 self-stretch sm:self-auto">
                          <Tooltip title="Completion status is managed by the training system">
                            <Button
                              variant={done ? "contained" : "outlined"}
                              size="small"
                              disabled
                              sx={{
                                textTransform: "none",
                                borderRadius: 2,
                                minWidth: 96,
                                borderColor: done ? "transparent" : "#1f2937",
                                bgcolor: done ? EV_COLORS.primary : "transparent",
                                color: done ? "#020617" : "#e5e7eb",
                                "&.Mui-disabled": {
                                  color: done ? "#020617" : "#e5e7eb",
                                  borderColor: done ? "transparent" : "#1f2937",
                                  bgcolor: done ? EV_COLORS.primary : "transparent",
                                },
                              }}
                            >
                              {done ? "Completed" : "Pending"}
                            </Button>
                          </Tooltip>
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </Box>

            <Box className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-1">
              <Typography
                variant="caption"
                className={`text-[10px] max-w-xl ${isDark ? "text-slate-500" : "text-slate-500"}`}
              >
                When all required modules are completed, your supervisor or Super Admin can switch your access level
                from read-only to full write access for the regions and modules assigned to you.
              </Typography>

              <Box className="flex flex-row gap-2 justify-end">
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    borderColor: "#1f2937",
                    color: "#e5e7eb",
                    "&:hover": { borderColor: EV_COLORS.primary },
                  }}
                  onClick={() => {
                    // Allow user to view portal in read-only mode
                  }}
                >
                  Enter portal (read-only)
                </Button>

                <Button
                  variant="contained"
                  size="small"
                  disabled={totalDoneRequired !== totalRequired}
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    px: 3,
                    bgcolor: totalDoneRequired === totalRequired ? EV_COLORS.primary : "#1f2937",
                    "&:hover": {
                      bgcolor: totalDoneRequired === totalRequired ? "#0fb589" : "#020617",
                    },
                  }}
                  onClick={() => {
                    if (totalDoneRequired !== totalRequired) return;
                  }}
                >
                  Unlock full Admin access
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
