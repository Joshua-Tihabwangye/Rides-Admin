import { describe, expect, it } from "vitest";
import type { AdminRideStopResponse } from "../../services/api/adminApi";
import {
  rideRouteMapCenter,
  rideRouteMapPoints,
  rideRoutePathPoints,
  validRideRouteStops,
} from "./rideRouteMapModel";

function stop(overrides: Partial<AdminRideStopResponse>): AdminRideStopResponse {
  return {
    id: overrides.id ?? `stop-${overrides.sequence ?? 1}`,
    sequence: overrides.sequence ?? 1,
    type: overrides.type ?? "STOP",
    address: overrides.address ?? "Kampala",
    latitude: overrides.latitude ?? 0.3476,
    longitude: overrides.longitude ?? 32.5825,
    status: overrides.status ?? "PENDING",
    ...overrides,
  };
}

describe("rideRouteMapModel", () => {
  it("filters unusable stop coordinates before map rendering", () => {
    const stops = [
      stop({ id: "pickup", sequence: 1, type: "PICKUP", latitude: 0.3476, longitude: 32.5825 }),
      stop({ id: "zero", sequence: 2, latitude: 0, longitude: 0 }),
      stop({ id: "nan", sequence: 3, latitude: Number.NaN, longitude: 32.6 }),
    ];

    expect(validRideRouteStops(stops).map((item) => item.id)).toEqual(["pickup"]);
    expect(rideRouteMapPoints(stops)).toEqual([]);
  });

  it("uses backend route path points when at least two valid points exist", () => {
    const stops = [
      stop({ id: "pickup", latitude: 0.3476, longitude: 32.5825 }),
      stop({ id: "dropoff", sequence: 2, latitude: 0.32, longitude: 32.59 }),
    ];
    const route = {
      path: [
        { latitude: 0.35, longitude: 32.58 },
        { lat: "0.36", lng: "32.59" },
        { lat: "missing", lng: 32.6 },
      ],
    };

    expect(rideRoutePathPoints(route)).toEqual([
      { lat: 0.35, lng: 32.58 },
      { lat: 0.36, lng: 32.59 },
    ]);
    expect(rideRouteMapPoints(stops, route)).toEqual([
      { lat: 0.35, lng: 32.58 },
      { lat: 0.36, lng: 32.59 },
    ]);
  });

  it("reads GeoJSON coordinate paths from route geometry", () => {
    expect(
      rideRoutePathPoints({
        geometry: {
          coordinates: [
            [32.5825, 0.3476],
            [32.59, 0.36],
          ],
        },
      }),
    ).toEqual([
      { lat: 0.3476, lng: 32.5825 },
      { lat: 0.36, lng: 32.59 },
    ]);
  });

  it("decodes encoded route polylines", () => {
    expect(rideRoutePathPoints({ polyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@" })).toEqual([
      { lat: 38.5, lng: -120.2 },
      { lat: 40.7, lng: -120.95 },
      { lat: 43.252, lng: -126.453 },
    ]);
  });

  it("returns a stable center for all rendered map points", () => {
    expect(
      rideRouteMapCenter([
        { lat: 0.34, lng: 32.58 },
        { lat: 0.36, lng: 32.6 },
      ]),
    ).toEqual({ lat: 0.35, lng: 32.59 });
    expect(rideRouteMapCenter([])).toBeUndefined();
  });
});
