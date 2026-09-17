import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  getAdminExperimentResults,
  type AdminExperimentResultsResponse,
} from "../services/api/adminApi";

function formatPercent(value: number | null) {
  if (value == null) return "—";
  return `${(Math.abs(value) > 1 ? value : value * 100).toFixed(1)}%`;
}

function formatMetric(value: unknown) {
  if (value == null || value === "") return "—";
  if (typeof value === "number") return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

export default function ExperimentResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState<AdminExperimentResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!id) {
        setError("Experiment ID is missing.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getAdminExperimentResults(id);
        if (!cancelled) setResults(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load experiment results");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const metricRows = useMemo(() => Object.entries(results?.metrics ?? {}), [results?.metrics]);
  const title = String(results?.experiment.name ?? results?.experiment.key ?? results?.experiment.id ?? "Experiment");

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

  if (!results) {
    return <Alert severity="info">No experiment results returned by the backend.</Alert>;
  }

  return (
    <Box className="p-4 sm:p-6 flex flex-col gap-6">
      <Box className="flex items-center gap-4">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/admin/system/flags")}
          sx={{ textTransform: "none", color: "text.secondary" }}
        >
          Back
        </Button>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Backend experiment results · updated {new Date(results.source.updatedAt).toLocaleString()}
          </Typography>
        </Box>
        <Chip label={results.summary.status} size="small" color={results.summary.status === "running" ? "success" : "default"} sx={{ ml: "auto" }} />
      </Box>

      <Box className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <SummaryCard label="Sample size" value={results.summary.sampleSize.toLocaleString()} />
        <SummaryCard label="Conversion" value={formatPercent(results.summary.conversionRate)} />
        <SummaryCard label="Confidence" value={formatPercent(results.summary.confidence)} />
        <SummaryCard label="Winner" value={results.summary.winner ?? "—"} />
      </Box>

      <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 2 }}>
            Variant Performance
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {results.variants.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Variant</TableCell>
                  <TableCell>Allocation</TableCell>
                  <TableCell>Users</TableCell>
                  <TableCell>Conversions</TableCell>
                  <TableCell>Conversion rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.variants.map((variant) => (
                  <TableRow key={variant.id}>
                    <TableCell>{variant.name}</TableCell>
                    <TableCell>{formatPercent(variant.allocation)}</TableCell>
                    <TableCell>{variant.users.toLocaleString()}</TableCell>
                    <TableCell>{variant.conversions.toLocaleString()}</TableCell>
                    <TableCell>{formatPercent(variant.conversionRate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Alert severity="info">
              This experiment exists in the backend, but no variant result rows have been recorded yet.
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 2 }}>
            Recorded Metrics
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {metricRows.length > 0 ? (
            <Box className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {metricRows.map(([key, value]) => (
                <Box key={key} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {key}
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {formatMetric(value)}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Alert severity="info">
              No backend metrics are attached to this experiment record yet.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card elevation={1} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)" }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h6" fontWeight={700}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}
