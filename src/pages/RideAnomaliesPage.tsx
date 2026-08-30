import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { getAdminRideAnomalies } from '../services/api/adminApi';
import type { AdminRideAnomalyItem } from '../services/api/adminApi';

const FLAG_OPTIONS = [
  { value: '', label: 'All anomalies' },
  { value: 'ROUTE_DEVIATION', label: 'Route deviation' },
  { value: 'EXCESS_DURATION', label: 'Excess duration' },
  { value: 'EXCESS_DISTANCE', label: 'Excess distance' },
  { value: 'LOW_CONFIDENCE', label: 'Low confidence' },
  { value: 'MISSING_BREADCRUMBS', label: 'Missing breadcrumbs' },
];

export default function RideAnomaliesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AdminRideAnomalyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flag, setFlag] = useState('');

  const load = (selectedFlag: string) => {
    setLoading(true);
    setError(null);
    getAdminRideAnomalies(selectedFlag || undefined, 200)
      .then((res) => setItems(res.items ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load anomalies'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(flag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flag]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <WarningAmberIcon color="warning" />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Ride Anomalies
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="anomaly-flag-label">Anomaly type</InputLabel>
              <Select
                labelId="anomaly-flag-label"
                label="Anomaly type"
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
              >
                {FLAG_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="outlined" onClick={() => load(flag)}>
              Refresh
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Ride</TableCell>
                  <TableCell>Anomaly flags</TableCell>
                  <TableCell>Actual distance</TableCell>
                  <TableCell>Actual duration</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Breadcrumbs</TableCell>
                  <TableCell>Computed</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        No anomalies found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{item.rideId.slice(0, 8)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {item.anomalyFlags.length === 0 ? (
                            <Chip size="small" color="success" label="None" />
                          ) : (
                            item.anomalyFlags.map((f) => (
                              <Chip key={f} size="small" color="warning" label={f} />
                            ))
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{item.actualDistanceKm ?? '—'} km</TableCell>
                      <TableCell>{item.actualDurationMinutes ?? '—'} min</TableCell>
                      <TableCell>{item.confidence ?? '—'}</TableCell>
                      <TableCell>{item.breadcrumbCount ?? '—'}</TableCell>
                      <TableCell>{item.computedAt ? new Date(item.computedAt).toLocaleString() : '—'}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => navigate(`/admin/rides/${item.rideId}`)}>
                          Inspect
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
