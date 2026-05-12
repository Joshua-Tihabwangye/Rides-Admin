import React, { useState, useEffect, useMemo } from"react";
import { useNavigate } from"react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Chip,
  Divider,
  CircularProgress,
  Alert,
} from"@mui/material";
import { listAdminRiskCases } from"../services/api/adminApi";
import type { AdminRiskCaseResponse } from"../services/api/adminApi";

const EV_COLORS = {
  primary:"#03cd8c",
  secondary:"#f77f00",
};

export default function RiskFraudCenterPage() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [severityFilter, setSeverityFilter] = useState<string>("All");
  const [cases, setCases] = useState<AdminRiskCaseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminRiskCases();
      setCases(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load risk cases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleCaseClick = (riskCase: AdminRiskCaseResponse) => {
    navigate(`/admin/risk/${riskCase.id}`);
  };

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const matchesType =
        typeFilter === "All" ||
        (typeFilter === "Account" && c.type.toLowerCase().includes("account")) ||
        (typeFilter === "Payment" && c.type.toLowerCase().includes("payment")) ||
        (typeFilter === "Device" && c.type.toLowerCase().includes("device"));

      const matchesSeverity =
        severityFilter === "All" || c.severity.toLowerCase() === severityFilter.toLowerCase();

      return matchesType && matchesSeverity;
    });
  }, [cases, typeFilter, severityFilter]);

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
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography
            variant="h6"
            className="font-semibold tracking-tight"
            color="text.primary"
          >
            Risk & Fraud Center
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Suspicious activity, abuse patterns and fraud alerts across EVzone.
          </Typography>
        </Box>
      </Box>

      {/* Filters row */}
      <Card
        elevation={1}
        sx={{
          borderRadius: 8,
          border: "1px solid rgba(148,163,184,0.5)",
        }}
      >
        <CardContent className="p-3 flex flex-col gap-3">
          <Typography
            variant="caption"
            className="text-[11px]"
            color="text.secondary"
          >
            Filter suspicious activity by type, severity, age and region. Data is from backend.
          </Typography>

          <Divider className="!my-1" />

          <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
            <Box className="flex flex-col gap-1">
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>Type</Typography>
              <TextField
                select
                size="small"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                SelectProps={{ native: true }}
                sx={{ fontSize: 12, bgcolor: "background.paper" }}
              >
                {["All", "Account", "Payment", "Device"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </TextField>
            </Box>
            <Box className="flex flex-col gap-1">
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>Severity</Typography>
              <TextField
                select
                size="small"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                SelectProps={{ native: true }}
                sx={{ fontSize: 12, bgcolor: "background.paper" }}
              >
                {["All","Low","Medium","High"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </TextField>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Risk cases list */}
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filteredCases.map((riskCase) => (
          <Card
            key={riskCase.id}
            elevation={1}
            onClick={() => handleCaseClick(riskCase)}
            sx={{
              borderRadius: 8,
              border: "1px solid rgba(148,163,184,0.6)",
              cursor: "pointer",
              "&:hover": {
                transform: "translateY(-3px)",
                boxShadow: 4,
              },
            }}
          >
            <CardContent className="p-4 flex flex-col gap-2">
              <Box className="flex items-center justify-between gap-2">
                <Box>
                  <Typography
                    variant="caption"
                    className="text-[11px] text-slate-500"
                  >
                    {riskCase.id}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    className="font-semibold"
                  >
                    {riskCase.subjectId}
                  </Typography>
                  <Typography
                    variant="caption"
                    className="text-[11px] text-slate-500"
                  >
                    {riskCase.subjectType} · {riskCase.type}
                  </Typography>
                </Box>
                <Box className="flex flex-col items-end gap-1">
                  <Chip
                    size="small"
                    label={riskCase.type}
                    sx={{ fontSize: 10, height: 22 }}
                  />
                  <Box className="flex gap-1">
                    <Chip
                      size="small"
                      label={riskCase.severity}
                      sx={{
                        fontSize: 10,
                        height: 22,
                        bgcolor:
                          riskCase.severity === "High"
                            ? "#ef444420"
                            : riskCase.severity === "Medium"
                              ? "#eab30820"
                              : "#3b82f620",
                        color:
                          riskCase.severity === "High"
                            ? "#ef4444"
                            : riskCase.severity === "Medium"
                              ? "#eab308"
                              : "#3b82f6",
                      }}
                    />
                    <Chip
                      size="small"
                      label={new Date(riskCase.createdAt).toLocaleDateString()}
                      sx={{ fontSize: 10, height: 22 }}
                    />
                  </Box>
                </Box>
              </Box>

              <Typography
                variant="body2"
                className="text-[12px]"
              >
                {riskCase.notes || "No additional notes."}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
