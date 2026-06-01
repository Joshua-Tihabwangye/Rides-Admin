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

function normalizeRoles(roles: string[]): string[] {
  return Array.from(
    new Set(
      roles
        .filter((role) => typeof role === "string")
        .map((role) => role.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function isSuperAdminByRoles(roles: string[]): boolean {
  return normalizeRoles(roles).includes("super_admin");
}

export function getPermissionsForRoles(roles: string[]): AdminPermission[] {
  if (isSuperAdminByRoles(roles)) {
    return ALL_PERMISSIONS;
  }
  return ADMIN_DEFAULT_PERMISSIONS;
}

export function getUserPermissions(user: AuthUser): AdminPermission[] {
  return getPermissionsForRoles(user.roles ?? []);
}

export function hasAnyPermission(user: AuthUser, required: AdminPermission[]): boolean {
  if (required.length === 0) return true;
  const granted = new Set(getUserPermissions(user));
  return required.some((permission) => granted.has(permission));
}

export function hasAnyPermissionByRoles(roles: string[], required: AdminPermission[]): boolean {
  if (required.length === 0) return true;
  const granted = new Set(getPermissionsForRoles(roles));
  return required.some((permission) => granted.has(permission));
}
