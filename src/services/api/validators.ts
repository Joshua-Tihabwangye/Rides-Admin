const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[1-9]\d{7,14}$/;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) {
    return `+${trimmed.slice(1).replace(/\D/g, "")}`;
  }
  return trimmed.replace(/\D/g, "");
}

function assertValidEmail(email: string): void {
  if (!EMAIL_RE.test(email)) {
    throw new Error("Please enter a valid email address.");
  }
}

function assertValidPhone(phone: string): void {
  if (!PHONE_RE.test(phone)) {
    throw new Error("Please enter a valid phone number.");
  }
}

function assertPassword(password?: string): string | undefined {
  const next = password?.trim();
  if (!next) return undefined;
  if (next.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  return next;
}

export function normalizeAdminCreateRiderInput(input: {
  fullName: string;
  email?: string;
  phone: string;
  city?: string;
  country?: string;
  password?: string;
  invite?: boolean;
}) {
  const fullName = input.fullName.trim();
  if (fullName.length < 2) {
    throw new Error("Full name is required.");
  }

  const email = input.email?.trim() ? normalizeEmail(input.email) : "";
  if (!email) {
    throw new Error("Email is required.");
  }
  const phone = normalizePhone(input.phone);
  assertValidEmail(email);
  assertValidPhone(phone);

  return {
    fullName,
    email,
    phone,
    city: input.city?.trim() || undefined,
    country: input.country?.trim() || undefined,
    password: assertPassword(input.password),
    invite: Boolean(input.invite),
  };
}

export function normalizeAdminCreateDriverInput(input: {
  fullName: string;
  email?: string;
  phone: string;
  city?: string;
  country?: string;
  password?: string;
  invite?: boolean;
  licensePlate?: string;
  model?: string;
  vehicleType: "Bike" | "Car";
}) {
  const fullName = input.fullName.trim();
  if (fullName.length < 2) {
    throw new Error("Full name is required.");
  }

  const email = input.email?.trim() ? normalizeEmail(input.email) : "";
  if (!email) {
    throw new Error("Email is required.");
  }
  const phone = normalizePhone(input.phone);
  assertValidEmail(email);
  assertValidPhone(phone);

  return {
    fullName,
    email,
    phone,
    city: input.city?.trim() || undefined,
    country: input.country?.trim() || undefined,
    password: assertPassword(input.password),
    invite: Boolean(input.invite),
    licensePlate: input.licensePlate?.trim() || undefined,
    model: input.model?.trim() || undefined,
    vehicleType: input.vehicleType,
  };
}

export function normalizeAdminCreatePlatformUserInput(input: {
  email: string;
  phone?: string;
  roles: string[];
  password?: string;
  invite?: boolean;
  fullName?: string;
  city?: string;
  country?: string;
}) {
  const email = normalizeEmail(input.email);
  if (!email) {
    throw new Error("Email is required.");
  }
  assertValidEmail(email);

  const roles = Array.from(new Set((input.roles || []).map((role) => role.trim()).filter(Boolean)));
  if (roles.length === 0) {
    throw new Error("At least one role is required.");
  }

  const phone = input.phone?.trim() ? normalizePhone(input.phone) : undefined;
  if (phone) {
    assertValidPhone(phone);
  }

  return {
    email,
    phone,
    roles,
    password: assertPassword(input.password),
    invite: Boolean(input.invite),
    fullName: input.fullName?.trim() || undefined,
    city: input.city?.trim() || undefined,
    country: input.country?.trim() || undefined,
  };
}
