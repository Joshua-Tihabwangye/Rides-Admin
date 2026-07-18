// @ts-nocheck
import React from "react";
import { Box, Card, CardContent, Typography, Divider } from "@mui/material";
import { useParams } from "react-router-dom";

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

function AdminFinanceTaxLayout({ children }) {
  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography variant="h6" className="font-semibold tracking-tight" color="text.primary">
            Taxes & Invoicing
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Configure tax rules and invoice templates per region. All data is fetched from the backend.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col gap-3">{children}</Box>
    </Box>
  );
}

function TaxRegionEditor({ regionId }) {
  return (
    <Box>
      <Card elevation={1} sx={{ borderRadius: 4, maxWidth: 600 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Edit Tax Configuration: {regionId}
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="body2" className="text-[12px] text-slate-500">
            Tax region editing is managed by the backend. No tax configuration is available from the backend for this
            region.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default function TaxesInvoicingPage() {
  const { regionId } = useParams();

  if (regionId) {
    return (
      <AdminFinanceTaxLayout>
        <TaxRegionEditor regionId={regionId} />
      </AdminFinanceTaxLayout>
    );
  }

  return (
    <AdminFinanceTaxLayout>
      <Box className="flex flex-col lg:flex-row gap-4">
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
              Region tax overview
            </Typography>
            <Divider className="!my-1" />
            <Typography variant="body2" className="text-[12px] text-slate-500">
              No tax regions are configured in the backend. Once region tax settings are stored in the backend, they
              will be fetched and displayed here.
            </Typography>
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
              Invoice template settings
            </Typography>
            <Typography variant="caption" className="text-[11px] text-slate-500">
              Header/footer text, logo placement and line-item layout. These are fetched from the backend.
            </Typography>
            <Divider className="!my-1" />
            <Typography variant="body2" className="text-[12px] text-slate-500">
              No invoice template settings are available from the backend.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </AdminFinanceTaxLayout>
  );
}
