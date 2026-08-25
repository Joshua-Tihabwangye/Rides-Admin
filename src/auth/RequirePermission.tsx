import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getAuthPermissions, getAuthRoles, getAuthUser } from "./auth";
import { type AdminPermission } from "./permissions";

export default function RequirePermission({
  anyOf,
  children,
}: {
  anyOf: AdminPermission[];
  children: React.ReactNode;
}) {
  const location = useLocation();
  const user = getAuthUser();

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  const claimPermissions = new Set(
    getAuthPermissions().filter((permission): permission is AdminPermission =>
      anyOf.includes(permission as AdminPermission),
    ),
  );
  const claimRoles = new Set(getAuthRoles());
  const isSuperAdmin = claimRoles.has("super_admin");
  const granted =
    claimPermissions.size > 0
      ? claimPermissions
      : new Set<AdminPermission>();
  // Phase 10: a SUPER_ADMIN is unrestricted across every administrative page.
  const hasPermission =
    isSuperAdmin ||
    anyOf.some((permission) => granted.has(permission)) ||
    (claimPermissions.size === 0 &&
      (claimRoles.has("admin") && anyOf.every((permission) => permission !== "manage_system")));
  if (!hasPermission) {
    return <Navigate to="/admin/access-denied" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
