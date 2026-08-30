import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Alert,
  Typography,
  Chip,
  Button,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { listAdminReturnRequests, listAdminDisputes } from '../../services/api/adminApi';
import type { AdminReturnRequestView, AdminDisputeView } from '../../services/api/adminApi';

function StatusChip({ status, color }: { status: string; color?: 'success' | 'error' | 'warning' | 'default' }) {
  return <Chip size="small" color={color ?? 'default'} label={status} />;
}

export default function DeliveryReturnsDisputesSection({ orderId }: { orderId: string }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [returns, setReturns] = useState<AdminReturnRequestView[]>([]);
  const [disputes, setDisputes] = useState<AdminDisputeView[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([
      listAdminReturnRequests({ orderId }).catch(() => []),
      listAdminDisputes({ orderId }).catch(() => []),
    ])
      .then(([r, d]) => {
        if (!active) return;
        setReturns(Array.isArray(r) ? r : []);
        setDisputes(Array.isArray(d) ? d : []);
      })
      .catch((err) => active && setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Return requests
      </Typography>
      {returns.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>No return requests linked to this delivery.</Alert>
      ) : (
        returns.map((r) => (
          <Card key={r.id} variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <StatusChip status={r.status} />
                <Typography variant="body2">{r.reason ?? ''}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Refund eligible: {r.refundEligibleAmountCents != null ? `${(r.refundEligibleAmountCents / 100).toLocaleString()}` : '—'}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Button size="small" onClick={() => navigate('/admin/returns/requests')}>
                  Open returns
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))
      )}

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Disputes
      </Typography>
      {disputes.length === 0 ? (
        <Alert severity="info">No disputes linked to this delivery.</Alert>
      ) : (
        disputes.map((d) => (
          <Card key={d.id} variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <StatusChip status={d.status} color={d.status === 'RESOLVED' ? 'success' : 'warning'} />
                <Typography variant="body2">{d.reason ?? ''}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {d.refundAmountCents != null ? `Refund: ${(d.refundAmountCents / 100).toLocaleString()}` : ''}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Button size="small" onClick={() => navigate('/admin/disputes')}>
                  Open disputes
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
}
