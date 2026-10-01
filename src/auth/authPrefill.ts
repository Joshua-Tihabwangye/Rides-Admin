export type AuthPrefillState = {
  email?: string;
  password?: string;
  identity?: string;
};

let authPrefill: AuthPrefillState = {};

export function readAuthPrefill(): AuthPrefillState {
  return { ...authPrefill };
}

export function saveAuthPrefill(next: AuthPrefillState): void {
  authPrefill = Object.fromEntries(
    Object.entries({ ...authPrefill, ...next })
      .map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])
      .filter(([, value]) => typeof value === "string" && value.length > 0),
  ) as AuthPrefillState;
}

export function clearAuthPrefillPassword(): void {
  const next = { ...authPrefill };
  delete next.password;
  authPrefill = next;
}
