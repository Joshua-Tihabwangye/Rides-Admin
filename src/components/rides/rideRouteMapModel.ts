import type { AdminRideStopResponse } from "../../services/api/adminApi";

export type MapPoint = { lat: number; lng: number };

export function validRideRouteStops(stops: AdminRideStopResponse[]): AdminRideStopResponse[] {
  return stops.filter(
    (stop) =>
      Number.isFinite(stop.latitude) &&
      Number.isFinite(stop.longitude) &&
      !(stop.latitude === 0 && stop.longitude === 0),
  );
}

export function rideRoutePathPoints(route?: Record<string, unknown>): MapPoint[] {
  const raw = route?.path ?? route?.points ?? route?.polyline;
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((point) => {
    if (!point || typeof point !== "object") return [];
    const value = point as Record<string, unknown>;
    const lat = Number(value.lat ?? value.latitude);
    const lng = Number(value.lng ?? value.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng) ? [{ lat, lng }] : [];
  });
}

export function rideRouteMapPoints(
  stops: AdminRideStopResponse[],
  route?: Record<string, unknown>,
): MapPoint[] {
  const routePoints = rideRoutePathPoints(route);
  return routePoints.length > 1
    ? routePoints
    : validRideRouteStops(stops).map((stop) => ({ lat: stop.latitude, lng: stop.longitude }));
}

export function rideRouteMapCenter(points: MapPoint[]): MapPoint | undefined {
  if (points.length === 0) return undefined;
  return {
    lat: points.reduce((sum, point) => sum + point.lat, 0) / points.length,
    lng: points.reduce((sum, point) => sum + point.lng, 0) / points.length,
  };
}
