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
  Select,
  MenuItem,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
} from "@mui/material";

// H3 – Policy & Rule Management (Light/Dark, EVzone themed)
// Route suggestion: /admin/policies
// Central place to define rules like "IF 3 low ratings in 5 trips, THEN
// require retraining". Uses a generic RuleBuilder pattern similar to F4.
//
// Manual test cases:
// 1) Initial render
//    - Light mode by default.
//    - Header shows EVZONE ADMIN and subtitle "Policy & Rule Management".
//    - Left card lists a few sample rules with type (Safety/Risk/Pricing).
//    - Right side shows a rule editor with Event, Condition, Window and
//      Action fields.
// 2) Theme toggle
//    - Toggle Light/Dark; selected rule and editor state remain intact.
// 3) Select rule
//    - Clicking a rule in the table selects it and updates the editor fields
//      (demo initial mapping).
// 4) Edit rule
//    - Change fields in the rule builder and click "Save rule"; expect a
//      console log with the new rule definition.
// 5) New rule
//    - Click "+ New rule"; editor should clear to a default, and the next
//      "Save rule" logs a new rule (for now, no persistence in the list).

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

function AdminPolicyLayout({ children }) {
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
            Policy & Rule Management
          </Typography>
          <Typography
            variant="caption"
            className={`text-[11px] ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
          >
            Define automation rules for safety, risk and pricing – the same
            pattern used in Promotions.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col gap-3">
        {children}
      </Box>
    </Box>
  );
}

const SAMPLE_RULES = [
  {
    id: "RULE-LOW-RATING",
    name: "Low rating streak",
    type: "Safety",
    scope: "Drivers",
    description: "IF rating < 3.0 in 5 trips, THEN require retraining.",
  },
  {
    id: "RULE-FRAUD-REFUND",
    name: "Refund abuse",
    type: "Risk",
    scope: "Riders",
    description: "IF >3 refunds in 7 days, THEN limit cash trips.",
  },
  {
    id: "RULE-CANCEL-DRIVER",
    name: "Driver cancellations",
    type: "Safety",
    scope: "Drivers",
    description:
      "IF cancellation rate > 10% over 7 days, THEN flag for review.",
  },
];

function RuleBuilder({ rule, onChange, onSave }) {
  const handleChange = (field) => (event) => {
    const value = event.target.value;
    onChange({ ...rule, [field]: value });
  };

  const handleNumberChange = (field) => (event) => {
    const value = Number(event.target.value || 0);
    onChange({ ...rule, [field]: value });
  };

  const handleSave = () => {
    console.log("Policy rule saved:", rule);
    if (onSave) onSave(rule);
  };

  return (
    <Card
      elevation={1}
      sx={{
        borderRadius: 8,
        border: "1px solid rgba(148,163,184,0.5)",
        background: "linear-gradient(145deg, #f9fafb, #ffffff)",
      }}
    >
      <CardContent className="p-4 flex flex-col gap-3">
        <Typography
          variant="subtitle2"
          className="font-semibold text-slate-900"
        >
          Rule builder
        </Typography>
        <Typography
          variant="caption"
          className="text-[11px] text-slate-500"
        >
          Example pattern: IF [event] AND [count] within [time window] THEN
          [action]. Same shape can be reused for promotions and risk rules.
        </Typography>

        <Box className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <Box className="flex flex-col gap-1">
            <Typography
              variant="caption"
              className="text-[11px] text-slate-500"
            >
              Event
            </Typography>
            <Select
              size="small"
              value={rule.event}
              onChange={handleChange("event")}
              fullWidth
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
            >
              <MenuItem value="Low rating">
                Low rating on trip
              </MenuItem>
              <MenuItem value="Refund requested">Refund requested</MenuItem>
              <MenuItem value="Cancellation">
                Trip cancellation
              </MenuItem>
            </Select>
          </Box>

          <Box className="flex flex-col gap-1">
            <Typography
              variant="caption"
              className="text-[11px] text-slate-500"
            >
              Applies to
            </Typography>
            <Select
              size="small"
              value={rule.appliesTo}
              onChange={handleChange("appliesTo")}
              fullWidth
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
            >
              <MenuItem value="Riders">Riders</MenuItem>
              <MenuItem value="Drivers">Drivers</MenuItem>
              <MenuItem value="Companies">Companies</MenuItem>
            </Select>
          </Box>

          <Box className="flex flex-col gap-1">
            <Typography
              variant="caption"
              className="text-[11px] text-slate-500"
            >
              Count threshold
            </Typography>
            <TextField
              size="small"
              type="number"
              value={rule.count}
              onChange={handleNumberChange("count")}
              inputProps={{ min: 1 }}
              sx={{
                "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" },
                "& .MuiInputBase-input": { fontSize: 12 },
              }}
            />
          </Box>

          <Box className="flex flex-col gap-1">
            <Typography
              variant="caption"
              className="text-[11px] text-slate-500"
            >
              Time window
            </Typography>
            <Select
              size="small"
              value={rule.window}
              onChange={handleChange("window")}
              fullWidth
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
            >
              <MenuItem value="24h">Last 24h</MenuItem>
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
            </Select>
          </Box>

          <Box className="flex flex-col gap-1 md:col-span-2">
            <Typography
              variant="caption"
              className="text-[11px] text-slate-500"
            >
              Action
            </Typography>
            <Select
              size="small"
              value={rule.action}
              onChange={handleChange("action")}
              fullWidth
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
            >
              <MenuItem value="Require retraining">
                Require retraining
              </MenuItem>
              <MenuItem value="Limit features">Limit features</MenuItem>
              <MenuItem value="Suspend account">Suspend account</MenuItem>
              <MenuItem value="Notify Safety desk">
                Notify Safety desk only
              </MenuItem>
            </Select>
          </Box>
        </Box>

        <Box className="flex items-center justify-between mt-1">
          <Typography
            variant="caption"
            className="text-[11px] text-slate-500"
          >
            IF {rule.event} happens {rule.count} times for {rule.appliesTo} in
            {" "}
            {rule.window}, THEN {rule.action}.
          </Typography>
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
            onClick={handleSave}
          >
            Save rule
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function PolicyRuleManagementPage() {
  const [rules] = useState(SAMPLE_RULES);
  const [selectedRuleId, setSelectedRuleId] = useState(SAMPLE_RULES[0].id);
  const [editingRule, setEditingRule] = useState({
    event: "Low rating",
    appliesTo: "Drivers",
    count: 3,
    window: "7d",
    action: "Require retraining",
  });

  const handleRuleRowClick = (rule) => {
    setSelectedRuleId(rule.id);
    // Demo mapping of rule list to builder (would come from backend in real app)
    if (rule.id === "RULE-LOW-RATING") {
      setEditingRule({
        event: "Low rating",
        appliesTo: "Drivers",
        count: 3,
        window: "7d",
        action: "Require retraining",
      });
    } else if (rule.id === "RULE-FRAUD-REFUND") {
      setEditingRule({
        event: "Refund requested",
        appliesTo: "Riders",
        count: 3,
        window: "7d",
        action: "Limit features",
      });
    } else if (rule.id === "RULE-CANCEL-DRIVER") {
      setEditingRule({
        event: "Cancellation",
        appliesTo: "Drivers",
        count: 5,
        window: "7d",
        action: "Notify Safety desk",
      });
    }
  };

  const handleBuilderChange = (nextRule) => {
    setEditingRule(nextRule);
  };

  const handleNewRule = () => {
    setSelectedRuleId("NEW-RULE");
    setEditingRule({
      event: "Low rating",
      appliesTo: "Riders",
      count: 1,
      window: "24h",
      action: "Notify Safety desk",
    });
  };

  const handleSaveRule = (savedRule) => {
    console.log("Save clicked for rule (new or existing):", {
      selectedRuleId,
      definition: savedRule,
    });
  };

  return (
    <AdminPolicyLayout>
      <Box className="flex flex-col lg:flex-row gap-4">
        {/* Left – Rule list */}
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
              <Typography
                variant="subtitle2"
                className="font-semibold text-slate-900"
              >
                Rules
              </Typography>
              <Button
                variant="outlined"
                size="small"
                sx={{
                  textTransform: "none",
                  borderRadius: 999,
                  fontSize: 11,
                }}
                onClick={handleNewRule}
              >
                + New rule
              </Button>
            </Box>
            <Divider className="!my-1" />

            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f3f4f6" }}>
                    <TableCell>Rule</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Scope</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow
                      key={rule.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      selected={rule.id === selectedRuleId}
                      onClick={() => handleRuleRowClick(rule)}
                    >
                      <TableCell>{rule.name}</TableCell>
                      <TableCell>{rule.type}</TableCell>
                      <TableCell>{rule.scope}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography
              variant="caption"
              className="text-[11px] text-slate-500 mt-1"
            >
              Rule outcomes feed into Safety & Risk centers as alerts or
              auto-actions.
            </Typography>
          </CardContent>
        </Card>

        {/* Right – Rule builder */}
        <Box className="flex flex-col flex-[1.5] gap-3">
          <RuleBuilder
            rule={editingRule}
            onChange={handleBuilderChange}
            onSave={handleSaveRule}
          />
        </Box>
      </Box>
    </AdminPolicyLayout>
  );
}
