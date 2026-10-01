import {
  backendFetchSession,
  backendForgotPassword,
  backendLogin,
  backendResetPassword,
  backendRegister,
  backendVerifyOtp,
} from "../services/api/authApi";
import {
  clearAdminBackendTokens,
  saveAdminBackendTokens,
  syncAdminReferenceData,
} from "../services/api/adminApi";
import { getUserPermissions } from "./permissions";

export const ADMIN_BACKEND_ROLE_ENUMS = [
  "admin",
  "super_admin",
  "operations_admin",
  "finance_admin",
  "compliance_admin",
  "support_admin",
] as const;
export type AdminBackendRole = (typeof ADMIN_BACKEND_ROLE_ENUMS)[number];

export const ADMIN_ROLE_OPTIONS: Array<{
  value: AdminBackendRole;
  label: string;
  description: string;
}> = [
  {
    value: "admin",
    label: "Admin",
    description:
      "General operations, people, companies, rides, pricing, and finance access.",
  },
  {
    value: "super_admin",
    label: "Super Admin",
    description:
      "Full access, including admin users, roles, and system settings.",
  },
  {
    value: "operations_admin",
    label: "Operations Admin",
    description:
      "Operations dashboards, monitoring, dispatch, approvals, and live service controls.",
  },
  {
    value: "finance_admin",
    label: "Finance Admin",
    description:
      "Finance dashboards, payouts, cashouts, payments, settlements, and reconciliation.",
  },
  {
    value: "compliance_admin",
    label: "Compliance Admin",
    description:
      "Approvals, risk, document review, audit, policy, and governance work.",
  },
  {
    value: "support_admin",
    label: "Support Admin",
    description:
      "Rider, driver, safety, ride, delivery, and support workflows.",
  },
];

export type AuthUser = {
  name: string;
  email: string;
  role: string;
  roles?: string[];
  activeRole?: AdminBackendRole;
  permissions?: string[];
  defaultRedirect?: string;
  approvalPending?: boolean;
};

type AdminRoleClaimStatus = {
  roles: AdminBackendRole[];
  hasUnknownRoles: boolean;
};

let currentAuthUser: AuthUser | null = null;
const ADMIN_ROLE_SET = new Set<string>(ADMIN_BACKEND_ROLE_ENUMS);

function parseAdminRoles(roles: unknown): AdminRoleClaimStatus {
  if (!Array.isArray(roles)) {
    return { roles: [], hasUnknownRoles: false };
  }

  const normalized = new Set<AdminBackendRole>();

  for (const value of roles) {
    if (typeof value !== "string") {
      continue;
    }

    const role = value.trim().toLowerCase();
    if (!role || !ADMIN_ROLE_SET.has(role)) continue;
    normalized.add(role as AdminBackendRole);
  }

  return {
    roles: Array.from(normalized),
    hasUnknownRoles: false,
  };
}

function buildAuthUser(
  email: string,
  roles: AdminBackendRole[],
  name?: string,
  defaultRedirect?: string,
  permissions: string[] = [],
  activeRole?: AdminBackendRole,
): AuthUser {
  const normalizedEmail = email.trim().toLowerCase();
  const resolvedName = name?.trim() || normalizedEmail.split("@")[0] || "Admin";
  const selectedRole =
    activeRole && roles.includes(activeRole)
      ? activeRole
      : roles.includes("super_admin")
        ? "super_admin"
        : roles[0];
  const roleLabel =
    ADMIN_ROLE_OPTIONS.find((option) => option.value === selectedRole)?.label ??
    "Admin";
  return {
    name: resolvedName,
    email: normalizedEmail,
    role: roleLabel,
    roles,
    activeRole: selectedRole,
    permissions,
    defaultRedirect,
  };
}

async function finalizeBackendAuth(
  backend: {
    accessToken: string;
    refreshToken?: string;
    user: { email: string; roles?: string[] };
  },
  preferredName?: string,
  preferredRole?: AdminBackendRole,
): Promise<AuthUser> {
  saveAdminBackendTokens(backend.accessToken);

  const session = await backendFetchSession();
  const sessionRoles = parseAdminRoles(session.user.roles);
  if (sessionRoles.hasUnknownRoles) {
    signOut();
    throw new Error("Received unsupported admin role claims.");
  }

  const resolvedRoles = sessionRoles.roles;
  if (resolvedRoles.length === 0) {
    signOut();
    throw new Error("Admin account has no supported backend role.");
  }
  if (preferredRole && !resolvedRoles.includes(preferredRole)) {
    signOut();
    const roleLabel =
      ADMIN_ROLE_OPTIONS.find((option) => option.value === preferredRole)
        ?.label ?? preferredRole;
    throw new Error(
      `This admin account is not assigned the ${roleLabel} role.`,
    );
  }

  const authUser = buildAuthUser(
    session.user.email,
    resolvedRoles,
    [session.user.firstName, session.user.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || preferredName,
    session.defaultRedirect,
    Array.isArray(session.permissions) ? session.permissions : [],
    preferredRole,
  );
  authUser.approvalPending = Boolean(session.user.approvalPending);
  signIn(authUser);
  void syncAdminReferenceData().catch((error) => {
    console.warn(
      "Admin backend bootstrap sync failed. Keeping current local store.",
      error,
    );
  });
  return authUser;
}

export function getAuthUser(): AuthUser | null {
  return currentAuthUser;
}

export function getAuthRoles(): AdminBackendRole[] {
  return currentAuthUser?.activeRole
    ? [currentAuthUser.activeRole]
    : parseAdminRoles(currentAuthUser?.roles).roles;
}

export function getAuthPermissions(): string[] {
  const user = getAuthUser();
  if (!user) return [];
  // Phase 10: resolve the effective permission set from the user's roles. A
  // SUPER_ADMIN (or any admin whose backend session emitted the '*' wildcard)
  // resolves to the full permission set, so page-level guards and API checks
  // grant unrestricted access. The backend remains authoritative for what
  // each non-super role may do.
  return getUserPermissions(user);
}

export function hasInvalidRoleClaims(): boolean {
  return false;
}

export function signIn(user: AuthUser) {
  currentAuthUser = user;
}

export function signOut(notifyBackend = true) {
  currentAuthUser = null;
  clearAdminBackendTokens(notifyBackend);
}

export function isAuthed() {
  return currentAuthUser !== null;
}

export async function registerWithCredentials(credentials: {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  role?: AdminBackendRole;
}): Promise<void> {
  const normalizedEmail = credentials.email.trim().toLowerCase();

  const backend = await backendRegister({
    email: normalizedEmail,
    password: credentials.password,
    fullName: credentials.fullName,
    phone: credentials.phone,
    adminRole: credentials.role ?? "admin",
  });

  if ("approvalRequired" in backend) return;
  await finalizeBackendAuth(
    backend,
    credentials.fullName,
    credentials.role ?? "admin",
  );
}

export async function loginWithCredentials(credentials: {
  email: string;
  password: string;
  role?: AdminBackendRole;
}): Promise<AuthUser> {
  const normalizedEmail = credentials.email.trim().toLowerCase();

  const backend = await backendLogin({
    email: normalizedEmail,
    password: credentials.password,
  });

  return finalizeBackendAuth(backend, undefined, credentials.role);
}

export async function requestPasswordReset(email: string): Promise<void> {
  await backendForgotPassword({ email: email.trim().toLowerCase() });
}

export async function verifyPasswordResetOtp(email: string, otp: string) {
  return backendVerifyOtp({
    email: email.trim().toLowerCase(),
    otp: otp.trim(),
  });
}

export async function resetPasswordWithOtp(
  email: string,
  otp: string,
  newPassword: string,
) {
  return backendResetPassword({
    email: email.trim().toLowerCase(),
    otp: otp.trim(),
    newPassword,
  });
}
