import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Pagination,
  Select,
  Typography,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import { getAdminDeliveryAuditLogs } from '../services/api/adminApi';
import type { AdminDeliveryAuditLogResponse } from '../services/api/adminApi';

const ACTION_LABELS: Record<string, string> = {
  STATUS_CHANGE: 'Status change',
  FIELD_UPDATE: 'Field update',
  ACCESS: 'Access',
  PROOF_UPLOAD: 'Proof upload',
  PROOF_REVIEW: 'Proof review',
  PAYMENT_COLLECTED: 'Payment collected',
  PAYMENT_REFUNDED: 'Payment refunded',
  CREDENTIAL_GENERATED: 'Credential generated',
  CREDENTIAL_VERIFIED: 'Credential verified',
  NOTE_ADDED: 'Note added',
};

function formatActor(entry: AdminDeliveryAuditLogResponse): string {
  const role = entry.actorRole?.toLowerCase() ?? '';
  const label = role.charAt(0).toUpperCase() + role.slice(1);
  return `${label} (${entry.actorId.slice(0, 8)}…)`;
}

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

export default function AuditTrailViewer({ orderId }: { orderId: string }) {
  const [entries, setEntries] = useState<AdminDeliveryAuditLogResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 25;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const result = await getAdminDeliveryAuditLogs(orderId, {
          action: actionFilter || undefined,
          page,
          limit,
        });
        if (!cancelled) {
          setEntries(result.items);
          setTotal(result.total);
        }
      } catch {
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [orderId, actionFilter, page]);

  const actionOptions = useMemo(() => {
    const seen = new Set<string>();
    seen.add('');
    return Object.keys(ACTION_LABELS).filter((key) => {
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, []);

  const totalPages = Math.ceil(total / limit);

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="audit-action-filter-label">Action type</InputLabel>
          <Select
            labelId="audit-action-filter-label"
            value={actionFilter}
            label="Action type"
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="">All actions</MenuItem>
            {actionOptions.map((action) => (
              <MenuItem key={action} value={action}>
                {ACTION_LABELS[action] ?? action}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography variant="caption" color="text.secondary">
          {total} entr{total === 1 ? 'y' : 'ies'}
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : entries.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 2 }}>
          No audit entries found.
        </Typography>
      ) : (
        <>
          <List dense disablePadding>
            {entries.map((entry) => (
              <ListItem
                key={entry.id}
                alignItems="flex-start"
                sx={{ px: 0, borderBottom: '1px solid', borderColor: 'divider' }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <HistoryIcon fontSize="small" color="action" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" fontWeight={600}>
                        {ACTION_LABELS[entry.action] ?? entry.action}
                      </Typography>
                      <Chip size="small" label={entry.actorRole} sx={{ height: 20, fontSize: 10 }} />
                      {entry.field && (
                        <Chip size="small" variant="outlined" label={entry.field} sx={{ height: 20, fontSize: 10 }} />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.25 }}>
                      <Typography variant="caption" component="span" color="text.secondary">
                        {formatActor(entry)}
                      </Typography>
                      <Typography variant="caption" component="span" color="text.disabled" sx={{ mx: 0.5 }}>
                        ·
                      </Typography>
                      <Typography variant="caption" component="span" color="text.disabled">
                        {formatTimestamp(entry.timestamp)}
                      </Typography>
                      {entry.oldValue != null && entry.newValue != null && (
                        <Box sx={{ mt: 0.25, fontFamily: 'monospace', fontSize: 12, color: 'text.secondary' }}>
                          {entry.oldValue} → {entry.newValue}
                        </Box>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
              <Pagination
                size="small"
                count={totalPages}
                page={page}
                onChange={(_, p) => setPage(p)}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
