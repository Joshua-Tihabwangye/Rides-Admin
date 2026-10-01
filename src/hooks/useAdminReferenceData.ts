import { useEffect, useState } from "react";
import {
  getAdminReferenceData,
  type AdminReferenceData,
} from "../services/api/adminApi";

let cached: AdminReferenceData | null = null;
let inflight: Promise<AdminReferenceData> | null = null;
const listeners = new Set<(data: AdminReferenceData) => void>();

/** Loads backend platform reference data once per session and shares it. */
export function loadAdminReferenceData(): Promise<AdminReferenceData> {
  if (cached) return Promise.resolve(cached);
  inflight ??= getAdminReferenceData()
    .then((data) => {
      cached = data;
      listeners.forEach((listener) => listener(data));
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Platform currency from the backend; empty until reference data has loaded. */
export function platformCurrency(): string {
  return cached?.platform.currency ?? "";
}

export function useAdminReferenceData() {
  const [data, setData] = useState<AdminReferenceData | null>(cached);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const listener = (value: AdminReferenceData) => {
      if (active) setData(value);
    };
    listeners.add(listener);
    if (!cached) {
      loadAdminReferenceData().catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load platform reference data");
      });
    }
    return () => {
      active = false;
      listeners.delete(listener);
    };
  }, []);

  return { referenceData: data, referenceError: error, loading: !data && !error };
}

function displayName(type: "region" | "language", code: string): string {
  try {
    return new Intl.DisplayNames([navigator.language || "en"], { type }).of(code) ?? code;
  } catch {
    return code;
  }
}

export const countryDisplayName = (code: string) => displayName("region", code);
export const languageDisplayName = (code: string) => displayName("language", code);

/** Formats an amount in the record's currency, falling back to the platform currency. */
export function formatMoney(amount: number | null | undefined, currency?: string | null): string {
  const value = Number(amount ?? 0);
  currency ||= platformCurrency();
  if (!currency) return value.toLocaleString();
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
}

/** Formats minor units (cents) with two decimals in the given or platform currency. */
export function formatCents(cents: number | null | undefined, currency?: string | null): string {
  const value = Number(cents ?? 0) / 100;
  const code = currency || platformCurrency();
  const amount = value.toFixed(2);
  return code ? `${amount} ${code}` : amount;
}
