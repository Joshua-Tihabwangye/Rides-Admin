import React from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from './auth/RequireAuth'
import RequirePermission from './auth/RequirePermission'
import AdminShell from './layout/AdminShell'
import AdminBackendBootstrap from './components/AdminBackendBootstrap'

// Pages (attached)
import AdminAuthSignIn from './pages/AdminAuthSignIn'
import AdminAuthSignUp from './pages/AdminAuthSignUp'
import ForgotPassword from './pages/ForgotPassword'
import VerifyResetOtp from './pages/VerifyResetOtp'
import ResetPassword from './pages/ResetPassword'
import AdminWelcomeNotice from './pages/AdminWelcomeNotice'
import AdminOnboardingChecklist from './pages/AdminOnboardingChecklist'
import AdminHomeDashboard from './pages/AdminHomeDashboard'
import AdminProfileRegions from './pages/AdminProfileRegions'
import AdminGlobalSearch from './pages/AdminGlobalSearch'
import RiderManagement from './pages/RiderManagement'
import RiderDetail from './pages/RiderDetail'
import RiderCreate from './pages/RiderCreate'
import DriverManagement from './pages/DriverManagement'
import DriverDetail from './pages/DriverDetail'
import DriverCreate from './pages/DriverCreate'
import SafetyOverview from './pages/SafetyOverview'
import RiskFraudCenter from './pages/RiskFraudCenter'
import RiskDetail from './pages/RiskDetail'
import CompanyList from './pages/CompanyList'
import CompanyDetail from './pages/CompanyDetail'
import FinancialOverview from './pages/FinancialOverview'
import CompanyPayouts from './pages/CompanyPayouts'
import FinanceCashouts from './pages/FinanceCashouts'
import FinancePayouts from './pages/FinancePayouts'
import FinancePayments from './pages/FinancePayments'
import FinanceSettlements from './pages/FinanceSettlements'
import FinanceWalletReconciliation from './pages/FinanceWalletReconciliation'
import FinanceReconciliationRuns from './pages/FinanceReconciliationRuns'
import CompanyApprovals from './pages/CompanyApprovals'
import RegionTaxConfigEditor from './pages/RegionTaxConfigEditor'
import InvoiceTemplatePreview from './pages/InvoiceTemplatePreview'
import OperationsDashboard from './pages/OperationsDashboard'
import MonitoringPage from './pages/MonitoringPage'
import MatchingInspectionPage from './pages/MatchingInspectionPage'
import DetailedAnalytics from './pages/DetailedAnalytics'
import ApprovalsDashboard from './pages/ApprovalsDashboard'
import ApprovalDetail from './pages/ApprovalDetail'
import DocumentReviewPage from './pages/DocumentReviewPage'
import ServiceConfiguration from './pages/ServiceConfiguration'
import PricingManagement from './pages/PricingManagement'
import PromotionsIncentives from './pages/PromotionsIncentives'
import PromoDetail from './pages/PromoDetail'
import VerticalPolicies from './pages/VerticalPolicies'
import AgentManagement from './pages/AgentManagement'
import AgentDetail from './pages/AgentDetail'
import AdminUsersManagement from './pages/AdminUsersManagement'
import AdminUserDetail from './pages/AdminUserDetail'
import RolesPermissions from './pages/RolesPermissions'
import GlobalTrainingManager from './pages/GlobalTrainingManager'
import TrainingModulePreview from './pages/TrainingModulePreview'
// import LocalizationLanguageContent from './pages/LocalizationLanguageContent' // Removed
import FeatureFlagsExperiments from './pages/FeatureFlagsExperiments'
import ExperimentResults from './pages/ExperimentResults'
import ApprovalsHistory from './pages/ApprovalsHistory'
import Integrations from './pages/Integrations'
import AuditLog from './pages/AuditLog'
import SystemOverview from './pages/SystemOverview'
import Settings from './pages/Settings'
import AccessDenied from './pages/AccessDenied'
import DeliveryListPage from './pages/DeliveryListPage'
import DeliveryDetailPage from './pages/DeliveryDetailPage'
import PackageLabelPage from './pages/PackageLabelPage'
import PrintQueuePage from './pages/PrintQueuePage'
import LabelExceptionsPage from './pages/LabelExceptionsPage'
import BlankLabelStockPage from './pages/BlankLabelStockPage'

export default function App() {
  return (
    <BrowserRouter>
      <AdminBackendBootstrap />
      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" replace />} />

        {/* Auth & onboarding (public) */}
        <Route path="/admin/login" element={<AdminAuthSignIn />} />
        <Route path="/admin/signup" element={<AdminAuthSignUp />} />
        <Route path="/admin/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin/verify-otp" element={<VerifyResetOtp />} />
        <Route path="/admin/reset-password" element={<ResetPassword />} />
        <Route path="/admin/onboarding/welcome" element={<AdminWelcomeNotice />} />
        <Route path="/admin/onboarding/checklist" element={<AdminOnboardingChecklist />} />
        <Route path="/admin/access-denied" element={<AccessDenied />} />

        {/* Protected admin area */}
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminShell />
            </RequireAuth>
          }
        >
          <Route
            path="home"
            element={
              <RequirePermission anyOf={["view_dashboard"]}>
                <AdminHomeDashboard />
              </RequirePermission>
            }
          />
          <Route path="profile" element={<AdminProfileRegions />} />
          <Route path="search" element={<AdminGlobalSearch />} />

          {/* Ops & analytics */}
          <Route
            path="ops"
            element={
              <RequirePermission anyOf={["manage_operations"]}>
                <OperationsDashboard />
              </RequirePermission>
            }
          />
          <Route
            path="monitoring"
            element={
              <RequirePermission anyOf={["manage_operations"]}>
                <MonitoringPage />
              </RequirePermission>
            }
          />
          <Route
            path="matching"
            element={
              <RequirePermission anyOf={["manage_operations"]}>
                <MatchingInspectionPage />
              </RequirePermission>
            }
          />
          <Route
            path="reports"
            element={
              <RequirePermission anyOf={["manage_operations"]}>
                <DetailedAnalytics />
              </RequirePermission>
            }
          />

          {/* People */}
          <Route
            path="riders"
            element={
              <RequirePermission anyOf={["manage_people"]}>
                <RiderManagement />
              </RequirePermission>
            }
          />
          <Route
            path="riders/new"
            element={
              <RequirePermission anyOf={["manage_people"]}>
                <RiderCreate />
              </RequirePermission>
            }
          />
          <Route
            path="riders/:id"
            element={
              <RequirePermission anyOf={["manage_people"]}>
                <RiderDetail />
              </RequirePermission>
            }
          />
          <Route
            path="drivers"
            element={
              <RequirePermission anyOf={["manage_people"]}>
                <DriverManagement />
              </RequirePermission>
            }
          />
          <Route
            path="drivers/new"
            element={
              <RequirePermission anyOf={["manage_people"]}>
                <DriverCreate />
              </RequirePermission>
            }
          />
          <Route
            path="drivers/:id"
            element={
              <RequirePermission anyOf={["manage_people"]}>
                <DriverDetail />
              </RequirePermission>
            }
          />
          <Route
            path="safety"
            element={
              <RequirePermission anyOf={["manage_people"]}>
                <SafetyOverview />
              </RequirePermission>
            }
          />
          <Route
            path="risk"
            element={
              <RequirePermission anyOf={["manage_people"]}>
                <RiskFraudCenter />
              </RequirePermission>
            }
          />
          <Route
            path="risk/:riskId"
            element={
              <RequirePermission anyOf={["manage_people"]}>
                <RiskDetail />
              </RequirePermission>
            }
          />

          {/* Companies */}
          <Route
            path="companies"
            element={
              <RequirePermission anyOf={["manage_companies"]}>
                <CompanyList />
              </RequirePermission>
            }
          />
          <Route
            path="companies/approvals"
            element={
              <RequirePermission anyOf={["manage_companies"]}>
                <CompanyApprovals />
              </RequirePermission>
            }
          />
          <Route
            path="companies/:companyId"
            element={
              <RequirePermission anyOf={["manage_companies"]}>
                <CompanyDetail />
              </RequirePermission>
            }
          />

          {/* Finance */}
          <Route
            path="finance"
            element={
              <RequirePermission anyOf={["manage_finance"]}>
                <FinancialOverview />
              </RequirePermission>
            }
          />
          {/* Requested routes for I2 */}
          <Route
            path="finance/companies"
            element={
              <RequirePermission anyOf={["manage_finance"]}>
                <CompanyList />
              </RequirePermission>
            }
          />
          <Route
            path="finance/companies/:companyId"
            element={
              <RequirePermission anyOf={["manage_finance"]}>
                <CompanyPayouts />
              </RequirePermission>
            }
          />
          <Route
            path="finance/cashouts"
            element={
              <RequirePermission anyOf={["manage_finance"]}>
                <FinanceCashouts />
              </RequirePermission>
            }
          />
          <Route
            path="finance/payouts"
            element={
              <RequirePermission anyOf={["manage_finance"]}>
                <FinancePayouts />
              </RequirePermission>
            }
          />
          <Route
            path="finance/payments"
            element={
              <RequirePermission anyOf={["manage_finance"]}>
                <FinancePayments />
              </RequirePermission>
            }
          />
          <Route
            path="finance/settlements"
            element={
              <RequirePermission anyOf={["manage_finance"]}>
                <FinanceSettlements />
              </RequirePermission>
            }
          />
          <Route
            path="finance/wallet-reconciliation"
            element={
              <RequirePermission anyOf={["manage_finance"]}>
                <FinanceWalletReconciliation />
              </RequirePermission>
            }
          />
          <Route
            path="finance/reconciliation-runs"
            element={
              <RequirePermission anyOf={["manage_finance"]}>
                <FinanceReconciliationRuns />
              </RequirePermission>
            }
          />
          <Route
            path="finance/tax-invoices"
            element={
              <RequirePermission anyOf={["manage_finance"]}>
                <RegionTaxConfigEditor />
              </RequirePermission>
            }
          />
          <Route
            path="finance/tax-invoices/:regionId/edit"
            element={
              <RequirePermission anyOf={["manage_finance"]}>
                <RegionTaxConfigEditor />
              </RequirePermission>
            }
          />
          <Route
            path="finance/tax-invoices/template-preview"
            element={
              <RequirePermission anyOf={["manage_finance"]}>
                <InvoiceTemplatePreview />
              </RequirePermission>
            }
          />

          {/* Logistics / Delivery workspace */}
          <Route
            path="deliveries"
            element={
              <RequirePermission anyOf={["view_deliveries"]}>
                <DeliveryListPage />
              </RequirePermission>
            }
          />
          <Route
            path="deliveries/:id"
            element={
              <RequirePermission anyOf={["view_deliveries"]}>
                <DeliveryDetailPage />
              </RequirePermission>
            }
          />
          <Route
            path="delivery-packages/:packageId/label"
            element={
              <RequirePermission anyOf={["view_delivery_labels"]}>
                <PackageLabelPage />
              </RequirePermission>
            }
          />
          <Route
            path="delivery-labels"
            element={
              <RequirePermission anyOf={["view_delivery_labels"]}>
                <PackageLabelPage />
              </RequirePermission>
            }
          />
          <Route
            path="delivery-labels/print-queue"
            element={
              <RequirePermission anyOf={["print_delivery_labels"]}>
                <PrintQueuePage />
              </RequirePermission>
            }
          />
          <Route
            path="delivery-labels/exceptions"
            element={
              <RequirePermission anyOf={["view_delivery_labels"]}>
                <LabelExceptionsPage />
              </RequirePermission>
            }
          />
          <Route
            path="delivery-label-stock"
            element={
              <RequirePermission anyOf={["activate_blank_labels"]}>
                <BlankLabelStockPage />
              </RequirePermission>
            }
          />

          {/* Approvals */}
          <Route
            path="approvals"
            element={
              <RequirePermission anyOf={["manage_operations"]}>
                <ApprovalsDashboard />
              </RequirePermission>
            }
          />
          <Route
            path="approvals/history"
            element={
              <RequirePermission anyOf={["manage_operations"]}>
                <ApprovalsHistory />
              </RequirePermission>
            }
          />
          <Route
            path="approvals/:approvalId"
            element={
              <RequirePermission anyOf={["manage_operations"]}>
                <ApprovalDetail />
              </RequirePermission>
            }
          />
          <Route
            path="documents/review"
            element={
              <RequirePermission anyOf={["manage_operations"]}>
                <DocumentReviewPage />
              </RequirePermission>
            }
          />

          {/* Product config */}
          <Route
            path="services"
            element={
              <RequirePermission anyOf={["manage_pricing"]}>
                <ServiceConfiguration />
              </RequirePermission>
            }
          />
          {/* Centralized pricing management — rides, deliveries, rentals, ambulances */}
          <Route
            path="pricing"
            element={
              <RequirePermission anyOf={["manage_pricing"]}>
                <PricingManagement />
              </RequirePermission>
            }
          />
          <Route
            path="pricing/*"
            element={
              <RequirePermission anyOf={["manage_pricing"]}>
                <PricingManagement />
              </RequirePermission>
            }
          />
          <Route
            path="promos"
            element={
              <RequirePermission anyOf={["manage_promotions"]}>
                <PromotionsIncentives />
              </RequirePermission>
            }
          />
          <Route
            path="promos/:id"
            element={
              <RequirePermission anyOf={["manage_promotions"]}>
                <PromoDetail />
              </RequirePermission>
            }
          />
          <Route
            path="vertical-policies"
            element={
              <RequirePermission anyOf={["manage_pricing"]}>
                <VerticalPolicies />
              </RequirePermission>
            }
          />

          {/* Users & roles */}
          <Route
            path="agents"
            element={
              <RequirePermission anyOf={["manage_people"]}>
                <AgentManagement />
              </RequirePermission>
            }
          />
          <Route
            path="agents/:id"
            element={
              <RequirePermission anyOf={["manage_people"]}>
                <AgentDetail />
              </RequirePermission>
            }
          />
          <Route
            path="admin-users"
            element={
              <RequirePermission anyOf={["manage_admin_users"]}>
                <AdminUsersManagement />
              </RequirePermission>
            }
          />
          <Route
            path="admin-users/:id"
            element={
              <RequirePermission anyOf={["manage_admin_users"]}>
                <AdminUserDetail />
              </RequirePermission>
            }
          />
          <Route
            path="roles"
            element={
              <RequirePermission anyOf={["manage_roles"]}>
                <RolesPermissions />
              </RequirePermission>
            }
          />

          {/* Training & system */}
          <Route
            path="training"
            element={
              <RequirePermission anyOf={["manage_system"]}>
                <GlobalTrainingManager />
              </RequirePermission>
            }
          />
          <Route
            path="training/preview"
            element={
              <RequirePermission anyOf={["manage_system"]}>
                <TrainingModulePreview />
              </RequirePermission>
            }
          />
          {/* <Route path="localization" element={<LocalizationLanguageContent />} /> Removed */}
          <Route
            path="system/flags"
            element={
              <RequirePermission anyOf={["manage_system"]}>
                <FeatureFlagsExperiments />
              </RequirePermission>
            }
          />
          <Route
            path="system/flags/:id/results"
            element={
              <RequirePermission anyOf={["manage_system"]}>
                <ExperimentResults />
              </RequirePermission>
            }
          />
          <Route
            path="system/integrations"
            element={
              <RequirePermission anyOf={["manage_system"]}>
                <Integrations />
              </RequirePermission>
            }
          />
          <Route
            path="system/audit-log"
            element={
              <RequirePermission anyOf={["manage_system"]}>
                <AuditLog />
              </RequirePermission>
            }
          />
          <Route
            path="system/overview"
            element={
              <RequirePermission anyOf={["manage_system"]}>
                <SystemOverview />
              </RequirePermission>
            }
          />
          <Route path="settings" element={<Settings />} />

          <Route path="*" element={<Navigate to="/admin/home" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
