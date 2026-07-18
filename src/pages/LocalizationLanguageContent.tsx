// @ts-nocheck
import React from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

function AdminLocalizationLayout({ children }) {
  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography variant="h6" className="font-semibold tracking-tight" color="text.primary">
            Localization & Language Content
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Manage translation bundles and ensure each language is complete before rollout. Data is fetched from the
            backend.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col gap-3">{children}</Box>
    </Box>
  );
}

export default function LocalizationLanguageContentPage() {
  return (
    <AdminLocalizationLayout>
      <Card
        elevation={1}
        sx={{
          borderRadius: 8,
          border: "1px solid rgba(148,163,184,0.5)",
        }}
      >
        <CardContent className="p-4 flex flex-col gap-3">
          <Typography variant="subtitle2" className="font-semibold">
            No localization bundles configured
          </Typography>
          <Typography variant="body2" className="text-[12px] text-slate-500">
            Translation bundles are managed by the backend. Once bundles are configured, they will be fetched and
            displayed here.
          </Typography>
        </CardContent>
      </Card>
    </AdminLocalizationLayout>
  );
}
