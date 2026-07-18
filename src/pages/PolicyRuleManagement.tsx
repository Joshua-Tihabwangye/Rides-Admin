// @ts-nocheck
import React from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";

function AdminPolicyLayout({ children }) {
  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography variant="h6" className="font-semibold tracking-tight" color="text.primary">
            Policy & Rule Management
          </Typography>
          <Typography variant="caption" className="text-[11px] text-slate-600">
            Define automation rules for safety, risk and pricing. Data is fetched from the backend.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col gap-3">{children}</Box>
    </Box>
  );
}

export default function PolicyRuleManagementPage() {
  return (
    <AdminPolicyLayout>
      <Card
        elevation={1}
        sx={{
          borderRadius: 8,
          border: "1px solid rgba(148,163,184,0.5)",
        }}
      >
        <CardContent className="p-4 flex flex-col gap-3">
          <Typography variant="subtitle2" className="font-semibold">
            No backend rules configured
          </Typography>
          <Typography variant="body2" className="text-[12px] text-slate-500">
            Policy rules are managed by the backend governance service. There are no active rules to display.
            Once rules are configured in the backend, they will appear here.
          </Typography>
        </CardContent>
      </Card>
    </AdminPolicyLayout>
  );
}
