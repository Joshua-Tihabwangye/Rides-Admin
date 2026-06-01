import type { AuthUser } from "./auth";

export type AdminPermission =
  | "view_dashboard"
  | "manage_operations"
  | "manage_people"
  | "manage_companies"
  | "manage_finance"
  | "manage_pricing"
  | "manage_promotions"
  | "manage_admin_users"
  | "manage_roles"
  | "manage_system";

const ALL_PERMISSIONS: AdminPermission[] = [
  "view_dashboard",
  "manage_operations",
  "manage_people",
  "manage_companies",
  "manage_finance",
  "manage_pricing",
  "manage_promotions",
  "manage_admin_users",
  "manage_roles",
  "manage_system",
];

const ADMIN_DEFAULT_PERMISSIONS: AdminPermission[] = [
  "view_dashboard",
  "manage_operations",
  "manage_people",
  "manage_companies",
  "manage_finance",
  "manage_pricing",
  "manage_promotions",
];

function hasRawRole(user: AuthUser, role: string): boolean {
  return (user.roles ?? []).includes(role);
}

function isSuperAdmin(user: AuthUser): boolean {
  return user.role === "Super Admin" || hasRawRole(user, "super_admin");
}

export function getUserPermissions(user: AuthUser): AdminPermission[] {
  if (isSuperAdmin(user)) {
    return ALL_PERMISSIONS;
  }
  return ADMIN_DEFAULT_PERMISSIONS;
}

export function hasAnyPermission(user: AuthUser, required: AdminPermission[]): boolean {
  if (required.length === 0) return true;
  const granted = new Set(getUserPermissions(user));
  return required.some((permission) => granted.has(permission));
}
