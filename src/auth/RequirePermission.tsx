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

  const granted = new Set(
    getAuthPermissions().filter((permission): permission is AdminPermission =>
      anyOf.includes(permission as AdminPermission) || true,
    ),
  )
  const claimRoles = getAuthRoles()
  const hasPermission =
    granted.size > 0
      ? anyOf.some((permission) => granted.has(permission))
      : anyOf.some((permission) => claimRoles.includes("super_admin") || claimRoles.includes("admin") && permission !== "manage_system")
  if (!hasPermission) {
    return <Navigate to="/admin/access-denied" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
