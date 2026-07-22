import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';

export default function BlankLabelStockPage() {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Blank Label Stock
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage pre-printed blank label inventory and activation.
        </Typography>
      </Box>
      <Card>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <InventoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Coming soon
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 480, mx: 'auto' }}>
            Blank label stock is feature-flagged until the main label workflow is stable.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
