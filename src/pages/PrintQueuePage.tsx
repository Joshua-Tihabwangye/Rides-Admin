import React from 'react';
import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PrintIcon from '@mui/icons-material/Print';

export default function PrintQueuePage() {
  const navigate = useNavigate();
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Print Queue
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Bulk label printing queue for the admin delivery workspace.
        </Typography>
      </Box>
      <Card>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <PrintIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Bulk print queue
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select packages from the delivery detail page to print. Phase 16 will wire the full bulk-print workflow.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/admin/deliveries')} sx={{ textTransform: 'none', borderRadius: 2 }}>
            Go to Deliveries
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
