import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

export default function LabelExceptionsPage() {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Label Exceptions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Failed, revoked, and regeneration history for delivery labels.
        </Typography>
      </Box>
      <Card>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <WarningIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Label exceptions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 480, mx: 'auto' }}>
            This page will surface failed and revoked labels, including regeneration history and audit reasons. Phase 16 will add full exception handling.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
