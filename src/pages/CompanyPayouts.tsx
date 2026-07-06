// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { getAdminCompany, listAdminCompanies, listAdminPayouts, type AdminCompanyResponse } from "../services/api/adminApi";

function AdminFinanceCompanyLayout({ children }) {
  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography variant="h6" className="font-semibold tracking-tight" color="text.primary">
            Company Payout Config & History
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Live company metadata only. Payout configuration persistence is not exposed by the backend yet.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col gap-3">{children}</Box>
    </Box>
  );
}

export default function CompanyPayoutConfigPage() {
  const { companyId } = useParams();
  const [companies, setCompanies] = useState<AdminCompanyResponse[]>([]);
  const [company, setCompany] = useState<AdminCompanyResponse | null>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await listAdminCompanies();
        if (cancelled) return;
        setCompanies(list);

        const fromRoute = companyId ? list.find((item) => item.id === companyId) : null;
        if (fromRoute) {
          setCompany(fromRoute);
          return;
        }

        if (companyId) {
          const co = await getAdminCompany(companyId);
          setCompany(co);
          const payoutRows = await listAdminPayouts({ search: co?.id || companyId, limit: 50 }).then(r => r.items).catch(() => []);
          setPayouts(payoutRows);
          return;
        }

        setCompany(list[0] ?? null);
        if (list[0]) {
          const payoutRows = await listAdminPayouts({ search: list[0].id, limit: 50 }).then(r => r.items).catch(() => []);
          setPayouts(payoutRows);
        }
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message ?? "Failed to load company payouts");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const activeVerticals = useMemo(() => {
    if (!company) return [];
    return Object.entries(company.verticals).filter(([, enabled]) => enabled).map(([key]) => key);
  }, [company]);

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

  if (!company) {
    return <Alert severity="info">No company returned from the backend.</Alert>;
  }

  return (
    <AdminFinanceCompanyLayout>
      <Alert severity="info">
        This screen is now bound to live company metadata only. Payout configuration and payout history endpoints are still pending on the backend.
      </Alert>

      <Box className="flex flex-col lg:flex-row gap-4">
        <Card
          elevation={1}
          sx={{
            flex: 1,
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.5)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Box className="flex items-center justify-between gap-2">
              <Box>
                <Typography variant="subtitle2" className="font-semibold">
                  {company.companyName}
                </Typography>
                <Typography variant="caption" className="text-[11px] text-slate-500">
                  Contact {company.contactEmail || "not set"} · {company.contactPhone || "no phone"}
                </Typography>
              </Box>
              <Chip
                size="small"
                label={company.status}
                color={company.status === "active" ? "success" : company.status === "suspended" ? "warning" : "default"}
                sx={{ fontSize: 10, height: 22 }}
              />
            </Box>

            <Divider className="!my-1" />

            <Box className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <InfoField label="Registration number" value={company.registrationNumber || "n/a"} />
              <InfoField label="Tax ID" value={company.taxId || "n/a"} />
              <InfoField label="Active verticals" value={activeVerticals.length ? activeVerticals.join(", ") : "none"} />
              <InfoField label="Backend company ID" value={company.id} />
            </Box>

            <Typography variant="caption" className="text-[11px] text-slate-500">
              Commission, holdback, and payout schedule persistence are not available yet from the backend.
            </Typography>

            <Box className="flex gap-2 mt-1 justify-end">
              <Button variant="outlined" size="small" sx={{ textTransform: "none", borderRadius: 999, fontSize: 12 }} disabled>
                Test payout
              </Button>
              <Button
                variant="contained"
                size="small"
                sx={{
                  textTransform: "none",
                  borderRadius: 999,
                  fontSize: 12,
                  bgcolor: "#03cd8c",
                }}
                disabled
              >
                Save payout config
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card
          elevation={1}
          sx={{
            flex: 1,
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.5)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <Typography variant="subtitle2" className="font-semibold">
              Payout history
            </Typography>
            <Divider className="!my-1" />
            {payouts.length === 0 ? (
              <Alert severity="info">No live payouts found for this company.</Alert>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "action.hover" }}>
                      <TableCell>ID</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payouts.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell sx={{ fontSize: 12, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}>{p.id}</TableCell>
                        <TableCell>{p.currency} {p.amount?.toLocaleString()}</TableCell>
                        <TableCell>{p.status}</TableCell>
                        <TableCell>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>
    </AdminFinanceCompanyLayout>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <Box className="flex flex-col gap-1">
      <Typography variant="caption" className="text-[11px] text-slate-500">
        {label}
      </Typography>
      <Typography variant="body2" className="font-medium" color="text.primary">
        {value}
      </Typography>
    </Box>
  );
}
