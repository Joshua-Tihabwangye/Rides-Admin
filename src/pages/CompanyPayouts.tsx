// @ts-nocheck
import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Divider,
  TextField,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
} from "@mui/material";

// I2 – Company Payout Config & History (Light/Dark, EVzone themed)
// Routes:
//  - /admin/finance/companies
//  - /admin/finance/companies/:companyId
//
// This page covers payout cycles, payout methods, holdbacks, and payout
// history per company. It is conceptually similar to other Finance pages
// (I1, I3) and should log AuditLog-style entries when saving config.
//
// Manual test cases:
// 1) Initial render
//    - Light mode by default.
//    - Header shows EVZONE ADMIN and subtitle "Finance · Company payouts".
//    - Title "Company Payout Config & History" visible.
//    - Left card shows payout configuration form fields (frequency, day,
//      method, currency, destination, holdback).
//    - Right card shows payout history table with a few sample rows.
// 2) Theme toggle
//    - Tapping the toggle in the header flips between light and dark shell
//      colours; form values remain intact.
// 3) Save config
//    - Editing any field and clicking "Save payout config" logs a payload and
//      an AuditLog-style object to the console.
// 4) Test payout
//    - Clicking "Test payout" logs a message about a test payout for the
//      sample company.
// 5) Row click safety
//    - Clicking on history rows should not throw errors (they are read-only
//      in this sample).

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

function AdminFinanceCompanyLayout({ children }) {
  return (
    <Box>
      {/* Title */}
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography
            variant="h6"
            className="font-semibold tracking-tight"
            color="text.primary"
          >
            Company Payout Config & History
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Control payout cycles, methods and holdbacks for each company, and
            review payout history.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col gap-3">
        {children}
      </Box>
    </Box>
  );
}

const SAMPLE_COMPANY = {
  id: "GREENMOVE-UG",
  name: "GreenMove Fleet",
  regions: "Kampala, Entebbe",
};

const SAMPLE_PAYOUTS = [
  {
    id: 1,
    period: "2025-06-01 → 2025-06-07",
    amount: "$3,420",
    status: "Completed",
    method: "Bank (UGX)",
  },
  {
    id: 2,
    period: "2025-05-25 → 2025-05-31",
    amount: "$3,180",
    status: "Completed",
    method: "Bank (UGX)",
  },
  {
    id: 3,
    period: "2025-05-18 → 2025-05-24",
    amount: "$2,980",
    status: "Pending",
    method: "Bank (UGX)",
  },
];

export default function CompanyPayoutConfigPage() {
  const [company] = useState(SAMPLE_COMPANY);
  const [config, setConfig] = useState({
    frequency: "Weekly",
    dayOfWeek: "Monday",
    method: "Bank transfer",
    currency: "UGX",
    accountLast4: "9876",
    holdbackPercent: "5%",
  });

  const handleConfigChange = (field) => (event) => {
    setConfig((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSaveConfig = () => {
    console.log("Saving payout config for company:", company.id, config);
    console.log("AuditLog:", {
      event: "COMPANY_PAYOUT_CONFIG_UPDATED",
      companyId: company.id,
      companyName: company.name,
      payload: config,
      at: new Date().toISOString(),
      actor: "Admin (simulated)",
    });
  };

  const handleTestPayout = () => {
    console.log("Test payout triggered for company:", company.id);
  };

  return (
    <AdminFinanceCompanyLayout>
      <Box className="flex flex-col lg:flex-row gap-4">
        {/* Left – payout configuration */}
        <Card
          elevation={1}
          sx={{
            flex: 1,
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.5)",
            background: "linear-gradient(145deg, #f9fafb, #ffffff)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Box className="flex items-center justify-between gap-2">
              <Box>
                <Typography
                  variant="subtitle2"
                  className="font-semibold text-slate-900"
                >
                  {company.name}
                </Typography>
                <Typography
                  variant="caption"
                  className="text-[11px] text-slate-500"
                >
                  {company.regions}
                </Typography>
              </Box>
              <Chip
                size="small"
                label="Payout config"
                sx={{ fontSize: 10, height: 22 }}
              />
            </Box>

            <Divider className="!my-1" />

            <Box className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <FieldWithLabel label="Payout frequency">
                <Select
                  size="small"
                  fullWidth
                  value={config.frequency}
                  onChange={handleConfigChange("frequency")}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
                >
                  <MenuItem value="Weekly">Weekly</MenuItem>
                  <MenuItem value="Bi-weekly">Bi-weekly</MenuItem>
                  <MenuItem value="Monthly">Monthly</MenuItem>
                </Select>
              </FieldWithLabel>

              <FieldWithLabel label="Payout day (for weekly/bi-weekly)">
                <Select
                  size="small"
                  fullWidth
                  value={config.dayOfWeek}
                  onChange={handleConfigChange("dayOfWeek")}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
                >
                  <MenuItem value="Monday">Monday</MenuItem>
                  <MenuItem value="Tuesday">Tuesday</MenuItem>
                  <MenuItem value="Wednesday">Wednesday</MenuItem>
                  <MenuItem value="Thursday">Thursday</MenuItem>
                  <MenuItem value="Friday">Friday</MenuItem>
                </Select>
              </FieldWithLabel>

              <FieldWithLabel label="Payout method">
                <Select
                  size="small"
                  fullWidth
                  value={config.method}
                  onChange={handleConfigChange("method")}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
                >
                  <MenuItem value="Bank transfer">Bank transfer</MenuItem>
                  <MenuItem value="Mobile money">Mobile money</MenuItem>
                  <MenuItem value="Wallet balance">Wallet balance</MenuItem>
                </Select>
              </FieldWithLabel>

              <FieldWithLabel label="Settlement currency">
                <Select
                  size="small"
                  fullWidth
                  value={config.currency}
                  onChange={handleConfigChange("currency")}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
                >
                  <MenuItem value="UGX">UGX</MenuItem>
                  <MenuItem value="KES">KES</MenuItem>
                  <MenuItem value="NGN">NGN</MenuItem>
                  <MenuItem value="USD">USD</MenuItem>
                </Select>
              </FieldWithLabel>

              <FieldWithLabel label="Destination account (last 4)">
                <TextField
                  size="small"
                  fullWidth
                  value={config.accountLast4}
                  onChange={handleConfigChange("accountLast4")}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
                />
              </FieldWithLabel>

              <FieldWithLabel label="Holdback percentage">
                <TextField
                  size="small"
                  fullWidth
                  value={config.holdbackPercent}
                  onChange={handleConfigChange("holdbackPercent")}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
                />
              </FieldWithLabel>
            </Box>

            <Typography
              variant="caption"
              className="text-[11px] text-slate-500"
            >
              Holdback is retained for disputes and adjustments. Payout config
              changes should be recorded in the audit log.
            </Typography>

            <Box className="flex gap-2 mt-1 justify-end">
              <Button
                variant="outlined"
                size="small"
                sx={{
                  textTransform: "none",
                  borderRadius: 999,
                  fontSize: 12,
                }}
                onClick={handleTestPayout}
              >
                Test payout
              </Button>
              <Button
                variant="contained"
                size="small"
                sx={{
                  textTransform: "none",
                  borderRadius: 999,
                  fontSize: 12,
                  bgcolor: EV_COLORS.primary,
                  "&:hover": { bgcolor: "#0fb589" },
                }}
                onClick={handleSaveConfig}
              >
                Save payout config
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Right – payout history */}
        <Card
          elevation={1}
          sx={{
            flex: 1,
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.5)",
            background: "linear-gradient(145deg, #fefce8, #ffffff)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <Typography
              variant="subtitle2"
              className="font-semibold text-slate-900"
            >
              Payout history
            </Typography>
            <Divider className="!my-1" />
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f3f4f6" }}>
                    <TableCell>Period</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Method</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {SAMPLE_PAYOUTS.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.period}</TableCell>
                      <TableCell>{row.amount}</TableCell>
                      <TableCell>{row.status}</TableCell>
                      <TableCell>{row.method}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography
              variant="caption"
              className="text-[11px] text-slate-500 mt-1"
            >
              For full payout exports and reconciliation, use the Finance
              module reports.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </AdminFinanceCompanyLayout>
  );
}

function FieldWithLabel({ label, children }) {
  return (
    <Box className="flex flex-col gap-1">
      <Typography
        variant="caption"
        className="text-[11px] text-slate-500"
      >
        {label}
      </Typography>
      {children}
    </Box>
  );
}
