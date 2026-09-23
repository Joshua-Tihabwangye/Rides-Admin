import type { AdminRideStopResponse } from "../../services/api/adminApi";

export type MapPoint = { lat: number; lng: number };

function toMapPoint(value: unknown): MapPoint | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const lat = Number(record.lat ?? record.latitude);
  const lng = Number(record.lng ?? record.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

function coordinatesToPoints(raw: unknown): MapPoint[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry) => {
    if (Array.isArray(entry) && Array.isArray(entry[0])) return coordinatesToPoints(entry);
    if (Array.isArray(entry) && entry.length >= 2) {
      const first = Number(entry[0]);
      const second = Number(entry[1]);
      if (!Number.isFinite(first) || !Number.isFinite(second)) return [];
      const looksLikeGeoJson = Math.abs(first) > 1 || Math.abs(second) <= 1;
      return looksLikeGeoJson ? [{ lat: second, lng: first }] : [{ lat: first, lng: second }];
    }
    const point = toMapPoint(entry);
    return point ? [point] : [];
  });
}

function decodePolyline(encoded: string): MapPoint[] {
  const points: MapPoint[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    const point = { lat: lat / 1e5, lng: lng / 1e5 };
    if (Number.isFinite(point.lat) && Number.isFinite(point.lng)) points.push(point);
  }

  return points;
}

export function validRideRouteStops(stops: AdminRideStopResponse[]): AdminRideStopResponse[] {
  return stops.filter(
    (stop) =>
      Number.isFinite(stop.latitude) &&
      Number.isFinite(stop.longitude) &&
      !(stop.latitude === 0 && stop.longitude === 0),
  );
}

export function rideRoutePathPoints(route?: Record<string, unknown>): MapPoint[] {
  if (!route) return [];
  const geometry = route.geometry && typeof route.geometry === "object" ? (route.geometry as Record<string, unknown>) : undefined;
  const overviewPolyline =
    route.overview_polyline && typeof route.overview_polyline === "object"
      ? (route.overview_polyline as Record<string, unknown>)
      : undefined;
  const encoded = route.polyline ?? route.encodedPolyline ?? route.encoded_polyline ?? overviewPolyline?.points;
  if (typeof encoded === "string" && encoded.trim()) return decodePolyline(encoded);
  return coordinatesToPoints(route.path ?? route.points ?? route.coordinates ?? geometry?.coordinates);
}

export function rideRouteMapPoints(
  stops: AdminRideStopResponse[],
  route?: Record<string, unknown>,
): MapPoint[] {
  const routePoints = rideRoutePathPoints(route);
  return routePoints.length > 1 ? routePoints : [];
}

export function rideRouteMapCenter(points: MapPoint[]): MapPoint | undefined {
  if (points.length === 0) return undefined;
  return {
    lat: points.reduce((sum, point) => sum + point.lat, 0) / points.length,
    lng: points.reduce((sum, point) => sum + point.lng, 0) / points.length,
  };
}
