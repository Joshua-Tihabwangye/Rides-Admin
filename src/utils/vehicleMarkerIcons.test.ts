import { describe, expect, it } from "vitest";
import { driverVehicleKind, vehicleDisplayCategory } from "./vehicleMarkerIcons";

describe("vehicleMarkerIcons vehicle classification", () => {
  describe("driverVehicleKind", () => {
    it("classifies two-wheeled types as bike", () => {
      for (const t of ["BICYCLE", "BIKE", "MOTORCYCLE", "SCOOTER"]) {
        expect(driverVehicleKind(t)).toBe("bike");
      }
    });

    it("classifies everything else as car", () => {
      for (const t of ["SEDAN", "SUV", "HATCHBACK", "VAN", "TRUCK", undefined]) {
        expect(driverVehicleKind(t)).toBe("car");
      }
    });

    it("is case-insensitive", () => {
      expect(driverVehicleKind("scooter")).toBe("bike");
    });
  });

  describe("vehicleDisplayCategory", () => {
    it("classifies two-wheeled types as bike (regression: SCOOTER used to show a car in the popup)", () => {
      for (const t of ["BICYCLE", "BIKE", "MOTORCYCLE", "SCOOTER"]) {
        expect(vehicleDisplayCategory(t)).toBe("bike");
      }
      // The popup and the map marker must agree on the vehicle kind.
      expect(driverVehicleKind("SCOOTER")).toBe("bike");
      expect(vehicleDisplayCategory("SCOOTER")).toBe(driverVehicleKind("SCOOTER"));
    });

    it("classifies freight-capable types as shipping", () => {
      for (const t of ["TRUCK", "VAN", "MINIVAN"]) {
        expect(vehicleDisplayCategory(t)).toBe("shipping");
      }
    });

    it("classifies passenger cars as car", () => {
      for (const t of ["SEDAN", "SUV", "HATCHBACK", "CROSSOVER", "LUXURY", undefined]) {
        expect(vehicleDisplayCategory(t)).toBe("car");
      }
    });

    it("is case-insensitive", () => {
      expect(vehicleDisplayCategory("scooter")).toBe("bike");
      expect(vehicleDisplayCategory("Van")).toBe("shipping");
    });
  });
});
