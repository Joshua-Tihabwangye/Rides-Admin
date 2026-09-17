import fs from "node:fs";
import path from "node:path";

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

function check(name, condition, detail) {
  if (!condition) {
    throw new Error(`[FAIL] ${name}: ${detail}`);
  }
  console.log(`[PASS] ${name}`);
}

const requireAuth = read("src/auth/RequireAuth.tsx");
const training = read("src/pages/GlobalTrainingManager.tsx");
const featureFlags = read("src/pages/FeatureFlagsExperiments.tsx");
const approvals = read("src/pages/ApprovalsDashboard.tsx");
const shell = read("src/layout/AdminShell.tsx");
const systemOverview = read("src/pages/SystemOverview.tsx");
const companyPayouts = read("src/pages/CompanyPayouts.tsx");
const experimentResults = read("src/pages/ExperimentResults.tsx");
const agentManagement = read("src/pages/AgentManagement.tsx");
const agentDetail = read("src/pages/AgentDetail.tsx");
const detailedAnalytics = read("src/pages/DetailedAnalytics.tsx");
const labelExceptions = read("src/pages/LabelExceptionsPage.tsx");
const adminApi = read("src/services/api/adminApi.ts");
const adminRealtime = read("src/services/adminRealtime.ts");
const driverManagement = read("src/pages/DriverManagement.tsx");

check(
  "Admin auth gate hydrates from backend session before redirecting",
  requireAuth.includes("backendFetchSession") &&
    requireAuth.includes("setHydrated(true)") &&
    requireAuth.includes("if (!hydrated)"),
  "RequireAuth should stay silent while the backend session refresh resolves"
);

check(
  "Training manager uses backend training-module persistence",
  training.includes("listAdminTrainingModules") &&
    training.includes("createAdminTrainingModule") &&
    training.includes("patchAdminTrainingModule") &&
    training.includes("deleteAdminTrainingModule") &&
    training.includes("Training modules are persisted in the backend"),
  "GlobalTrainingManager should stop treating localStorage as the source of truth"
);

check(
  "Feature flags remain backend-backed",
  featureFlags.includes("listAdminFeatureFlags") &&
    featureFlags.includes("patchAdminFeatureFlag"),
  "FeatureFlagsExperiments should stay connected to backend flag endpoints"
);

check(
  "Approvals dashboard keeps bulk review and export workflows",
  approvals.includes("bulkReview") &&
    approvals.includes("exportCsv") &&
    approvals.includes("reviewAdminApproval"),
  "ApprovalsDashboard should remain operational for queue handling"
);

check(
  "Admin shell continues to wire live summary notifications",
  shell.includes("getAdminOperationalSummary") &&
    shell.includes("ADMIN_SUMMARY_UPDATED_EVENT"),
  "AdminShell should continue reflecting backend summary notifications"
);

check(
  "System overview stays backend-backed",
  systemOverview.includes("getAdminSystemOverview") &&
    systemOverview.includes("listAdminServices") &&
    systemOverview.includes("listAdminFeatureFlags") &&
    systemOverview.includes("listAdminAuditEvents"),
  "SystemOverview should load live service, flag and audit summaries"
);

check(
  "Company payouts avoid demo history rows",
  companyPayouts.includes("listAdminCompanies") &&
    companyPayouts.includes("getAdminCompanyPayoutSettings") &&
    companyPayouts.includes("patchAdminCompanyPayoutSettings") &&
    companyPayouts.includes("listAdminCompanyPayouts") &&
    companyPayouts.includes("No company payouts were returned by the backend.") &&
    !companyPayouts.includes("payout-001"),
  "CompanyPayouts should keep settings and payout rows backend-backed without fake payout history"
);

check(
  "Experiment results use backend experiment analytics contract",
  experimentResults.includes("getAdminExperimentResults") &&
    experimentResults.includes("Variant Performance") &&
    experimentResults.includes("No backend metrics are attached to this experiment record yet") &&
    !experimentResults.includes("listAdminFeatureFlags") &&
    !experimentResults.includes("Experiment metrics and A/B variant series are not exposed by the backend yet"),
  "ExperimentResults should render backend experiment results, not the old flag-placeholder page"
);

check(
  "Agent management uses dedicated backend agent contracts",
  agentManagement.includes("listAdminAgents") &&
    agentManagement.includes("createAdminAgent") &&
    agentDetail.includes("getAdminAgent") &&
    agentDetail.includes("getAdminAgentChat") &&
    agentDetail.includes("sendAdminAgentChat") &&
    !agentManagement.includes("Admin agent creation is not exposed"),
  "Agent pages should stay on dedicated agent endpoints with real create/chat/metrics flows"
);

check(
  "Detailed analytics filters refetch backend aggregates",
  detailedAnalytics.includes("getAdminAnalyticsTimeseries(period, backendFilters)") &&
    detailedAnalytics.includes("getAdminAnalyticsDrivers(period, backendFilters)") &&
    detailedAnalytics.includes("getAdminAnalyticsCompanies(period, backendFilters)") &&
    detailedAnalytics.includes("filters.region") &&
    detailedAnalytics.includes("filters.service"),
  "DetailedAnalytics service/region filters must remain backend query filters"
);

check(
  "Label exceptions expose backend registry filters",
  labelExceptions.includes("search: search.trim() || undefined") &&
    labelExceptions.includes("fromDate: fromDate || undefined") &&
    labelExceptions.includes("toDate: toDate || undefined") &&
    labelExceptions.includes("listAdminDeliveryLabels") &&
    adminApi.includes("search: filters.search"),
  "LabelExceptionsPage should keep status/search/date filters backed by the delivery label registry"
);

check(
  "SOS realtime surfaces share reconnect subscription helper",
  adminRealtime.includes("attachAdminRealtimeSocket") &&
    adminRealtime.includes('socket.on("reconnect", subscribe)') &&
    read("src/pages/SafetyOverview.tsx").includes("attachAdminRealtimeSocket") &&
    read("src/pages/SosIncidentDetailPage.tsx").includes("attachAdminRealtimeSocket") &&
    read("src/components/SafetyIncidentPopup.tsx").includes("attachAdminRealtimeSocket"),
  "Safety/SOS realtime surfaces should resubscribe on reconnect through the shared helper"
);

check(
  "Driver management fetches every paginated driver",
  driverManagement.includes("listAllAdminDrivers") &&
    adminApi.includes("export async function listAllAdminDrivers") &&
    adminApi.includes("page <= maxPages") &&
    adminApi.includes("listAdminDriversPaginated(page, pageSize)") &&
    adminApi.includes("normalizePaginatedDriver"),
  "DriverManagement should not fall back to a single page of drivers"
);

console.log("\nAdmin regression checks passed.");
