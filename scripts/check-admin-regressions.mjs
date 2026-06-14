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
    companyPayouts.includes("No live payout history available yet") &&
    companyPayouts.includes("Payout configuration persistence is not exposed by the backend yet"),
  "CompanyPayouts should stop rendering fake payout history"
);

check(
  "Experiment results use live flags instead of hardcoded mock series",
  experimentResults.includes("listAdminFeatureFlags") &&
    experimentResults.includes("Experiment metrics and A/B variant series are not exposed by the backend yet"),
  "ExperimentResults should be a backend flag detail view"
);

console.log("\nAdmin regression checks passed.");
