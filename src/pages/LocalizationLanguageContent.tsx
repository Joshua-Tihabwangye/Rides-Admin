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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { listAdminContent, type AdminContentItem } from "../services/api/adminApi";

const CONTENT_KIND = "localization-bundles";

type LocalizationBundleDocument = Record<string, unknown> & {
  title?: string;
  language?: string;
  namespace?: string;
  status?: string;
  entries?: Record<string, string>;
};

function AdminLocalizationLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography variant="h6" className="font-semibold tracking-tight" color="text.primary">
            Localization & Language Content
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Translation bundles loaded from backend admin content.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col gap-3">{children}</Box>
    </Box>
  );
}

function entryCount(entries: unknown) {
  return entries && typeof entries === "object" && !Array.isArray(entries) ? Object.keys(entries).length : 0;
}

function updatedAt(value?: number) {
  if (!value) return "Not updated";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

export default function LocalizationLanguageContentPage() {
  const [bundles, setBundles] = useState<Array<AdminContentItem<LocalizationBundleDocument>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listAdminContent<LocalizationBundleDocument>(CONTENT_KIND);
      setBundles(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load localization bundles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminLocalizationLayout>
      {error ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void load()}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      ) : null}

      <Card elevation={1} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.5)" }}>
        <CardContent className="p-4 flex flex-col gap-3">
          <Box className="flex items-center justify-between gap-2">
            <Typography variant="subtitle2" className="font-semibold">
              Backend bundles
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => void load()}
              disabled={loading}
              sx={{ textTransform: "none", borderRadius: 999, fontSize: 12 }}
            >
              Refresh
            </Button>
          </Box>
          <Divider className="!my-1" />

          {loading ? (
            <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={28} />
            </Box>
          ) : bundles.length === 0 ? (
            <Alert severity="info">No localization bundles were returned by the backend.</Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "action.hover" }}>
                    <TableCell>Title</TableCell>
                    <TableCell>Language</TableCell>
                    <TableCell>Namespace</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Entries</TableCell>
                    <TableCell>Updated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bundles.map((bundle) => (
                    <TableRow key={bundle.id}>
                      <TableCell>{bundle.title || "Localization bundle"}</TableCell>
                      <TableCell>{bundle.language || "-"}</TableCell>
                      <TableCell>{bundle.namespace || "-"}</TableCell>
                      <TableCell>
                        <Chip size="small" label={bundle.status || "draft"} sx={{ fontSize: 10, height: 22 }} />
                      </TableCell>
                      <TableCell align="right">{entryCount(bundle.entries)}</TableCell>
                      <TableCell>{updatedAt(bundle.updatedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </AdminLocalizationLayout>
  );
}
