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
import CompanyApprovals from './pages/CompanyApprovals'
import RegionTaxConfigEditor from './pages/RegionTaxConfigEditor'
import InvoiceTemplatePreview from './pages/InvoiceTemplatePreview'
import OperationsDashboard from './pages/OperationsDashboard'
import DetailedAnalytics from './pages/DetailedAnalytics'
import ApprovalsDashboard from './pages/ApprovalsDashboard'
import ApprovalDetail from './pages/ApprovalDetail'
import ServiceConfiguration from './pages/ServiceConfiguration'
import PricingRulesTariffs from './pages/PricingRulesTariffs'
import ZoneCreate from './pages/ZoneCreate'
import ZoneMapView from './pages/ZoneMapView'
import ZonePricingDetail from './pages/ZonePricingDetail'
import ZonesList from './pages/ZonesList'
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
          <Route path="home" element={<AdminHomeDashboard />} />
          <Route path="profile" element={<AdminProfileRegions />} />
          <Route path="search" element={<AdminGlobalSearch />} />

          {/* Ops & analytics */}
          <Route path="ops" element={<OperationsDashboard />} />
          <Route path="reports" element={<DetailedAnalytics />} />

          {/* People */}
          <Route path="riders" element={<RiderManagement />} />
          <Route path="riders/new" element={<RiderCreate />} />
          <Route path="riders/:id" element={<RiderDetail />} />
          <Route path="drivers" element={<DriverManagement />} />
          <Route path="drivers/new" element={<DriverCreate />} />
          <Route path="drivers/:id" element={<DriverDetail />} />
          <Route path="safety" element={<SafetyOverview />} />
          <Route path="risk" element={<RiskFraudCenter />} />
          <Route path="risk/:riskId" element={<RiskDetail />} />

          {/* Companies */}
          <Route path="companies" element={<CompanyList />} />
          <Route path="companies/approvals" element={<CompanyApprovals />} />
          <Route path="companies/:companyId" element={<CompanyDetail />} />

          {/* Finance */}
          <Route path="finance" element={<FinancialOverview />} />
          {/* Requested routes for I2 */}
          <Route path="finance/companies" element={<CompanyList />} />
          <Route path="finance/companies/:companyId" element={<CompanyPayouts />} />
          <Route path="finance/tax-invoices" element={<RegionTaxConfigEditor />} />
          <Route path="finance/tax-invoices/:regionId/edit" element={<RegionTaxConfigEditor />} />
          <Route path="finance/tax-invoices/template-preview" element={<InvoiceTemplatePreview />} />

          {/* Approvals */}
          <Route path="approvals" element={<ApprovalsDashboard />} />
          <Route path="approvals/history" element={<ApprovalsHistory />} />
          <Route path="approvals/:approvalId" element={<ApprovalDetail />} />

          {/* Product config */}
          <Route path="services" element={<ServiceConfiguration />} />
          <Route path="pricing" element={<PricingRulesTariffs />} />
          <Route path="pricing/zones" element={<ZonesList />} />
          <Route path="pricing/new-zone" element={<ZoneCreate />} />
          <Route path="pricing/map/:id" element={<ZoneMapView />} />
          <Route path="pricing/detail/:id" element={<ZonePricingDetail />} />
          <Route path="promos" element={<PromotionsIncentives />} />
          <Route path="promos/:id" element={<PromoDetail />} />
          <Route path="vertical-policies" element={<VerticalPolicies />} />

          {/* Users & roles */}
          <Route path="agents" element={<AgentManagement />} />
          <Route path="agents/:id" element={<AgentDetail />} />
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
          <Route path="training" element={<GlobalTrainingManager />} />
          <Route path="training/preview" element={<TrainingModulePreview />} />
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
