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
const app = read("src/App.tsx");
const liveDriversMap = read("src/pages/LiveDriversMapPage.tsx");
const invoiceTemplatePreview = read("src/pages/InvoiceTemplatePreview.tsx");
const adminGlobalSearch = read("src/pages/AdminGlobalSearch.tsx");
const financeReconciliationRuns = read("src/pages/FinanceReconciliationRuns.tsx");
const settings = read("src/pages/Settings.tsx");
const adminLiveDataProvider = read("src/components/AdminLiveDataProvider.tsx");
const operationsDashboard = read("src/pages/OperationsDashboard.tsx");
const monitoringPage = read("src/pages/MonitoringPage.tsx");
const matchingInspection = read("src/pages/MatchingInspectionPage.tsx");
const safetyOverview = read("src/pages/SafetyOverview.tsx");
const vercel = read("vercel.json");

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
  shell.includes("listAdminNotifications") &&
    shell.includes("ADMIN_SUMMARY_UPDATED_EVENT"),
  "AdminShell should continue refreshing backend notifications from summary update events"
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

check(
  "Production admin build runs CSS and asset verification",
  vercel.includes('"buildCommand": "npm run build:verify"') &&
    vercel.includes('"Cache-Control"') &&
    vercel.includes('max-age=31536000, immutable'),
  "Vercel production deploys must run build:verify and send explicit cache headers"
);

check(
  "Lazy route chunks and stale assets recover from deployments",
  app.includes("function recoverableLazy") &&
    app.includes("useIdleRoutePreload") &&
    app.includes("useStaleAssetRecovery") &&
    app.includes("vite:preloadError") &&
    app.includes("rel === 'stylesheet'") &&
    app.includes("evzone:admin-preload-route-chunks") &&
    shell.includes("onMouseEnter={requestRoutePreload}") &&
    shell.includes("onFocus={requestRoutePreload}") &&
    app.includes("Failed to fetch dynamically imported module") &&
    app.includes("window.location.reload()") &&
    !app.includes("= lazy(() => import("),
  "App lazy imports and CSS/static build assets should recover when stale hashed files disappear after a deploy"
);

check(
  "Live operations state persists across Admin route changes",
  shell.includes("AdminLiveDataProvider") &&
    adminLiveDataProvider.includes("STATUS_POLL_MS = 2_000") &&
    adminLiveDataProvider.includes("MOVEMENT_POLL_MS = 5_000") &&
    adminLiveDataProvider.includes("createAdminSocket") &&
    adminLiveDataProvider.includes("driver.location.updated") &&
    adminLiveDataProvider.includes("listAdminMonitoringDrivers") &&
    liveDriversMap.includes("useAdminLiveData") &&
    operationsDashboard.includes("useAdminLiveData") &&
    monitoringPage.includes("useAdminLiveData") &&
    operationsDashboard.includes("window.setInterval(() => void load(), 5000)") &&
    matchingInspection.includes("window.setInterval(loadJobs, 5000)") &&
    safetyOverview.includes("window.setInterval(() => void load(), 5000)") &&
    !liveDriversMap.includes("createAdminSocket") &&
    !monitoringPage.includes("window.setInterval"),
  "Live map, monitoring, and operations pages should read warm shared realtime state with a fast driver-status lane instead of resetting local sockets on navigation"
);

check(
  "Live drivers map avoids the 0,0 query sentinel",
  !liveDriversMap.includes("QUERY_ORIGIN") &&
    adminLiveDataProvider.includes("getActiveDrivers(undefined, undefined") &&
    adminApi.includes("latitude?: number | null") &&
    adminApi.includes("cacheTtlMs: 0"),
  "LiveDriversMapPage should represent global queries by omitting coordinates"
);

check(
  "Invoice template preview does not ship hard-coded money fixtures",
  !invoiceTemplatePreview.includes("UGX 8,000") &&
    !invoiceTemplatePreview.includes("UGX 1,000") &&
    !invoiceTemplatePreview.includes("UGX 9,000") &&
    invoiceTemplatePreview.includes("calculated by backend"),
  "InvoiceTemplatePreview should not present fake financial values as production data"
);

check(
  "Admin mutable config is not owned by local option arrays",
  !adminGlobalSearch.includes('"kampala"') &&
    !companyPayouts.includes("const SCHEDULES") &&
    !companyPayouts.includes("const CURRENCIES") &&
    !financeReconciliationRuns.includes("const RUN_TYPES") &&
    !financeReconciliationRuns.includes("const RUN_STATUSES") &&
    !financeReconciliationRuns.includes("const RECORD_STATUSES") &&
    settings.includes("supportedValuesOf?.('timeZone')") &&
    !settings.includes('value="Africa/Kampala"'),
  "Markets, payout schedules, reconciliation statuses, and timezones should come from backend/browser capabilities instead of hand-maintained UI lists"
);

console.log("\nAdmin regression checks passed.");
