import { describe, expect, it } from "vitest";
import {
  DELIVERY_STATUS,
  DELIVERY_STATUS_FILTER_OPTIONS,
  getDeliveryStatusBadgeConfig,
  getDeliveryStatusFilterOptions,
  getDeliveryStatusLabel,
  normalizeDeliveryStatus,
} from "./deliveryStatus";

describe("deliveryStatus", () => {
  describe("normalizeDeliveryStatus", () => {
    it.each(DELIVERY_STATUS)(
      "normalizes the canonical backend status %s",
      (status) => {
        expect(normalizeDeliveryStatus(status)).toBe(status);
        expect(normalizeDeliveryStatus(status.toLowerCase())).toBe(status);
      },
    );

    it("returns null for values not supported by the backend enum", () => {
      expect(normalizeDeliveryStatus("pending")).toBeNull();
      expect(normalizeDeliveryStatus("confirmed")).toBeNull();
      expect(normalizeDeliveryStatus("failed")).toBeNull();
      expect(normalizeDeliveryStatus("")).toBeNull();
    });
  });

  describe("getDeliveryStatusLabel", () => {
    it.each([
      ["CREATED", "Created"],
      ["WAITING_ACCEPTANCE", "Waiting acceptance"],
      ["PAYMENT_PENDING", "Payment pending"],
      ["ACCEPTED", "Accepted"],
      ["DRIVER_ASSIGNED", "Driver assigned"],
      ["EN_ROUTE_PICKUP", "En route to pickup"],
      ["ARRIVED_PICKUP", "Arrived at pickup"],
      ["QR_VERIFIED", "QR verified"],
      ["PICKED_UP", "Picked up"],
      ["IN_TRANSIT", "In transit"],
      ["ARRIVED_DROPOFF", "Arrived at drop-off"],
      ["DELIVERED", "Delivered"],
      ["COMPLETED", "Completed"],
      ["CANCELLED", "Cancelled"],
      ["REJECTED", "Rejected"],
    ] as const)("returns a meaningful label for %s", (status, expected) => {
      expect(getDeliveryStatusLabel(status)).toBe(expected);
    });

    it("keeps unknown statuses visible instead of coercing them", () => {
      expect(getDeliveryStatusLabel("pending")).toBe("pending");
      expect(getDeliveryStatusLabel("CUSTOM_VALUE")).toBe("CUSTOM_VALUE");
    });
  });

  describe("getDeliveryStatusBadgeConfig", () => {
    it.each(DELIVERY_STATUS)(
      "returns a badge config for canonical status %s",
      (status) => {
        const config = getDeliveryStatusBadgeConfig(status);
        expect(config.label.length).toBeGreaterThan(0);
        expect(config.color.startsWith("#")).toBe(true);
        expect(config.bgColor.startsWith("rgba")).toBe(true);
      },
    );

    it("preserves unknown status values in the badge label", () => {
      const config = getDeliveryStatusBadgeConfig("MY_UNKNOWN_STATUS");
      expect(config.label).toBe("MY_UNKNOWN_STATUS");
    });
  });

  describe("filter options", () => {
    it("includes an 'All statuses' entry followed by every canonical status", () => {
      const options = getDeliveryStatusFilterOptions();
      expect(options[0]).toEqual({ value: "", label: "All statuses" });
      const statusValues = options.slice(1).map((o) => o.value);
      expect(statusValues).toEqual(DELIVERY_STATUS);
    });

    it("exposes only backend enum values as filter values", () => {
      const values = DELIVERY_STATUS_FILTER_OPTIONS.map((o) => o.value);
      for (const value of values) {
        if (value === "") continue;
        expect(DELIVERY_STATUS).toContain(value);
      }
    });

    it("does not contain legacy generic statuses", () => {
      const values = DELIVERY_STATUS_FILTER_OPTIONS.map((o) => o.value);
      expect(values).not.toContain("pending");
      expect(values).not.toContain("confirmed");
      expect(values).not.toContain("failed");
    });
  });
});
