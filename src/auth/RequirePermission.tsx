import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getAuthRoles, getAuthUser } from "./auth";
import { hasAnyPermissionByRoles, type AdminPermission } from "./permissions";

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

  const claimRoles = getAuthRoles();
  if (!hasAnyPermissionByRoles(claimRoles, anyOf)) {
    return <Navigate to="/admin/access-denied" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
